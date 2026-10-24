
```javascript
const storyEl = document.getElementById('story');
const countEl = document.getElementById('count');
const createBtn = document.getElementById('create-btn');
const statusEl = document.getElementById('status');
const inputSec = document.getElementById('input-section');
const playerSec = document.getElementById('player-section');
const imgEl = document.getElementById('scene-img');
const capEl = document.getElementById('caption');
const titleEl = document.getElementById('reel-title');
const playBtn = document.getElementById('play-btn');
const newBtn = document.getElementById('new-btn');

let reel = null;

storyEl.addEventListener('input', () => {
  countEl.textContent = storyEl.value.length;
});

document.querySelectorAll('.tpl').forEach(b => {
  b.addEventListener('click', () => {
    storyEl.value = b.dataset.text;
    countEl.textContent = storyEl.value.length;
  });
});

createBtn.addEventListener('click', async () => {
  const story = storyEl.value.trim();
  if (!story) {
    statusEl.textContent = 'कृपया पहले कहानी लिखें।';
    return;
  }

  createBtn.disabled = true;
  statusEl.textContent = 'AI आपकी रील बना रहा है... 1-2 मिनट लगेंगे ⏳';

  try {
    const res = await fetch('/api/create-reel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');

    reel = data;

    await Promise.all(
      reel.scenes.map(
        s =>
          new Promise(r => {
            const im = new Image();
            im.onload = r;
            im.onerror = r;
            im.src = s.image;
          })
      )
    );

    titleEl.textContent = data.title;
    inputSec.classList.add('hidden');
    playerSec.classList.remove('hidden');
    imgEl.src = reel.scenes[0].image;
    capEl.textContent = reel.scenes[0].narration;
    statusEl.textContent = '';
  } catch (e) {
    statusEl.textContent = e.message;
  } finally {
    createBtn.disabled = false;
  }
});

function playScene(i) {
  return new Promise(resolve => {
    const s = reel.scenes[i];
    imgEl.src = s.image;
    capEl.textContent = s.narration;

    const u = new SpeechSynthesisUtterance(s.narration);
    u.lang = 'hi-IN';
    u.rate = 0.95;
    const voices = speechSynthesis.getVoices();
    const hindi = voices.find(v => v.lang && v.lang.startsWith('hi'));
    if (hindi) u.voice = hindi;
    u.onend = resolve;
    u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

async function playReel() {
  playBtn.disabled = true;
  for (let i = 0; i < reel.scenes.length; i++) {
    await playScene(i);
  }
  playBtn.disabled = false;
}

playBtn.addEventListener('click', playReel);

newBtn.addEventListener('click', () => {
  playerSec.classList.add('hidden');
  inputSec.classList.remove('hidden');
  storyEl.value = '';
  countEl.textContent = '0';
});
```
