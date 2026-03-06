// SnapBook - Photographer Booking System Frontend
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentPhotographerId = null;
let currentSessionId = null;
let selectedPackageId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    showHome();
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        currentUser = JSON.parse(user);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const authLinks = document.getElementById('authLinks');
    const userLinks = document.getElementById('userLinks');
    if (currentUser) {
        authLinks.style.display = 'none';
        userLinks.style.display = 'inline';
    } else {
        authLinks.style.display = 'inline';
        userLinks.style.display = 'none';
    }
}

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiCall(endpoint, method = 'GET', data = null, auth = false) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (auth || localStorage.getItem('token')) {
            options.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }

        if (data) options.body = JSON.stringify(data);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            showNotification(result.error || 'An error occurred', 'error');
            return null;
        }
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Failed to connect to server', 'error');
        return null;
    }
}

// ─── Notification ─────────────────────────────────────────────────────────────

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// ─── Page Navigation ──────────────────────────────────────────────────────────

function hideAllPages() {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
}

function showHome() {
    hideAllPages();
    document.getElementById('homePage').style.display = 'block';
    loadStats();
    loadHomePhotographers();
}

function showPhotographers() {
    hideAllPages();
    document.getElementById('photographersPage').style.display = 'block';
    loadPhotographers();
    loadCities();
}

function showStudios() {
    hideAllPages();
    document.getElementById('studiosPage').style.display = 'block';
    loadCities();
    filterStudios();
}

function showMyBookings() {
    if (!currentUser) {
        showNotification('Please login to view bookings', 'info');
        showLoginForm();
        return;
    }
    hideAllPages();
    document.getElementById('myBookingsPage').style.display = 'block';
    loadMyBookings();
}

function showLoginForm() {
    closeModal('registerModal');
    document.getElementById('loginModal').style.display = 'flex';
}

function showRegisterForm() {
    closeModal('loginModal');
    document.getElementById('registerModal').style.display = 'flex';
    loadCitiesForRegister();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ─── Stats ────────────────────────────────────────────────────────────────────

async function loadStats() {
    const stats = await apiCall('/stats');
    if (stats) {
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="stat-card">
                    <h3>${stats.photographers}+</h3>
                    <p>Photographers</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.studios}+</h3>
                    <p>Studios</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.cities}+</h3>
                    <p>Cities</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.availableSessions || 0}</h3>
                    <p>Available Sessions</p>
                </div>
            `;
        }
    }
}

// ─── Photographers ────────────────────────────────────────────────────────────

async function loadHomePhotographers() {
    const result = await apiCall('/photographers?limit=30');
    if (result && result.photographers) {
        displayPhotographers(result.photographers, 'homePhotographersList');
    }
    startBannerCarousel();
}

function startBannerCarousel() {
    const slides = document.querySelectorAll('.banner-slide');
    if (slides.length === 0) return;
    let current = 0;
    setInterval(() => {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
    }, 4000);
}

async function loadPhotographers() {
    const result = await apiCall('/photographers?limit=30');
    if (result && result.photographers) {
        displayPhotographers(result.photographers, 'photographersList');
    }
}

function displayPhotographers(photographers, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!photographers || photographers.length === 0) {
        container.innerHTML = '<p class="no-results">No photographers found</p>';
        return;
    }

    photographers.forEach(p => {
        const card = document.createElement('div');
        card.className = 'photographer-card';
        card.onclick = () => showPhotographerDetails(p.id);

        card.innerHTML = `
            <div class="photo-wrapper">
                <img src="${p.profile_photo}" alt="${p.name}" loading="lazy" 
                     onerror="this.onerror=null; this.src='https://placehold.co/300x300/6c5ce7/ffffff?text=${encodeURIComponent(p.name)}'">
            </div>
            <div class="photographer-info">
                <h3>${p.name}</h3>
                <p class="specialty">${p.specialty} Photography</p>
                <p class="location">📍 ${p.city}</p>
                <p class="experience">${p.experience_years} years experience</p>
                <div class="card-footer">
                    <span class="rating">⭐ ${p.rating || 'N/A'}</span>
                    <span class="price">₹${p.base_price?.toLocaleString()}/hr</span>
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

async function filterPhotographers() {
    const city = document.getElementById('cityFilter')?.value;
    const specialty = document.getElementById('specialtyFilter')?.value;
    const price = document.getElementById('priceFilter')?.value;

    let url = '/photographers?';
    const params = [];
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (specialty) params.push(`specialty=${encodeURIComponent(specialty)}`);
    if (price) params.push(`price=${price}`);
    url += params.join('&');

    const result = await apiCall(url);
    if (result && result.photographers) {
        displayPhotographers(result.photographers, 'photographersList');
    }
}

async function searchPhotographers() {
    const query = document.getElementById('searchInput')?.value;
    if (!query || query.length < 2) { loadPhotographers(); return; }

    const photographers = await apiCall(`/photographers/search?query=${encodeURIComponent(query)}`);
    if (photographers) {
        displayPhotographers(photographers, 'photographersList');
    }
}

// ─── Cities ───────────────────────────────────────────────────────────────────

async function loadCities() {
    const cities = await apiCall('/cities');
    if (!cities) return;

    ['cityFilter', 'cityStudioFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<option value="">All Cities</option>';
            cities.forEach(c => el.innerHTML += `<option value="${c}">${c}</option>`);
        }
    });
}

async function loadCitiesForRegister() {
    const cities = await apiCall('/cities');
    if (cities) {
        const regCity = document.getElementById('regCity');
        if (regCity) {
            regCity.innerHTML = '<option value="">Select City</option>';
            cities.forEach(c => regCity.innerHTML += `<option value="${c}">${c}</option>`);
        }
    }
}

// ─── Studios ──────────────────────────────────────────────────────────────────

async function filterStudios() {
    const city = document.getElementById('cityStudioFilter')?.value;
    let url = '/studios';
    if (city) url += `?city=${encodeURIComponent(city)}`;

    const studios = await apiCall(url);
    if (studios) displayStudios(studios);
}

function displayStudios(studios) {
    const list = document.getElementById('studiosList');
    if (!list) return;
    list.innerHTML = '';

    if (!studios || studios.length === 0) {
        list.innerHTML = '<p class="no-results">No studios found</p>';
        return;
    }

    studios.forEach(s => {
        const card = document.createElement('div');
        card.className = 'studio-card';
        card.innerHTML = `
            <div class="studio-name">${s.name}</div>
            <div class="studio-location">📍 ${s.location}, ${s.city}</div>
            <div class="studio-state">${s.state || ''}</div>
            <div class="studio-facilities">${s.facilities || ''}</div>
            <div class="studio-area">📐 ${s.area_sqft} sq ft</div>
            <div class="studio-price">💰 ₹${s.price_per_hour}/hour</div>
            <div class="studio-contact">📞 ${s.contact_number || 'N/A'}</div>
            <div class="studio-amenities">
                ${s.parking_available ? '🅿️ Parking' : ''}
                ${s.ac_available ? '❄️ AC' : ''}
            </div>
        `;
        list.appendChild(card);
    });
}

// ─── Photographer Details ─────────────────────────────────────────────────────

async function showPhotographerDetails(id) {
    currentPhotographerId = id;

    const photographer = await apiCall(`/photographers/${id}`);
    if (!photographer) return;

    hideAllPages();
    document.getElementById('photographerDetailsPage').style.display = 'block';

    const details = document.getElementById('photographerDetails');
    details.innerHTML = `
        <div class="detail-container">
            <img src="${photographer.profile_photo}" alt="${photographer.name}" class="detail-photo" 
                 onerror="this.onerror=null; this.src='https://placehold.co/300x400/6c5ce7/ffffff?text=${encodeURIComponent(photographer.name)}'">
            <div class="detail-info">
                <h1>${photographer.name}</h1>
                <p class="detail-rating">⭐ ${photographer.rating || 'N/A'} | ${photographer.experience_years} years experience</p>
                <p class="detail-meta">${photographer.specialty} Photography | ${photographer.style}</p>
                <p class="detail-location">📍 ${photographer.city}</p>
                <p class="detail-price">Starting from <strong>₹${photographer.base_price?.toLocaleString()}/hr</strong></p>
                <p class="detail-bio">${photographer.bio || ''}</p>
                <p><strong>Equipment:</strong> ${photographer.equipment || 'N/A'}</p>
                <p><strong>Languages:</strong> ${photographer.languages || 'N/A'}</p>
                <p><strong>Contact:</strong> ${photographer.phone || 'N/A'} | ${photographer.email || 'N/A'}</p>
            </div>
        </div>
    `;

    // Set date filter to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sessionDateFilter').value = today;
    loadSessions();
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

async function loadSessions() {
    if (!currentPhotographerId) return;

    const date = document.getElementById('sessionDateFilter')?.value;
    let url = `/photographers/${currentPhotographerId}/sessions`;
    if (date) url += `?date=${date}`;

    const sessions = await apiCall(url);
    displaySessions(sessions || []);
}

function displaySessions(sessions) {
    const list = document.getElementById('sessionsList');
    if (!list) return;
    list.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        list.innerHTML = '<p class="no-results">No sessions available for the selected date. Try another date.</p>';
        return;
    }

    // Group by date
    const grouped = {};
    sessions.forEach(s => {
        if (!grouped[s.session_date]) grouped[s.session_date] = [];
        grouped[s.session_date].push(s);
    });

    Object.keys(grouped).sort().forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'session-date-group';

        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        dateDiv.innerHTML = `
            <div class="date-header"><h3>📅 ${formattedDate}</h3></div>
            <div class="session-slots">
                ${grouped[date].map(s => `
                    <button class="session-slot-btn" onclick="selectSession(${s.id})">
                        <span class="slot-time">${s.start_time} - ${s.end_time}</span>
                        <span class="slot-type">${s.session_type}</span>
                        <span class="slot-location">${s.location_type}</span>
                        <span class="slot-price">₹${s.price?.toLocaleString()}</span>
                    </button>
                `).join('')}
            </div>
        `;
        list.appendChild(dateDiv);
    });
}

// ─── Booking Flow ─────────────────────────────────────────────────────────────

async function selectSession(sessionId) {
    if (!currentUser) {
        showNotification('Please login to book a session', 'info');
        showLoginForm();
        return;
    }

    currentSessionId = sessionId;
    selectedPackageId = null;

    const data = await apiCall(`/sessions/${sessionId}`);
    if (!data) return;

    hideAllPages();
    document.getElementById('bookingPage').style.display = 'block';

    const { session, packages } = data;

    // Session info
    const info = document.getElementById('sessionInfo');
    info.innerHTML = `
        <h2>📸 ${session.photographer_name}</h2>
        <p>${session.specialty} Photography</p>
        <p>📅 ${session.session_date} | ⏰ ${session.start_time} - ${session.end_time}</p>
        <p>📍 ${session.location_type} | ${session.session_type}</p>
    `;

    // Packages
    const pkgList = document.getElementById('packagesList');
    pkgList.innerHTML = '';

    packages.forEach(pkg => {
        const pkgCard = document.createElement('div');
        pkgCard.className = 'package-card';
        pkgCard.dataset.packageId = pkg.id;
        pkgCard.onclick = () => selectPackage(pkg.id, pkg.price, pkg.name);

        pkgCard.innerHTML = `
            <div class="package-type">${pkg.type}</div>
            <h4>${pkg.name}</h4>
            <p class="package-price">₹${pkg.price?.toLocaleString()}</p>
            <p class="package-duration">${pkg.duration_hours} hours</p>
            <p class="package-desc">${pkg.description}</p>
            <p class="package-deliverables">📦 ${pkg.deliverables}</p>
        `;

        pkgList.appendChild(pkgCard);
    });

    updateBookingSummary();
}

function selectPackage(packageId, price, name) {
    selectedPackageId = packageId;

    // Update UI
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.package-card[data-package-id="${packageId}"]`)?.classList.add('selected');

    updateBookingSummary();
}

function updateBookingSummary() {
    const summary = document.getElementById('bookingSummary');
    const confirmBtn = document.getElementById('confirmBookingBtn');

    if (!selectedPackageId) {
        summary.innerHTML = '<p>Select a package to continue</p>';
        confirmBtn.disabled = true;
        return;
    }

    const selectedCard = document.querySelector('.package-card.selected');
    if (selectedCard) {
        const pkgName = selectedCard.querySelector('h4').textContent;
        const pkgPrice = selectedCard.querySelector('.package-price').textContent;
        const pkgDuration = selectedCard.querySelector('.package-duration').textContent;

        summary.innerHTML = `
            <p><strong>Package:</strong> <span>${pkgName}</span></p>
            <p><strong>Duration:</strong> <span>${pkgDuration}</span></p>
            <p><strong>Total Amount:</strong> <span>${pkgPrice}</span></p>
        `;
        confirmBtn.disabled = false;
    }
}

async function confirmBooking() {
    if (!currentUser || !currentSessionId || !selectedPackageId) {
        showNotification('Please select a package', 'error');
        return;
    }

    const eventType = document.getElementById('eventType')?.value || '';
    const eventDetails = document.getElementById('eventDetails')?.value || '';

    const result = await apiCall('/bookings', 'POST', {
        sessionId: currentSessionId,
        packageId: selectedPackageId,
        eventType,
        eventDetails
    }, true);

    if (result) {
        showNotification(`Booking confirmed! Booking ID: ${result.bookingId}`, 'success');
        showMyBookings();
    }
}

// ─── My Bookings ──────────────────────────────────────────────────────────────

async function loadMyBookings() {
    const bookings = await apiCall('/my-bookings', 'GET', null, true);
    const list = document.getElementById('bookingsList');
    if (!list) return;
    list.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        list.innerHTML = '<p class="no-results">No bookings found</p>';
        return;
    }

    bookings.forEach(b => {
        const card = document.createElement('div');
        card.className = `booking-card ${b.status}`;

        card.innerHTML = `
            <div class="booking-header">
                <div class="booking-header-info">
                    <img src="${b.profile_photo}" alt="${b.photographer_name}" class="booking-photo"
                         onerror="this.onerror=null; this.src='https://placehold.co/50x50/6c5ce7/ffffff?text=P'">
                    <h3>${b.photographer_name}</h3>
                </div>
                <span class="status ${b.status}">${b.status.toUpperCase()}</span>
            </div>
            <div class="booking-details">
                <p><strong>Specialty:</strong> ${b.specialty} Photography</p>
                <p><strong>Date & Time:</strong> ${b.session_date} | ${b.start_time} - ${b.end_time}</p>
                <p><strong>Session:</strong> ${b.session_type} (${b.location_type})</p>
                <p><strong>Package:</strong> ${b.package_name || 'N/A'} (${b.package_type || ''})</p>
                <p><strong>Duration:</strong> ${b.duration_hours || 'N/A'} hours</p>
                ${b.event_type ? `<p><strong>Event:</strong> ${b.event_type}</p>` : ''}
                <p><strong>Amount:</strong> ₹${b.total_amount?.toLocaleString()}</p>
                <p><strong>Booking ID:</strong> #${b.id}</p>
                ${b.deliverables ? `<p><strong>Deliverables:</strong> ${b.deliverables}</p>` : ''}
            </div>
            ${b.status === 'confirmed' ? `
                <button class="btn btn-danger" onclick="cancelBooking(${b.id})">Cancel Booking</button>
            ` : ''}
        `;

        list.appendChild(card);
    });
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    const result = await apiCall(`/bookings/${bookingId}/cancel`, 'POST', null, true);
    if (result) {
        showNotification('Booking cancelled successfully', 'success');
        loadMyBookings();
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const result = await apiCall('/login', 'POST', { email, password });
    if (result) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        currentUser = result.user;
        updateAuthUI();
        closeModal('loginModal');
        showNotification('Login successful!', 'success');
        showHome();
    }
}

async function register(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    const city = document.getElementById('regCity')?.value;

    const result = await apiCall('/register', 'POST', { name, email, password, phone, city });
    if (result) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        currentUser = result.user;
        updateAuthUI();
        closeModal('registerModal');
        showNotification('Registration successful!', 'success');
        showHome();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
    showHome();
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
