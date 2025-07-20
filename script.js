// js/script.js

// --- KONFIGURASI ---
const apiKey = '8c79e8986ea53efac75026e541207aa3'; // <-- WAJIB GANTI INI
const apiUrlBase = 'https://api.themoviedb.org/3';
const imageCardBaseUrl = 'https://image.tmdb.org/t/p/w500';

// --- ELEMEN DOM ---
const movieSectionsContainer = document.getElementById('movie-sections');
const searchInput = document.getElementById('search-input');
const playerModal = document.getElementById('player-modal');
const modalContent = document.getElementById('modal-content');
const playerContainer = document.getElementById('player-container');
const closeModalBtn = document.getElementById('close-modal-btn');

// --- FUNGSI API ---
async function fetchData(endpoint) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${apiUrlBase}/${endpoint}${separator}api_key=${apiKey}&language=en-US`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        return null;
    }
}

// --- FUNGSI RENDER TAMPILAN ---
function createMovieCard(movie) {
    if (!movie.poster_path) return null;
    
    const card = document.createElement('div');
    card.className = 'block group cursor-pointer';
    card.dataset.movieid = movie.id; // Simpan ID film di data-attribute
    card.innerHTML = `
        <img src="${imageCardBaseUrl}${movie.poster_path}" alt="${movie.title}" class="rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300">
    `;
    
    // Tambahkan event listener untuk membuka modal
    card.addEventListener('click', () => openPlayerModal(movie.id, 'movie')); // Menambahkan tipe 'movie'
    
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

// --- FUNGSI MODAL PLAYER ---
function openPlayerModal(id) {
    // =============================================================
    //           DI SINILAH KAMU MENGATUR SUMBER VIDEO
    //  Kamu hanya perlu mengubah SATU BARIS ini jika sumber video berubah.
    // =============================================================
    const streamingUrl = `https://vidlink.pro/movie/${id}`;
    
    // Kode di bawah ini tidak perlu kamu sentuh.
    playerContainer.innerHTML = `<iframe class="w-full h-full" src="${streamingUrl}" frameborder="0" allowfullscreen></iframe>`;
    playerModal.classList.remove('hidden');
}

function closePlayerModal() {
    playerModal.classList.add('hidden');
    // PENTING: Hapus iframe untuk menghentikan video
    playerContainer.innerHTML = ''; 
}

// --- FUNGSI LOGIKA HALAMAN ---
async function initializeHomepage() {
    movieSectionsContainer.innerHTML = '<p class="text-center text-xl animate-pulse">Memuat film populer...</p>';
    const [trending, nowPlaying, topRated] = await Promise.all([
        fetchData('trending/movie/week'),
        fetchData('movie/now_playing'),
        fetchData('movie/top_rated')
    ]);
    
    movieSectionsContainer.innerHTML = ''; // Hapus loading
    if (trending) movieSectionsContainer.appendChild(createSection('Trending Minggu Ini', trending.results));
    if (nowPlaying) movieSectionsContainer.appendChild(createSection('Sedang Tayang', nowPlaying.results));
    if (topRated) movieSectionsContainer.appendChild(createSection('Rating Tertinggi', topRated.results));
}

async function searchMovies(query) {
    const trimmedQuery = query.trim();
    if (trimmedQuery === '') {
        initializeHomepage();
        return;
    }
    movieSectionsContainer.innerHTML = `<p class="text-center text-xl animate-pulse">Mencari "${trimmedQuery}"...</p>`;
    const searchData = await fetchData(`search/movie?query=${encodeURIComponent(trimmedQuery)}`);
    
    movieSectionsContainer.innerHTML = ''; // Hapus loading
    if (searchData && searchData.results.length > 0) {
        movieSectionsContainer.appendChild(createSection(`Hasil untuk "${trimmedQuery}"`, searchData.results));
    } else {
        movieSectionsContainer.innerHTML = `<p class="text-center text-xl">Tidak ada hasil untuk "${trimmedQuery}".</p>`;
    }
}

// --- EVENT LISTENERS ---
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchMovies(e.target.value), 500);
});

closeModalBtn.addEventListener('click', closePlayerModal);
// Tambahkan event listener untuk menutup modal saat klik area gelap di sekitarnya
playerModal.addEventListener('click', (e) => {
    if (e.target === playerModal) {
        closePlayerModal();
    }
});


// Jalankan saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', initializeHomepage);
