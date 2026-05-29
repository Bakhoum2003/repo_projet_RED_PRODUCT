// Frontend integration with backend using Fetch API (no jQuery)
// Production backend URL deployed on Render
const API_BASE = window.API_BASE || (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:'
        ? 'http://localhost:5000/api'
        : 'https://red-product-backend-k7mf.onrender.com/api'
);

document.addEventListener('DOMContentLoaded', () => {
    // Attach login handler if present
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);

    const forgotBtn = document.getElementById('forgotBtn');
    if (forgotBtn) forgotBtn.addEventListener('click', handleForgotPassword);

    if (document.getElementById('welcome')) loadProfile();
    if (document.querySelector('.grid')) loadHotels();
});

async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        alert('Veuillez saisir votre email et votre mot de passe.');
        return;
    }

    try {
        const res = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw data;
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user || {}));
            // encode path to handle spaces in folder names
            window.location.href = encodeURI('RED PRODUCT/Frontend/HTML/dashboard.html');
        }
    } catch (err) {
        alert(err?.message || 'Erreur lors de la connexion');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('forgotEmail')?.value?.trim();
    if (!email) {
        alert('Veuillez saisir votre email pour réinitialiser le mot de passe.');
        return;
    }

    try {
        const res = await fetch(API_BASE + '/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw data;
        alert(data.message || 'Un email de réinitialisation a été envoyé.');
    } catch (err) {
        alert(err?.message || 'Erreur lors de la demande de réinitialisation');
    }
}

async function handleRegister() {
    const name = document.getElementById('registerName')?.value;
    const email = document.getElementById('registerEmail')?.value;
    const password = document.getElementById('registerPassword')?.value;
    try {
        const res = await fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw data;
        alert(data.message || 'Inscription réussie');
        // redirect to root index
        window.location.href = encodeURI('/index.html');
    } catch (err) {
        alert(err?.message || 'Erreur lors de l\'inscription');
    }
}

// Expose save hook used by modal
window.saveHotelToServer = async function(hotel) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vous devez être connecté pour ajouter un hôtel');
        return;
    }
    try {
        const body = {
            name: hotel.nomHotel,
            email: hotel.email,
            phone: hotel.telephone,
            pricePerNight: Number(hotel.prix) || 0,
            currency: hotel.devise || 'XOF',
            address: {
                street: hotel.adresse,
                city: 'Dakar',
                country: 'Sénégal'
            },
            images: hotel.image ? [hotel.image] : []
        };

        const res = await fetch(API_BASE + '/hotels/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw data;

        if (data && data.data) {
            if (typeof addHotelCard === 'function') addHotelCard({
                nomHotel: data.data.name,
                adresse: (data.data.address && data.data.address.street) || '',
                email: data.data.email || '',
                telephone: data.data.phone || '',
                prix: data.data.pricePerNight || '',
                devise: data.data.currency || 'XOF',
                images: data.data.images || []
            });
            alert(data.message || 'Hôtel ajouté');
        }
    } catch (err) {
        alert(err?.message || 'Erreur lors de l\'ajout d\'hôtel');
        throw err;
    }
};

async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const res = await fetch(API_BASE + '/users/me', {
            headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw data;
        if (data && data.user) {
            const welcome = document.getElementById('welcome');
            if (welcome) welcome.textContent = `Bienvenue ${data.user.name}`;
        }
    } catch (err) {
        console.warn('Impossible de charger le profil', err);
    }
}

async function loadHotels() {
    try {
        const res = await fetch(API_BASE + '/hotels');
        const data = await res.json();
        if (!res.ok) throw data;
        if (data && data.data) {
            const grid = document.querySelector('.grid');
            if (!grid) return;
            grid.innerHTML = '';
            data.data.forEach(h => {
                const card = document.createElement('div');
                card.className = 'card';
                const imageUrl = (h.images && h.images[0]) || '../Images/default_hotel.png';
                card.innerHTML = `\
                    <img src="${imageUrl}" alt="${h.name}">\
                    <div class="card-body">\
                        <p class="address">${(h.address && h.address.street) || ''}</p>\
                        <h3>${h.name}</h3>\
                        <p class="price">${h.pricePerNight || ''} ${h.currency || ''} par nuit</p>\
                    </div>`;
                grid.appendChild(card);
            });

            const span = document.querySelector('.header-bottom h2 span');
            if (span) span.textContent = data.count || data.total || data.data.length;
        }
    } catch (err) {
        console.warn('Erreur chargement hotels', err);
    }
}
