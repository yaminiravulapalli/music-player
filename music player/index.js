// 🎵 ProMusic — Working Version
// Handles playback, queue, progress bar, and debug logs.

console.log("✅ ProMusic player initialized.");

// ✅ Playlist: make sure these MP3 names match your actual files
const playlist = [
  { title: "Inthandham", artist: "Artist A", src: "Inthandham.mp3", color: "linear-gradient(135deg,#6c5ce7,#00d4ff)", initial: "I" },
  { title: "Kammani", artist: "Artist B", src: "kammani.mp3", color: "linear-gradient(135deg,#00cec9,#55efc4)", initial: "K" },
  { title: "Manase Theeyaga", artist: "Artist C", src: "Manase Theeyaga.mp3", color: "linear-gradient(135deg,#ff7675,#fd79a8)", initial: "M" }
];

// ✅ DOM Elements
const playBtn = document.querySelector(".controls .play");
const prevBtn = document.querySelector(".controls button:nth-child(1)");
const nextBtn = document.querySelector(".controls button:nth-child(3)");
const fillBar = document.querySelector(".fill");
const bar = document.querySelector(".bar");
const titleEl = document.querySelector(".track-info h2");
const artistEl = document.querySelector(".track-info p");
const initialEl = document.querySelector(".big");
const artCircle = document.querySelector(".art-circle");
const queueList = document.querySelector(".queue ul");
const currentTimeEl = document.querySelector(".progress span:nth-child(1)");
const durationEl = document.querySelector(".progress span:nth-child(3)");
const albumCards = document.querySelectorAll(".album");

// ✅ Create audio element
const audio = new Audio();
let index = 0;
let isPlaying = false;

// ✅ Load a song
function loadSong(i) {
  const song = playlist[i];
  audio.src = song.src;
  titleEl.textContent = song.title;
  artistEl.textContent = song.artist;
  initialEl.textContent = song.initial;
  artCircle.style.background = song.color;
  document.body.style.background = `radial-gradient(circle at top left, #1a2035, #090d17), ${song.color}`;

  highlightAlbum(i);
  updateQueueHighlight(i);

  console.log(`🎶 Loaded: ${song.title} (${song.src})`);
}

// ✅ Play or Pause
function playPause() {
  if (!isPlaying) {
    audio.play().then(() => {
      isPlaying = true;
      playBtn.textContent = "⏸";
      console.log("▶️ Playing");
    }).catch(err => {
      console.error("⚠️ Play failed (probably blocked by autoplay rules):", err);
    });
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "▶";
    console.log("⏸ Paused");
  }
}

// ✅ Next & Previous
function nextSong() {
  index = (index + 1) % playlist.length;
  loadSong(index);
  audio.play();
  isPlaying = true;
  playBtn.textContent = "⏸";
}

function prevSong() {
  index = (index - 1 + playlist.length) % playlist.length;
  loadSong(index);
  audio.play();
  isPlaying = true;
  playBtn.textContent = "⏸";
}

// ✅ Progress bar update
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    fillBar.style.width = `${progressPercent}%`;

    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

// ✅ Format time helper
function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// ✅ Song end → next
audio.addEventListener("ended", nextSong);

// ✅ Seek by clicking progress bar
bar.addEventListener("click", (e) => {
  const barWidth = bar.clientWidth;
  const clickX = e.offsetX;
  audio.currentTime = (clickX / barWidth) * audio.duration;
});

// ✅ Build queue
function buildQueue() {
  queueList.innerHTML = "";
  playlist.forEach((song, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <h4>${song.title}</h4>
      <p>${song.artist}</p>
    `;
    li.onclick = () => {
      index = i;
      loadSong(index);
      audio.play();
      isPlaying = true;
      playBtn.textContent = "⏸";
    };
    queueList.appendChild(li);
  });
}
buildQueue();

// ✅ Highlight queue
function updateQueueHighlight(i) {
  const allLi = queueList.querySelectorAll("li");
  allLi.forEach((li, idx) => {
    li.style.background = idx === i ? "rgba(108,92,231,0.12)" : "rgba(255,255,255,0.02)";
  });
}

// ✅ Highlight album
function highlightAlbum(i) {
  albumCards.forEach((card, idx) => {
    card.style.outline = idx === i ? "2px solid rgba(108,92,231,0.5)" : "none";
  });
}

// ✅ Album card click → play that song
albumCards.forEach((card, i) => {
  card.addEventListener("click", () => {
    index = i;
    loadSong(index);
    audio.play();
    isPlaying = true;
    playBtn.textContent = "⏸";
  });
});

// ✅ Buttons
playBtn.addEventListener("click", playPause);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

// ✅ When metadata loaded
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

// ✅ Initial setup
loadSong(index);
console.log("🎧 Ready — click ▶ to play");
