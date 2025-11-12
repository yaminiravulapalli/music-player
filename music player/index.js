// Advanced player JS
// Preserves your playlist entries (update src filenames as needed)
const playlist = [
  { title: "Inthandham", artist: "Artist A", src: "Inthandham.mp3", art: "" },
  { title: "Kammani", artist: "Artist B", src: "kammani.mp3", art: "" },
  { title: "Manase Theeyaga", artist: "Artist C", src: "Manase Theeyaga.mp3", art: "" }
];

// DOM elements
const audio = document.getElementById("audio"),
  titleEl = document.getElementById("title"),
  artistEl = document.getElementById("artist"),
  playBtn = document.getElementById("play"),
  prevBtn = document.getElementById("prev"),
  nextBtn = document.getElementById("next"),
  progress = document.getElementById("progress"),
  currentEl = document.getElementById("current"),
  durationEl = document.getElementById("duration"),
  playlistEl = document.getElementById("playlist"),
  albumArt = document.getElementById("albumArt"),
  visualizerCanvas = document.getElementById("visualizer"),
  favBtn = document.getElementById("fav"),
  volumeEl = document.getElementById("volume"),
  shuffleBtn = document.getElementById("shuffle"),
  repeatBtn = document.getElementById("repeat"),
  playlistCount = document.getElementById("playlistCount"),
  albumWrap = document.querySelector(".album-wrap"),
  playerCard = document.querySelector(".player-card");

let index = 0;
let isPlaying = false;
let shuffle = false;
let repeatMode = "off"; // off, one, all
let audioContext, analyser, sourceNode;
let animationFrameId;

// Setup basic UI/playlist
function initPlaylist() {
  playlistEl.innerHTML = "";
  playlist.forEach((s, i) => {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.innerHTML = `<span class="pl-title">${s.title}</span><small class="pl-artist">${s.artist}</small>`;
    li.onclick = () => loadSong(i, true);
    li.onkeypress = (e) => { if (e.key === "Enter") loadSong(i, true); };
    playlistEl.appendChild(li);
  });
  playlistCount.textContent = `${playlist.length} tracks`;
}
initPlaylist();

// Load song
function loadSong(i, play = false) {
  index = ((i % playlist.length) + playlist.length) % playlist.length;
  audio.src = playlist[index].src;
  titleEl.textContent = playlist[index].title;
  artistEl.textContent = playlist[index].artist;
  // optionally use an art property if present
  albumArt.src = playlist[index].art || placeholderArt(playlist[index].title);
  highlightPlaylist();
  if (play) playSong();
}

// Placeholder album art generator (simple SVG data URL)
function placeholderArt(text) {
  const initials = text.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase() || "♫";
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
    <defs>
      <linearGradient id='g' x1='0' x2='1'>
        <stop offset='0' stop-color='#6c5ce7'/>
        <stop offset='1' stop-color='#00d4ff'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='240' font-family='Inter, sans-serif' fill='rgba(255,255,255,0.95)'>${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// Highlight active playlist item
function highlightPlaylist() {
  [...playlistEl.children].forEach((li, j) => li.classList.toggle("active", j === index));
}

// Play / Pause
function playSong() {
  audio.play().then(() => {
    isPlaying = true;
    playBtn.textContent = "⏸";
    playBtn.setAttribute("aria-pressed", "true");
    albumWrap.classList.add("playing");
    startVisualizer();
  }).catch(err => {
    console.warn("Playback failed:", err);
  });
}
function pauseSong() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "▶";
  playBtn.setAttribute("aria-pressed", "false");
  albumWrap.classList.remove("playing");
  stopVisualizer();
}

playBtn.onclick = () => audio.paused ? playSong() : pauseSong();

// Prev / Next
prevBtn.onclick = () => {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
  } else {
    loadSong(index - 1, true);
  }
};
nextBtn.onclick = () => {
  if (shuffle) {
    loadSong(Math.floor(Math.random() * playlist.length), true);
  } else {
    const nextIndex = index + 1;
    if (nextIndex >= playlist.length) {
      if (repeatMode === "all") loadSong(0, true);
      else if (repeatMode === "one") loadSong(index, true);
      else { pauseSong(); audio.currentTime = 0; }
    } else {
      loadSong(nextIndex, true);
    }
  }
};

// Time updates
audio.addEventListener("timeupdate", () => {
  const pct = (audio.currentTime / (audio.duration || 1)) * 100;
  progress.value = pct || 0;
  currentEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
});

// Seeking
let isSeeking = false;
progress.addEventListener("input", () => {
  isSeeking = true;
  audio.currentTime = (progress.value / 100) * audio.duration;
});
progress.addEventListener("change", () => { isSeeking = false; });

// Format time mm:ss
function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0"+sec : sec}`;
}

// Ended behaviour
audio.addEventListener("ended", () => {
  if (repeatMode === "one") {
    loadSong(index, true);
  } else {
    nextBtn.onclick();
  }
});

// Favorites toggle (UI-only)
favBtn.onclick = () => {
  const pressed = favBtn.getAttribute("aria-pressed") === "true";
  favBtn.setAttribute("aria-pressed", String(!pressed));
  favBtn.textContent = !pressed ? "♥" : "♡";
};

// Volume
volumeEl.addEventListener("input", () => {
  audio.volume = volumeEl.value;
});

// Shuffle toggle
shuffleBtn.onclick = () => {
  shuffle = !shuffle;
  shuffleBtn.style.opacity = shuffle ? "1" : "0.7";
};

// Repeat cycling
repeatBtn.onclick = () => {
  if (repeatMode === "off") repeatMode = "all";
  else if (repeatMode === "all") repeatMode = "one";
  else repeatMode = "off";
  repeatBtn.dataset.mode = repeatMode;
  repeatBtn.style.opacity = repeatMode === "off" ? "0.7" : "1";
  repeatBtn.title = `Repeat: ${repeatMode}`;
};

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
  if (e.code === "ArrowRight") nextBtn.click();
  if (e.code === "ArrowLeft") prevBtn.click();
  if (e.code === "KeyM") { audio.muted = !audio.muted; }
});

// Audio context + visualizer
function setupAudioContext() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);
}

// Visualizer draw
function startVisualizer() {
  setupAudioContext();
  const canvas = visualizerCanvas;
  const ctx = canvas.getContext("2d");
  resizeCanvas();

  function draw() {
    animationFrameId = requestAnimationFrame(draw);
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw bars
    const barWidth = canvas.width / bufferLength;
    for (let i=0;i<bufferLength;i++){
      const v = data[i] / 255;
      const h = v * canvas.height;
      const x = i * barWidth;
      const grad = ctx.createLinearGradient(0,0,0,canvas.height);
      grad.addColorStop(0, '#6c5ce7');
      grad.addColorStop(1, '#00d4ff');
      ctx.fillStyle = grad;
      ctx.fillRect(x, canvas.height - h, barWidth * 0.7, h);
    }
  }
  if (!animationFrameId) draw();
}

function stopVisualizer() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function resizeCanvas() {
  const canvas = visualizerCanvas;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
}

// handle resizing
window.addEventListener("resize", resizeCanvas);

// initialize first song
loadSong(index);

// Update duration display once metadata is loaded
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

// Build playlist items active highlight (callable)
function refreshUI() {
  highlightPlaylist();
  // update active class for album art parent
  if (!audio.paused) albumWrap.classList.add("playing"); else albumWrap.classList.remove("playing");
}
setInterval(refreshUI, 800);

// Ensure autoplay context resume on first user gesture (for browsers that restrict autoplay)
['click','touchstart','keydown'].forEach(ev => {
  window.addEventListener(ev, () => {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(()=>{});
    }
  }, {once:true});
});
