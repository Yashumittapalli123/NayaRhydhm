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

function ytdlp(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['-m', 'yt_dlp', ...args]);
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.slice(-400)));
    });
  });
}

// Search YouTube
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const raw = await ytdlp(['--dump-json', '--flat-playlist', `ytsearch6:${q}`]);
    const songs = raw.trim().split('\n').filter(Boolean).map(line => {
      try {
        const d = JSON.parse(line);
        return {
          id: d.id,
          title: d.title,
          url: `https://www.youtube.com/watch?v=${d.id}`,
          duration: d.duration || 0,
          thumbnail: d.thumbnail || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
        };
      } catch { return null; }
    }).filter(Boolean);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch metadata for a URL
app.get('/api/metadata', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const raw = await ytdlp(['--dump-json', '--no-playlist', url]);
    const d = JSON.parse(raw);
    res.json({
      id: d.id,
      title: d.title,
      url,
      duration: d.duration || 0,
      thumbnail: d.thumbnail || `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get streamable audio URL and proxy it
app.get('/api/stream', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  
  // Run ytdlp async without await
  ytdlp([
    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
    '--get-url',
    '--no-playlist',
    url
  ])
    .then(audioUrl => {
      const cleanUrl = audioUrl.trim().split('\n')[0];
      if (!cleanUrl) throw new Error('No audio URL found');
      
      console.log('[stream] Got URL, starting stream');
      
      // Use http/https module for reliable streaming
      const protocol = cleanUrl.startsWith('https') ? https : http;
      const options = {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
      };
      if (req.headers.range) {
        options.headers.Range = req.headers.range;
      }
      
      const getReq = protocol.get(cleanUrl, options, (audioRes) => {
        console.log('[stream] Received response:', audioRes.statusCode, audioRes.headers['content-type']);
        
        if (audioRes.statusCode !== 200 && audioRes.statusCode !== 206) {
          res.status(502).json({ error: `YouTube returned ${audioRes.statusCode}` });
          return;
        }
        
        const headers = {
          'Content-Type': audioRes.headers['content-type'] || 'audio/mp4',
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache'
        };
        
        if (audioRes.headers['content-length']) headers['Content-Length'] = audioRes.headers['content-length'];
        if (audioRes.headers['content-range']) headers['Content-Range'] = audioRes.headers['content-range'];
        
        res.writeHead(audioRes.statusCode, headers);
        
        audioRes.pipe(res);
        audioRes.on('error', (err) => {
          console.error('[stream read error]', err.message);
          res.end();
        });
      });
      
      getReq.on('error', (err) => {
        console.error('[stream request error]', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Failed to fetch audio from YouTube' });
        }
      });
      
      getReq.setTimeout(30000, () => {
        console.error('[stream timeout]');
        getReq.destroy();
      });
    })
    .catch(err => {
      console.error('[stream ytdlp error]', err.message);
      res.status(500).json({ error: err.message });
    });
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