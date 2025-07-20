// js/script.js

// --- KONFIGURASI ---
const apiKey = '8c79e8986ea53efac75026e541207aa3';
const apiUrlBase = 'https://api.themoviedb.org/3';
const imageCardBaseUrl = 'https://image.tmdb.org/t/p/w500';

const streamingServers = [
    { name: "Vidsrc.to", movieUrl: `https://vidsrc.to/embed/movie/`, tvUrl: `https://vidsrc.to/embed/tv/` },
    { name: "Vidlink", movieUrl: `https://vidlink.pro/movie/`, tvUrl: `https://vidlink.pro/tv/` }
];
const downloadUrl = {
    movie: `https://dl.vidsrc.vip/movie/`,
    tv: `https://dl.vidsrc.vip/tv/`
};

// --- ELEMEN DOM ---
const contentContainer = document.getElementById('content-sections');
const searchInput = document.getElementById('search-input');
// Modal elements
const playerModal = document.getElementById('player-modal');
const playerContainer = document.getElementById('player-container');
const closeModalBtn = document.getElementById('close-modal-btn');
const serverButtonsContainer = document.getElementById('server-buttons');
const downloadButtonContainer = document.getElementById('download-button-container');
const tvControlsContainer = document.getElementById('tv-controls-container');
const seasonSelect = document.getElementById('season-select');
const episodeList = document.getElementById('episode-list');

// --- STATE MANAGEMENT ---
let currentContent = {
    id: null,
    type: null, // 'movie' or 'tv'
    season: 1,
    episode: 1
};
let currentServerIndex = 0;

// --- FUNGSI API ---
async function fetchData(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${apiUrlBase}/${endpoint}${separator}api_key=${apiKey}&language=en-US`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) { console.error("Fetch Error:", error); return null; }
}

// --- FUNGSI RENDER TAMPILAN ---
function createContentCard(content) {
    if (!content.poster_path) return null;
    const card = document.createElement('div');
    card.className = 'block group cursor-pointer';
    // 'media_type' ada di trending/search, 'name' untuk TV, 'title' untuk Movie
    const title = content.title || content.name;
    const mediaType = content.media_type || (content.title ? 'movie' : 'tv');
    
    card.addEventListener('click', () => openPlayerModal(content.id, mediaType));
    card.innerHTML = `<img src="${imageCardBaseUrl}${content.poster_path}" alt="${title}" class="rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300">`;
    return card;
}

function createSection(title, contents) {
    const section = document.createElement('section');
    section.className = 'mb-12';
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';
    contents.forEach(content => {
        const card = createContentCard(content);
        if (card) grid.appendChild(card);
    });
    section.innerHTML = `<h2 class="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">${title}</h2>`;
    section.appendChild(grid);
    return section;
}

// --- FUNGSI MODAL PLAYER & KONTROL ---
async function openPlayerModal(id, type) {
    currentContent.id = id;
    currentContent.type = type;
    
    playerModal.classList.remove('hidden');
    playerContainer.innerHTML = `<p class="text-center text-xl animate-pulse p-8">Loading...</p>`;
    serverButtonsContainer.innerHTML = '';
    downloadButtonContainer.innerHTML = '';
    tvControlsContainer.classList.add('hidden');

    if (type === 'tv') {
        const tvData = await fetchData(`tv/${id}`);
        if (!tvData) { closePlayerModal(); return; }
        
        tvControlsContainer.classList.remove('hidden');
        seasonSelect.innerHTML = '';
        tvData.seasons.forEach(season => {
            if (season.season_number > 0) { // Abaikan season 0 (Specials)
                const option = document.createElement('option');
                option.value = season.season_number;
                option.innerText = season.name;
                seasonSelect.appendChild(option);
            }
        });
        
        seasonSelect.onchange = () => {
            currentContent.season = seasonSelect.value;
            renderEpisodes(id, seasonSelect.value);
        };
        
        currentContent.season = 1;
        currentContent.episode = 1;
        renderEpisodes(id, 1);

    } else { // type === 'movie'
        currentContent.season = null;
        currentContent.episode = null;
        updatePlayer();
    }
    
    renderActionButtons();
}

async function renderEpisodes(tvId, seasonNumber) {
    const seasonData = await fetchData(`tv/${tvId}/season/${seasonNumber}`);
    episodeList.innerHTML = '';
    if (!seasonData || !seasonData.episodes) return;

    seasonData.episodes.forEach(ep => {
        const epButton = document.createElement('button');
        epButton.className = 'episode-btn border border-gray-600 rounded px-3 py-1 text-xs hover:bg-red-700 hover:border-red-700';
        epButton.innerText = `E${ep.episode_number}`;
        epButton.onclick = () => {
            currentContent.episode = ep.episode_number;
            updatePlayer();
            // Update active button
            episodeList.querySelectorAll('.episode-btn').forEach(btn => btn.classList.remove('active'));
            epButton.classList.add('active');
        };
        episodeList.appendChild(epButton);
    });
    
    // Auto-play first episode of the season and mark as active
    if (seasonData.episodes.length > 0) {
        currentContent.episode = 1;
        updatePlayer();
        episodeList.querySelector('.episode-btn')?.classList.add('active');
    }
}

function renderActionButtons() {
    // Render Server Buttons
    serverButtonsContainer.innerHTML = '';
    streamingServers.forEach((server, index) => {
        const button = document.createElement('button');
        button.innerText = server.name;
        button.className = 'server-btn bg-gray-700 hover:bg-red-600 px-4 py-1 rounded text-sm transition-colors';
        button.onclick = () => {
            currentServerIndex = index;
            updatePlayer();
        };
        serverButtonsContainer.appendChild(button);
    });

    // Render Download Button
    downloadButtonContainer.innerHTML = '';
    const downloadLink = document.createElement('a');
    let dlUrl = '';
    if (currentContent.type === 'movie') {
        dlUrl = `${downloadUrl.movie}${currentContent.id}`;
    } else { // tv
        dlUrl = `${downloadUrl.tv}${currentContent.id}`;
    }
    downloadLink.href = dlUrl;
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener noreferrer';
    downloadLink.className = 'bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1 rounded text-sm transition-transform hover:scale-105 inline-block';
    downloadLink.innerText = 'Download';
    downloadButtonContainer.appendChild(downloadLink);

    updatePlayer(); // Initial player load and button state
}

function updatePlayer() {
    if (!currentContent.id) return;

    const server = streamingServers[currentServerIndex];
    let streamingUrl = '';

    if (currentContent.type === 'movie') {
        streamingUrl = `${server.movieUrl}${currentContent.id}`;
    } else { // tv
        streamingUrl = `${server.tvUrl}${currentContent.id}?s=${currentContent.season}&e=${currentContent.episode}`;
        // Note: format `?s=..&e=..` is common, might need adjustment per source. For Vidsrc & Vidlink, this should work.
    }
    
    playerContainer.innerHTML = `<iframe class="w-full h-full" src="${streamingUrl}" frameborder="0" allowfullscreen></iframe>`;
    
    // Update active server button
    const buttons = serverButtonsContainer.querySelectorAll('.server-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('active', index === currentServerIndex);
    });
}

function closePlayerModal() {
    playerModal.classList.add('hidden');
    playerContainer.innerHTML = ''; 
    currentContent = { id: null, type: null, season: 1, episode: 1 };
}

// --- FUNGSI LOGIKA HALAMAN ---
async function initializeHomepage() {
    contentContainer.innerHTML = '<p class="text-center text-xl animate-pulse">Memuat konten populer...</p>';
    const [trending] = await Promise.all([
        fetchData('trending/all/week'), // Mengambil movie dan tv sekaligus
    ]);
    contentContainer.innerHTML = '';
    if (trending) contentContainer.appendChild(createSection('Trending Minggu Ini', trending.results));
}

async function searchContent(query) {
    const trimmedQuery = query.trim();
    if (trimmedQuery === '') { initializeHomepage(); return; }
    contentContainer.innerHTML = `<p class="text-center text-xl animate-pulse">Mencari "${trimmedQuery}"...</p>`;
    const searchData = await fetchData(`search/multi?query=${encodeURIComponent(trimmedQuery)}`);
    contentContainer.innerHTML = '';
    if (searchData && searchData.results.length > 0) {
        // Filter out people from search results
        const filteredResults = searchData.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');
        contentContainer.appendChild(createSection(`Hasil untuk "${trimmedQuery}"`, filteredResults));
    } else {
        contentContainer.innerHTML = `<p class="text-center text-xl">Tidak ada hasil untuk "${trimmedQuery}".</p>`;
    }
}

// --- EVENT LISTENERS ---
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchContent(e.target.value), 500);
});
closeModalBtn.addEventListener('click', closePlayerModal);
playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closePlayerModal(); });
document.addEventListener('DOMContentLoaded', initializeHomepage);
