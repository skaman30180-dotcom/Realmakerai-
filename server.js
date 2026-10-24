```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const usage = {};
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  usage[ip] = (usage[ip] || []).filter(t => now - t < 3600000);
  if (usage[ip].length >= 5) {
    return res.status(429).json({ error: 'Limit reached. Try again later.' });
  }
  usage[ip].push(now);
  next();
}

async function makeScript(story) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
    GEMINI_KEY;

  const prompt =
    'You write short viral reel scripts in Hindi (Devanagari). ' +
    'Return ONLY valid JSON like {"title": "...", "scenes": [{"narration": "...", "image_prompt": "..."}]}. ' +
    'Make exactly 5 scenes. Narration max 25 words each, in Hindi. ' +
    'image_prompt must be in English, vivid and visual. Story idea: ' + story;

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  const data = await r.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

function makeImageUrl(prompt) {
  const seed = Math.floor(Math.random() * 100000);
  return (
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(prompt + ', vertical, cinematic, high detail') +
    '?width=720&height=1280&nologo=true&seed=' + seed
  );
}

app.post('/api/create-reel', rateLimit, async (req, res) => {
  try {
    const story = (req.body.story || '').trim().slice(0, 500);
    if (!story) return res.status(400).json({ error: 'Please write a story.' });

    const script = await makeScript(story);

    const scenes = script.scenes.map(s => ({
      narration: s.narration,
      image: makeImageUrl(s.image_prompt)
    }));

    res.json({ title: script.title, scenes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('ReelMaker AI running on port ' + PORT));
```
