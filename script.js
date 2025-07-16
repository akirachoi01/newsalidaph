// === Global Constants ===
const API_KEY = 'ba3885a53bc2c4f3c4b5bdc1237e69a0';
const API_URL = 'https://api.themoviedb.org/3';

const GENRE_IDS = {
    'horror': 27,
    'comedy': 35,
    'thriller': 53,
    'animation': 16,
    'drama': 18
};

// === Player Module ===
const Player = (() => {
    let videoPlayer, videoFrame, closeButton, fullscreenButton;

    const initializePlayerElements = () => {
        videoPlayer = document.getElementById('videoPlayer');
        videoFrame = document.getElementById('videoFrame');

        closeButton = videoPlayer.querySelector('.close-button');
        if (!closeButton) {
            closeButton = document.createElement('button');
            closeButton.textContent = '×';
            closeButton.className = 'close-button';
            Object.assign(closeButton.style, {
                position: 'absolute', top: '10px', right: '10px',
                fontSize: '24px', background: 'rgba(0,0,0,0.5)',
                color: '#fff', border: 'none', borderRadius: '50%',
                cursor: 'pointer', zIndex: '9999', width: '30px', height: '30px'
            });
            videoPlayer.appendChild(closeButton);
        }

        fullscreenButton = videoPlayer.querySelector('.fullscreen-button');
        if (!fullscreenButton) {
            fullscreenButton = document.createElement('button');
            fullscreenButton.textContent = '⛶';
            fullscreenButton.className = 'fullscreen-button';
            Object.assign(fullscreenButton.style, {
                position: 'absolute', bottom: '10px', right: '10px',
                fontSize: '20px', background: 'rgba(0,0,0,0.5)',
                color: '#fff', border: 'none', borderRadius: '6px',
                padding: '5px 10px', cursor: 'pointer', zIndex: '9999'
            });
            videoPlayer.appendChild(fullscreenButton);
        }
    };

    const setupPlayerEventListeners = () => {
        closeButton.onclick = () => {
            videoPlayer.style.display = 'none';
            videoFrame.src = '';
            if (document.fullscreenElement) document.exitFullscreen();
        };

        fullscreenButton.onclick = () => {
            if (!document.fullscreenElement) {
                videoPlayer.requestFullscreen().catch(() => {
                    showCustomDialog('Fullscreen might be blocked by your browser.');
                });
            } else {
                document.exitFullscreen();
            }
        };
    };

    const showVideo = (id, type = 'movie') => {
        if (!videoPlayer || !videoFrame) return;

        try {
            videoFrame.src = `https://player.videasy.net/${type}/${id}?color=8B5CF6`;
            Object.assign(videoPlayer.style, {
                display: 'block', position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', width: '90%',
                maxWidth: '900px', aspectRatio: '16 / 9', backgroundColor: '#000',
                zIndex: '10000', borderRadius: '12px',
                boxShadow: '0 0 20px rgba(0,0,0,0.8)'
            });
        } catch {
            showCustomDialog('Could not load video. Please try again.');
        }
    };

    const init = () => {
        initializePlayerElements();
        setupPlayerEventListeners();
    };

    return { init, show: showVideo };
})();

// === Custom Dialog ===
const setupCustomDialog = () => {
    if (!document.getElementById('customDialog')) {
        const dialog = document.createElement('div');
        dialog.id = 'customDialog';
        Object.assign(dialog.style, {
            display: 'none', position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', backgroundColor: '#333',
            color: '#fff', padding: '20px', borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.5)', zIndex: '10002',
            maxWidth: '300px', textAlign: 'center'
        });
        dialog.innerHTML = '<p id="customDialogMessage"></p><button id="customDialogClose">OK</button>';
        document.body.appendChild(dialog);

        document.getElementById('customDialogClose').onclick = () => {
            dialog.style.display = 'none';
        };
    }
};

const showCustomDialog = (message) => {
    const dialog = document.getElementById('customDialog');
    const messageElement = document.getElementById('customDialogMessage');
    if (dialog && messageElement) {
        messageElement.textContent = message;
        dialog.style.display = 'block';
    }
};

// === API Functions ===
const fetchData = async (type, category) => {
    try {
        const res = await fetch(`${API_URL}/${type}/${category}?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await res.json();
        return data.results;
    } catch {
        showCustomDialog(`Failed to load ${category} content.`);
        return [];
    }
};

const fetchByGenre = async (mediaType, genreId) => {
    try {
        const res = await fetch(`${API_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=${genreId}&language=en-US&page=1`);
        const data = await res.json();
        return data.results;
    } catch {
        showCustomDialog('Failed to load genre content.');
        return [];
    }
};

// === Rendering Functions ===
const renderContent = (items, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!items || !items.length) {
        container.innerHTML = '<p style="color:#ccc;text-align:center;padding:20px;">No content available.</p>';
        return;
    }

    items.forEach(item => {
        const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.position = 'relative';

        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" alt="${item.title || item.name}">
            <button class="play-button">▶</button>
            <div class="movie-card-info">
                <h3>${item.title || item.name}</h3>
                <p>${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'No Year'}</p>
            </div>
        `;

        card.querySelector('img').onclick = () => Player.show(item.id, mediaType);
        card.querySelector('.play-button').onclick = (e) => {
            e.stopPropagation();
            Player.show(item.id, mediaType);
        };

        container.appendChild(card);
    });
};

// === Search ===
const performSearch = async (query) => {
    if (!query) return [];

    try {
        const movieRes = await fetch(`${API_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`);
        const tvRes = await fetch(`${API_URL}/search/tv?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`);

        const movieData = await movieRes.json();
        const tvData = await tvRes.json();

        return [...movieData.results, ...tvData.results]
            .filter(item => item.poster_path && (item.title || item.name))
            .sort((a, b) => b.popularity - a.popularity);
    } catch {
        showCustomDialog('Search failed. Try again later.');
        return [];
    }
};

const renderSearchResults = (results) => {
    const container = document.getElementById('searchResults');
    const resultsSection = document.getElementById('searchResultsSection');
    const tabbedSection = document.getElementById('tabbedContentSection');

    container.innerHTML = '';

    if (!results.length) {
        container.innerHTML = '<p style="color:#ccc;text-align:center;padding:20px;">No results found.</p>';
    } else {
        results.forEach(item => {
            const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
            const card = document.createElement('div');
            card.className = 'search-result-item';

            card.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" alt="${item.title || item.name}">
                <h3>${item.title || item.name}</h3>
                <p>${item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'No Year'}</p>
            `;

            const playButton = document.createElement('button');
            playButton.className = 'play-button';
            playButton.textContent = '▶';
            playButton.onclick = e => {
                e.stopPropagation();
                Player.show(item.id, mediaType);
            };

            card.onclick = () => Player.show(item.id, mediaType);
            card.appendChild(playButton);
            container.appendChild(card);
        });
    }

    resultsSection.style.display = 'block';
    tabbedSection.style.display = 'none';
};

// === Category Navigation ===
const loadCategoryContent = async (category) => {
    const containerId = 'content-display-container';
    let content = [];

    switch (category) {
        case 'trending':
            content = await fetchData('trending/all', 'week'); break;
        case 'movies':
            content = await fetchData('movie', 'popular'); break;
        case 'tv':
            content = await fetchData('tv', 'popular'); break;
        case 'anime':
            content = await fetchByGenre('tv', GENRE_IDS.animation); break;
        case 'horror':
        case 'comedy':
        case 'thriller':
        case 'drama':
            content = await fetchByGenre('movie', GENRE_IDS[category]); break;
        default:
            content = await fetchData('trending/all', 'week');
    }

    renderContent(content, containerId);
};

const setupTabNavigation = () => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.onclick = () => {
            document.getElementById('searchResultsSection').style.display = 'none';
            document.getElementById('tabbedContentSection').style.display = 'block';

            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            loadCategoryContent(button.dataset.category);
        };
    });

    loadCategoryContent('trending');
};

const showDefaultCategoryContent = () => {
    document.getElementById('searchResultsSection').style.display = 'none';
    document.getElementById('tabbedContentSection').style.display = 'block';

    const trendingBtn = document.querySelector('.tab-button[data-category="trending"]');
    if (trendingBtn) {
        trendingBtn.click();
    }
};

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    Player.init();
    setupCustomDialog();

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');

    searchButton.onclick = async () => {
        const query = searchInput.value.trim();
        if (query) {
            const results = await performSearch(query);
            renderSearchResults(results);
        } else {
            showDefaultCategoryContent();
        }
    };

    searchInput.onkeypress = (e) => {
        if (e.key === 'Enter') searchButton.click();
    };

    searchInput.oninput = () => {
        if (!searchInput.value.trim()) showDefaultCategoryContent();
    };

    setupTabNavigation();
});
