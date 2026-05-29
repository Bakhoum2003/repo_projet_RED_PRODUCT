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

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });
});

function showLogoutConfirmModal() {
    // Éviter les doublons
    if (document.getElementById('logoutConfirmOverlay')) return;

    // Injection des styles de la modale
    if (!document.getElementById('logoutModalStyles')) {
        const style = document.createElement('style');
        style.id = 'logoutModalStyles';
        style.textContent = `
            #logoutConfirmOverlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 15, 25, 0.55);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: logoutFadeIn 0.2s ease;
            }
            @keyframes logoutFadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            #logoutConfirmBox {
                background: #ffffff;
                border-radius: 16px;
                padding: 36px 40px 28px;
                width: 100%;
                max-width: 380px;
                box-shadow: 0 24px 60px rgba(0,0,0,0.18);
                text-align: center;
                animation: logoutSlideUp 0.25s cubic-bezier(.34,1.56,.64,1);
            }
            @keyframes logoutSlideUp {
                from { transform: translateY(30px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
            }
            #logoutConfirmBox .logout-icon {
                width: 56px;
                height: 56px;
                background: #fff0f0;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 18px;
            }
            #logoutConfirmBox h3 {
                font-size: 1.15rem;
                font-weight: 700;
                color: #1a1a2e;
                margin: 0 0 8px;
            }
            #logoutConfirmBox p {
                font-size: 0.88rem;
                color: #6b7280;
                margin: 0 0 28px;
                line-height: 1.5;
            }
            #logoutConfirmBox .logout-actions {
                display: flex;
                gap: 12px;
            }
            #logoutConfirmBox .btn-cancel-logout {
                flex: 1;
                padding: 11px 0;
                border: 1.5px solid #e5e7eb;
                background: #f9fafb;
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: 600;
                color: #374151;
                cursor: pointer;
                transition: background 0.2s, border-color 0.2s;
            }
            #logoutConfirmBox .btn-cancel-logout:hover {
                background: #f3f4f6;
                border-color: #d1d5db;
            }
            #logoutConfirmBox .btn-confirm-logout {
                flex: 1;
                padding: 11px 0;
                border: none;
                background: linear-gradient(135deg, #ff3b30, #c0392b);
                border-radius: 10px;
                font-size: 0.9rem;
                font-weight: 600;
                color: #ffffff;
                cursor: pointer;
                transition: opacity 0.2s, transform 0.15s;
            }
            #logoutConfirmBox .btn-confirm-logout:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            #logoutConfirmBox .btn-confirm-logout:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    // Injection de la modale dans le DOM
    const overlay = document.createElement('div');
    overlay.id = 'logoutConfirmOverlay';
    overlay.innerHTML = `
        <div id="logoutConfirmBox">
            <div class="logout-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </div>
            <h3>Déconnexion</h3>
            <p>Voulez-vous vraiment vous déconnecter de votre session ?</p>
            <div class="logout-actions">
                <button class="btn-cancel-logout" id="cancelLogoutBtn">Annuler</button>
                <button class="btn-confirm-logout" id="confirmLogoutBtn">Se déconnecter</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Écouteurs
    document.getElementById('cancelLogoutBtn').addEventListener('click', () => {
        overlay.style.animation = 'logoutFadeIn 0.15s ease reverse';
        setTimeout(() => overlay.remove(), 140);
    });

    document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
        overlay.remove();
        performLogout();
    });

    // Fermeture au clic sur l'arrière-plan
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.animation = 'logoutFadeIn 0.15s ease reverse';
            setTimeout(() => overlay.remove(), 140);
        }
    });

    // Fermeture avec Échap
    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', onKeyDown);
        }
    };
    document.addEventListener('keydown', onKeyDown);
}

async function performLogout() {
    const token = localStorage.getItem('token');

    // Appel API backend (fire & forget — on déconnecte quoi qu'il arrive)
    if (token) {
        try {
            await fetch(API_BASE + '/auth/logout', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + token }
            });
        } catch (err) {
            console.warn('Erreur lors du logout serveur :', err);
        }
    }

    // Nettoyage du localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirection vers la page de connexion
    const isAtRoot = window.location.pathname.endsWith('index.html') ||
                     window.location.pathname === '/' ||
                     window.location.pathname === '';
    if (!isAtRoot) {
        const depth = (window.location.pathname.split('/').length - 2);
        const back = '../'.repeat(depth);
        window.location.href = back + 'index.html';
    }
}

function handleLogout() {
    showLogoutConfirmModal();
}


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
                    <div class="card-actions">\
                        <button class="btn-action btn-edit" title="Modifier">\
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>\
                        </button>\
                        <button class="btn-action btn-delete" title="Supprimer">\
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>\
                        </button>\
                    </div>\
                    <img src="${imageUrl}" alt="${h.name}">\
                    <div class="card-body">\
                        <p class="address">${(h.address && h.address.street) || ''}</p>\
                        <h3>${h.name}</h3>\
                        <p class="price">${h.pricePerNight || ''} ${h.currency || ''} par nuit</p>\
                    </div>`;
                grid.appendChild(card);

                // Écouteurs d'événements pour la suppression et modification
                card.querySelector('.btn-delete').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteHotelById(h._id, card);
                });

                card.querySelector('.btn-edit').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof window.editHotelById === 'function') {
                        window.editHotelById(h);
                    }
                });
            });

            const span = document.querySelector('.header-bottom h2 span');
            if (span) span.textContent = data.count || data.total || data.data.length;
        }
    } catch (err) {
        console.warn('Erreur chargement hotels', err);
    }
}

async function deleteHotelById(id, cardElement) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vous devez être connecté pour supprimer un hôtel');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet hôtel ?')) {
        return;
    }
    
    try {
        const res = await fetch(API_BASE + `/hotels/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        const data = await res.json();
        if (!res.ok) throw data;
        
        // Supprimer du DOM
        cardElement.remove();
        
        // Mettre à jour le compteur
        const span = document.querySelector('.header-bottom h2 span');
        if (span) {
            const currentCount = parseInt(span.textContent) || 0;
            span.textContent = Math.max(0, currentCount - 1);
        }
        
        alert(data.message || 'Hôtel supprimé avec succès');
    } catch (err) {
        alert(err?.message || 'Erreur lors de la suppression de l\'hôtel');
    }
}

window.updateHotelOnServer = async function(id, hotel) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vous devez être connecté pour modifier un hôtel');
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
            }
        };
        // Inclure l'image seulement s'il s'agit d'une nouvelle sélection
        if (hotel.image) {
            body.images = [hotel.image];
        }

        const res = await fetch(API_BASE + `/hotels/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + token
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw data;

        // Recharger la grille pour refléter les modifications
        loadHotels();
        alert(data.message || 'Hôtel modifié avec succès');
    } catch (err) {
        alert(err?.message || 'Erreur lors de la modification de l\'hôtel');
        throw err;
    }
};
