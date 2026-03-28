require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ytSearch = require('yt-search');
const playdl = require('play-dl');
const ytDlp = require('yt-dlp-exec');

// Search YouTube
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const results = await playdl.search(q, { limit: 8, source: { youtube: 'video' } });
    const songs = results.map(v => ({
      id: v.id,
      title: v.title,
      url: v.url,
      duration: v.durationInSec || 0,
      thumbnail: v.thumbnails[0]?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    }));
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stream audio with Range request support (enables seeking)
const os = require('os');
const fs = require('fs');

// Initialize play-dl to bypass bot detection where possible
// Using better user-agent and pre-fetching tokens
const initPlaydl = async () => {
  try {
    await playdl.setToken({
      youtube: {
        cookie: process.env.YT_COOKIE || "" 
      }
    });
    console.log('[play-dl] Initialized successfully.');
  } catch (e) {
    console.warn('[play-dl] Initialization error:', e.message);
  }
};
initPlaydl();

app.get('/api/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const decodedUrl = decodeURIComponent(url);
    console.log(`[stream] Attempting direct stream for: ${decodedUrl}`);

    // Some serverless environments need fresh info for every stream
    const isVercel = !!process.env.VERCEL;
    const stream = await playdl.stream(decodedUrl, {
      quality: 0, // 0 is auto-best
      discordPlayerProxy: isVercel, // Internal optimization for serverless
      seek: 0
    });
    
    res.writeHead(200, {
      'Content-Type': stream.type || 'audio/webm',
      'Access-Control-Allow-Origin': '*',
      'Transfer-Encoding': 'chunked',
      'X-Content-Source': 'youtube-direct'
    });

    stream.stream.pipe(res);
  } catch (err) {
    console.error('[stream-error]', err.message);
    const isBot = err.message.toLowerCase().includes('bot') || err.message.toLowerCase().includes('sign in');
    if (!res.headersSent) {
      res.status(isBot ? 403 : 500).json({ 
        error: isBot ? 'YouTube Bot Detection Blocked this request. See logs.' : 'Playback could not start',
        details: err.message 
      });
    }
  }
});

// Get AI Vibe suggestions
app.post('/api/vibe', (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.NVIDIA_API_KEY;

  console.log(`[AI] Request received for vibe: "${prompt}"`);
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!apiKey) {
    // Return mock data if no key to prevent hard crash
    console.warn('[AI] Missing Key! Returning mocks.');
    return res.json({ suggestions: ["Artist - Track 1", "Artist - Track 2", "Artist - Track 3"] });
  }

  console.log('[AI] Calling NVIDIA NIM API...');
  const postData = JSON.stringify({
    model: "meta/llama-3.1-70b-instruct",
    messages: [
      { role: "system", content: "Return ONLY a list of 8 real song titles (Artist - Title) matching the user's vibe. One per line. No bullets." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const nvidiaUrl = process.env.NVIDIA_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions';
  const urlObj = new URL(nvidiaUrl);

  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const aiReq = https.request(options, (aiRes) => {
    let raw = '';
    aiRes.on('data', d => raw += d);
    aiRes.on('end', () => {
      console.log(`[AI] NVIDIA NIM response status: ${aiRes.statusCode}`);
      if (aiRes.statusCode !== 200) {
        console.error(`[AI] Error response: ${raw}`);
        return res.status(502).json({ error: 'NVIDIA API failed (Check Key)' });
      }
      try {
        const data = JSON.parse(raw);
        const text = data.choices ? data.choices[0].message.content : (data.content || '');
        const suggestions = text.split('\n')
          .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '').trim())
          .filter(line => line.length > 3)
          .slice(0, 8);
        console.log(`[AI] Succesfully generated ${suggestions.length} suggestions.`);
        res.json({ suggestions });
      } catch (e) {
        res.status(500).json({ error: 'Failed to parse AI response' });
      }
    });
  });

  aiReq.on('error', (e) => {
    console.error('[AI] Connection Error:', e.message);
    res.status(500).json({ error: 'Failed to connect to AI engine' });
  });

  aiReq.write(postData);
  aiReq.end();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─────────────────────────────────────────────────────────────────────────────
// Production Static Serving
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Start listener only if not on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] NayaRhydhm backend running on port ${PORT}`);
  });
}

module.exports = app;