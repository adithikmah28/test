// js/script.js

// --- KONFIGURASI ---
const apiKey = '8c79e8986ea53efac75026e541207aa3'; // <-- WAJIB GANTI INI
const apiUrlBase = 'https://api.themoviedb.org/3';
const imageCardBaseUrl = 'https://image.tmdb.org/t/p/w500';

// Definisikan sumber-sumber kita
const streamingServers = [
    { name: "Vidsrc.to", urlTemplate: `https://vidsrc.to/embed/movie/` },
    { name: "Vidlink", urlTemplate: `https://vidlink.pro/embed/` }
];
const downloadUrlTemplate = `https://dl.vidsrc.vip/movie/`;


// --- ELEMEN DOM ---
const movieSectionsContainer = document.getElementById('movie-sections');
const searchInput = document.getElementById('search-input');
const playerModal = document.getElementById('player-modal');
const playerContainer = document.getElementById('player-container');
const closeModalBtn = document.getElementById('close-modal-btn');
const serverButtonsContainer = document.getElementById('server-buttons');
const downloadButtonContainer = document.getElementById('download-button-container'); // Elemen baru
let currentMovieId = null; 

// --- FUNGSI API --- (Tidak ada perubahan)
async function fetchData(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${apiUrlBase}/${endpoint}${separator}api_key=${apiKey}&language=en-US`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) { console.error("Fetch Error:", error); return null; }
}

// --- FUNGSI RENDER TAMPILAN --- (Tidak ada perubahan)
function createMovieCard(movie) {
    if (!movie.poster_path) return null;
    const card = document.createElement('div');
    card.className = 'block group cursor-pointer';
    card.addEventListener('click', () => openPlayerModal(movie.id));
    card.innerHTML = `<img src="${imageCardBaseUrl}${movie.poster_path}" alt="${movie.title}" class="rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300">`;
    return card;
}
function createSection(title, movies) {
    const section = document.createElement('section');
    section.className = 'mb-12';
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';
    movies.forEach(movie => {
        const card = createMovieCard(movie);
        if (card) grid.appendChild(card);
    });
    section.innerHTML = `<h2 class="text-2xl font-semibold mb-4 border-l-4 border-red-600 pl-3">${title}</h2>`;
    section.appendChild(grid);
    return section;
}

// ===========================================
// --- FUNGSI MODAL PLAYER (DIPERBARUI) ---
// ===========================================

function openPlayerModal(movieId) {
    currentMovieId = movieId; // Simpan ID film saat ini
    serverButtonsContainer.innerHTML = ''; // Kosongkan tombol server lama
    downloadButtonContainer.innerHTML = ''; // Kosongkan tombol download lama

    // 1. Buat tombol untuk setiap server streaming
    streamingServers.forEach((server, index) => {
        const button = document.createElement('button');
        button.innerText = server.name;
        button.className = 'server-btn bg-gray-700 hover:bg-red-600 px-4 py-1 rounded text-sm transition-colors';
        button.onclick = () => changeServer(index);
        serverButtonsContainer.appendChild(button);
    });

    // 2. Buat tombol download
    const downloadLink = document.createElement('a');
    downloadLink.href = `${downloadUrlTemplate}${movieId}`;
    downloadLink.target = '_blank'; // Buka di tab baru
    downloadLink.rel = 'noopener noreferrer';
    downloadLink.className = 'bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1 rounded text-sm transition-transform hover:scale-105 inline-block';
    downloadLink.innerText = 'Download Film';
    downloadButtonContainer.appendChild(downloadLink);


    // 3. Secara default, muat video dari server pertama
    changeServer(0); 

    playerModal.classList.remove('hidden');
}

function changeServer(serverIndex) {
    const selectedServer = streamingServers[serverIndex];
    if (!selectedServer || !currentMovieId) return;

    const streamingUrl = `${selectedServer.urlTemplate}${currentMovieId}`;
    playerContainer.innerHTML = `<iframe class="w-full h-full" src="${streamingUrl}" frameborder="0" allowfullscreen></iframe>`;
    
    const buttons = serverButtonsContainer.querySelectorAll('.server-btn');
    buttons.forEach((btn, index) => {
        btn.classList.toggle('active', index === serverIndex);
    });
}

function closePlayerModal() {
    playerModal.classList.add('hidden');
    playerContainer.innerHTML = ''; 
    currentMovieId = null; 
}

// --- FUNGSI LOGIKA HALAMAN & EVENT LISTENERS --- (Tidak ada perubahan)
async function initializeHomepage() {
    movieSectionsContainer.innerHTML = '<p class="text-center text-xl animate-pulse">Memuat film populer...</p>';
    const [trending, nowPlaying, topRated] = await Promise.all([
        fetchData('trending/movie/week'),
        fetchData('movie/now_playing'),
        fetchData('movie/top_rated')
    ]);
    movieSectionsContainer.innerHTML = '';
    if (trending) movieSectionsContainer.appendChild(createSection('Trending Minggu Ini', trending.results));
    if (nowPlaying) movieSectionsContainer.appendChild(createSection('Sedang Tayang', nowPlaying.results));
    if (topRated) movieSectionsContainer.appendChild(createSection('Rating Tertinggi', topRated.results));
}
async function searchMovies(query) {
    const trimmedQuery = query.trim();
    if (trimmedQuery === '') { initializeHomepage(); return; }
    movieSectionsContainer.innerHTML = `<p class="text-center text-xl animate-pulse">Mencari "${trimmedQuery}"...</p>`;
    const searchData = await fetchData(`search/movie?query=${encodeURIComponent(trimmedQuery)}`);
    movieSectionsContainer.innerHTML = '';
    if (searchData && searchData.results.length > 0) {
        movieSectionsContainer.appendChild(createSection(`Hasil untuk "${trimmedQuery}"`, searchData.results));
    } else {
        movieSectionsContainer.innerHTML = `<p class="text-center text-xl">Tidak ada hasil untuk "${trimmedQuery}".</p>`;
    }
}
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchMovies(e.target.value), 500);
});
closeModalBtn.addEventListener('click', closePlayerModal);
playerModal.addEventListener('click', (e) => { if (e.target === playerModal) closePlayerModal(); });
document.addEventListener('DOMContentLoaded', initializeHomepage);
