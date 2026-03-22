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

// Get streamable audio URL and proxy it
app.get('/api/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  
  try {
    const decodedUrl = decodeURIComponent(url);
    console.log(`[stream] Optimizing resolution for: ${decodedUrl}`);
    
    // Set mandatory headers early for immediate buffering
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      // ENGINE 1: Native Binary (Best for Local Windows)
      console.log('[stream] Attempting Native Engine...');
      const stream = ytDlp.exec(decodedUrl, {
        output: '-', format: 'bestaudio', limitRate: '1M',
      }, { stdio: ['ignore', 'pipe', 'ignore'] });
      
      stream.stdout.pipe(res);
      stream.on('error', (e) => { throw e; });

    } catch (e) {
      // ENGINE 2: Cloud Fallback (Best for Render/Vercel)
      console.warn('[stream] Native Engine unavailable, falling back to Cloud Engine...');
      const stream = await playdl.stream(decodedUrl, { quality: 1 });
      stream.stream.pipe(res);
    }

  } catch (err) {
    console.error('[stream-global-error]', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Playback could not start' });
    else res.end();
  }
});

// Get AI Vibe suggestions
app.post('/api/vibe', (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.NVIDIA_API_KEY;

  console.log(`[AI] Request received for vibe: "${prompt}"`);
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!apiKey) return res.status(500).json({ error: 'NVIDIA_API_KEY is not configured on the server.' });

  console.log('[AI] Calling NVIDIA NIM API...');
  const postData = JSON.stringify({
    model: "meta/llama-3.1-70b-instruct",
    messages: [
      { role: "system", content: "Return ONLY a list of 8 real song titles (Artist - Title) matching the user's vibe. One per line. No bullets." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const nvidiaUrl = process.env.NVIDIA_API_URL;
  if (!nvidiaUrl) return res.status(500).json({ error: 'NVIDIA_API_URL is not configured on the server.' });
  const urlObj = new URL(nvidiaUrl);

  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': postData.length
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

app.listen(PORT, () => {
  console.log(`[Server] NayaRhydhm backend running on port ${PORT}`);
  if (!process.env.NVIDIA_API_KEY) {
    console.warn('[Warning] NVIDIA_API_KEY is missing! Using mock suggestions.');
  }
});