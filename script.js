const apiKey = 'ba3885a53bc2c4f3c4b5bdc1237e69a0';
const baseUrl = 'https://api.themoviedb.org/3';
const imageBase = 'https://image.tmdb.org/t/p/w500';

// Initialize Shaka Player
let player;
document.addEventListener('DOMContentLoaded', () => {
  if (shaka.Player.isBrowserSupported()) {
    const video = document.getElementById('shakaVideo');
    player = new shaka.Player(video);
  } else {
    alert('Shaka Player is not supported.');
  }

  loadCategory('trending');

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.tab-button.active')?.classList.remove('active');
      btn.classList.add('active');
      loadCategory(btn.dataset.category);
    });
  });

  document.getElementById('searchButton').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value;
    if (query.trim()) searchTMDB(query);
  });
});

// Load category (e.g. trending, movies, etc.)
function loadCategory(category) {
  document.getElementById('searchResultsSection').style.display = 'none';
  document.getElementById('tabbedContentSection').style.display = 'block';

  let url = `${baseUrl}/trending/movie/week?api_key=${apiKey}`;
  if (category === 'movies') url = `${baseUrl}/movie/popular?api_key=${apiKey}`;
  else if (category === 'tv') url = `${baseUrl}/tv/popular?api_key=${apiKey}`;
  else if (category === 'anime') url = `${baseUrl}/discover/tv?api_key=${apiKey}&with_genres=16`;
  else if (category === 'horror') url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=27`;
  else if (category === 'comedy') url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=35`;
  else if (category === 'thriller') url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=53`;
  else if (category === 'drama') url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_genres=18`;

  fetch(url)
    .then(res => res.json())
    .then(data => showMovies(data.results, 'content-display-container'));
}

function searchTMDB(query) {
  const url = `${baseUrl}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById('searchResultsSection').style.display = 'block';
      document.getElementById('tabbedContentSection').style.display = 'none';
      showMovies(data.results, 'searchResults');
    });
}

function showMovies(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    const title = item.title || item.name;
    const poster = item.poster_path ? imageBase + item.poster_path : '';
    const id = item.id;

    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <img src="${poster}" alt="${title}">
      <div class="movie-card-info">
        <h3>${title}</h3>
        <p>${item.release_date || item.first_air_date || ''}</p>
      </div>
      <button class="play-button" data-id="${id}" data-title="${title}">▶</button>
    `;

    card.querySelector('.play-button').addEventListener('click', e => {
      const movieTitle = e.target.dataset.title;
      playWithShaka(getSampleStream(movieTitle));
    });

    container.appendChild(card);
  });
}

// Dummy stream mapping (you can replace with real mpd URLs)
function getSampleStream(title) {
  // You can improve this with actual TMDB video data + backend
  const fallback = 'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';
  return fallback;
}

// Play with Shaka
async function playWithShaka(url) {
  try {
    await player.load(url);
    document.getElementById('videoPlayer').style.display = 'block';
  } catch (error) {
    alert('Error loading video stream');
    console.error(error);
  }
}

// Close on outside click
window.addEventListener('click', function(e) {
  const modal = document.getElementById('videoPlayer');
  if (e.target === modal) {
    modal.style.display = 'none';
    document.getElementById('shakaVideo').pause();
  }
});
