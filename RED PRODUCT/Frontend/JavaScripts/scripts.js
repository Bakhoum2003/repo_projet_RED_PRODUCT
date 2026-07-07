
// Production backend URL deployed on Render
const API_BASE = window.API_BASE || (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:'
        ? 'http://localhost:5000/api'
        : 'https://red-product-backend-k7mf.onrender.com/api'
);

function initToastContainer() {
    if (document.getElementById('globalToastContainer')) return;
    const container = document.createElement('div');
    container.id = 'globalToastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);

    const style = document.createElement('style');
    style.id = 'globalToastStyles';
    style.textContent = `
        #globalToastContainer {
            position: fixed;
            right: 20px;
            bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 99999;
            max-width: 360px;
        }
        .toast {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            min-width: 250px;
            max-width: 100%;
            padding: 14px 16px;
            border-radius: 14px;
            color: #fff;
            background: rgba(37, 99, 235, 0.95);
            box-shadow: 0 18px 50px rgba(15, 23, 42, 0.2);
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.22s ease, transform 0.22s ease;
            font-size: 0.95rem;
            line-height: 1.3;
            word-break: break-word;
        }
        .toast.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .toast.toast-success { background: linear-gradient(135deg, #16a34a, #22c55e); }
        .toast.toast-error   { background: linear-gradient(135deg, #dc2626, #f43f5e); }
        .toast.toast-warning { background: linear-gradient(135deg, #d97706, #f59e0b); }
        .toast.toast-info    { background: linear-gradient(135deg, #2563eb, #3b82f6); }
        .toast-close {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.85);
            font-size: 1.1rem;
            cursor: pointer;
            margin-left: 12px;
            padding: 0;
            line-height: 1;
        }
        .toast-close:hover { color: #ffffff; }
    `;
    document.head.appendChild(style);
}

window.showToast = function(message, type = 'info') {
    initToastContainer();
    const container = document.getElementById('globalToastContainer');
    if (!container) {
        console.warn('Toast container non trouvé');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => toast.remove());
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => toast.classList.remove('visible'), 4200);
    setTimeout(() => toast.remove(), 4500);
};

document.addEventListener('DOMContentLoaded', () => {
    // Vérification de l'authentification et validation du token
    checkAuth();

    // Attach login handler if present
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);

    const forgotBtn = document.getElementById('forgotBtn');
    if (forgotBtn) forgotBtn.addEventListener('click', handleForgotPassword);

    if (document.querySelector('.grid')) loadHotels();

    const hotelSearchInput = document.getElementById('hotelSearchInput');
    if (hotelSearchInput) {
        hotelSearchInput.addEventListener('input', () => {
            filterHotelCards(hotelSearchInput.value);
        });
    }

    const dashboardSearchInput = document.getElementById('dashboardSearchInput');
    if (dashboardSearchInput) {
        dashboardSearchInput.addEventListener('input', () => {
            filterDashboardCards(dashboardSearchInput.value);
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    // Initialiser le gestionnaire de notifications sur toutes les pages qui ont les icônes
    if (document.getElementById('bellContainer')) {
        window.NotificationManager.init();
    }
});

// Gérer la navigation retour/suivant (BFCache)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        checkAuth();
    }
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

function redirectToLogin() {
    const path = window.location.pathname;
    let target = 'index.html';
    if (path.includes('/Frontend/HTML/') || path.includes('/Frontend/HTML')) {
        target = '../../../index.html';
    } else if (path.includes('Frontend/HTML/') || path.includes('Frontend/HTML')) {
        target = '../../../index.html';
    }
    window.location.replace(target);
}

async function checkAuth() {
    const path = window.location.pathname;
    const isProtectedRoute = path.includes('dashboard.html') || path.includes('liste_hotel.html');
    if (!isProtectedRoute) return;

    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return;
    }

    try {
        const res = await fetch(API_BASE + '/users/me', {
            headers: { Authorization: 'Bearer ' + token }
        });
        if (!res.ok) {
            throw new Error('Session expirée ou invalide');
        }
        const data = await res.json();
        if (data && data.user) {
            const welcome = document.getElementById('welcome');
            if (welcome) welcome.textContent = `Bienvenue ${data.user.name}`;

            const sidebarNames = document.querySelectorAll('.sidebar .user p, .user p');
            sidebarNames.forEach(el => el.textContent = data.user.name);
        }
    } catch (err) {
        console.warn('Authentication check failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        redirectToLogin();
    }
}

async function performLogout() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

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

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    redirectToLogin();
}

function handleLogout() {
    showLogoutConfirmModal();
}


async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        showToast('Veuillez saisir votre email et votre mot de passe.', 'warning');
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
        showToast(err?.message || 'Erreur lors de la connexion', 'error');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('forgotEmail')?.value?.trim();
    if (!email) {
        showToast('Veuillez saisir votre email pour réinitialiser le mot de passe.', 'warning');
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
        showToast(data.message || 'Un email de réinitialisation a été envoyé.', 'success');
    } catch (err) {
        showToast(err?.message || 'Erreur lors de la demande de réinitialisation', 'error');
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
        showToast(data.message || 'Inscription réussie', 'success');
        // redirect to root index
        window.location.href = encodeURI('/index.html');
    } catch (err) {
        showToast(err?.message || 'Erreur lors de l\'inscription', 'error');
    }
}

// Expose save hook used by modal
window.saveHotelToServer = async function(hotel) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Vous devez être connecté pour ajouter un hôtel', 'warning');
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
            if (window.NotificationManager) {
                window.NotificationManager.addNotification('create', data.data.name, `L'hôtel "${data.data.name}" a été créé par l'administrateur.`);
            }
            if (typeof addHotelCard === 'function') addHotelCard({
                nomHotel: data.data.name,
                adresse: (data.data.address && data.data.address.street) || '',
                email: data.data.email || '',
                telephone: data.data.phone || '',
                prix: data.data.pricePerNight || '',
                devise: data.data.currency || 'XOF',
                images: data.data.images || []
            });
            showToast(data.message || 'Hôtel ajouté', 'success');
        }
    } catch (err) {
        showToast(err?.message || 'Erreur lors de l\'ajout d\'hôtel', 'error');
        throw err;
    }
};

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

function filterHotelCards(searchTerm = '') {
    const grid = document.querySelector('.grid');
    if (!grid) return;

    const normalizedTerm = searchTerm.trim().toLowerCase();
    const cards = Array.from(grid.querySelectorAll('.card'));
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('h3')?.textContent || '';
        const address = card.querySelector('.address')?.textContent || '';
        const price = card.querySelector('.price')?.textContent || '';
        const combined = `${title} ${address} ${price}`.toLowerCase();
        const matches = !normalizedTerm || combined.includes(normalizedTerm);
        card.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });

    const existingMessage = grid.querySelector('.no-results');
    if (visibleCount === 0 && cards.length > 0) {
        if (!existingMessage) {
            const message = document.createElement('div');
            message.className = 'no-results';
            message.textContent = 'Aucun hôtel trouvé.';
            grid.appendChild(message);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

function filterDashboardCards(searchTerm = '') {
    const wrapper = document.querySelector('.stats-grid');
    if (!wrapper) return;

    const normalizedTerm = searchTerm.trim().toLowerCase();
    const items = Array.from(wrapper.querySelectorAll('.stat-card'));
    let visibleCount = 0;

    items.forEach(item => {
        const text = (item.textContent || '').toLowerCase();
        const matches = !normalizedTerm || text.includes(normalizedTerm);
        item.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });

    const existingMessage = wrapper.querySelector('.no-results');
    if (visibleCount === 0 && items.length > 0) {
        if (!existingMessage) {
            const message = document.createElement('div');
            message.className = 'no-results';
            message.textContent = 'Aucun élément trouvé.';
            wrapper.appendChild(message);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

async function deleteHotelById(id, cardElement) {
    const hotelName = cardElement.querySelector('h3')?.textContent || 'Hôtel';
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Vous devez être connecté pour supprimer un hôtel', 'warning');
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
        if (window.NotificationManager) {
            window.NotificationManager.addNotification('delete', hotelName, `L'hôtel \"${hotelName}\" a été définitivement supprimé.`);
        }
        
        // Mettre à jour le compteur
        const span = document.querySelector('.header-bottom h2 span');
        if (span) {
            const currentCount = parseInt(span.textContent) || 0;
            span.textContent = Math.max(0, currentCount - 1);
        }
        
        showToast(data.message || 'Hôtel supprimé avec succès', 'success');
    } catch (err) {
        showToast(err?.message || 'Erreur lors de la suppression de l\'hôtel', 'error');
    }
}

window.updateHotelOnServer = async function(id, hotel) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Vous devez être connecté pour modifier un hôtel', 'warning');
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
        if (window.NotificationManager) {
            window.NotificationManager.addNotification('update', hotel.nomHotel, `Les détails de l'hôtel \"${hotel.nomHotel}\" ont été modifiés par l'administrateur.`);
        }
        showToast(data.message || 'Hôtel modifié avec succès', 'success');
    } catch (err) {
        showToast(err?.message || 'Erreur lors de la modification de l\'hôtel', 'error');
        throw err;
    }
};


/* ==========================================================================
   Notification System Manager (localStorage persistence and dropdowns)
   ========================================================================== */

const NotificationManager = {
    notificationsKey: 'red_product_notifications',
    systemMessagesKey: 'red_product_system_messages',
    
    init() {
        this.bellContainer = document.getElementById('bellContainer');
        this.bellBadge     = document.getElementById('bellBadge');
        
        // Modal fullscreen
        this.bellNotificationModal = document.getElementById('bellNotificationModal');
        this.bellNotificationModalList = document.getElementById('bellNotificationModalList');
        this.closeBellModalBtn = document.getElementById('closeBellModal');
        this.markAllReadModalBtn = document.getElementById('markAllReadModal');
        this.clearAllNotificationsModalBtn = document.getElementById('clearAllNotificationsModal');

        // msgContainer est optionnel (peut être absent)
        this.msgContainer  = document.getElementById('msgContainer')  || null;
        this.msgBadge      = document.getElementById('msgBadge')      || null;
        this.msgDropdown   = document.getElementById('msgDropdown')   || null;
        this.msgList       = document.getElementById('msgNotificationList') || null;

        // Ancien dropdown (gardé pour compatibilité si nécessaire)
        this.bellDropdown  = document.getElementById('bellDropdown')  || null;
        this.bellList      = document.getElementById('bellNotificationList') || null;

        if (!this.bellContainer) return; // minimum requis

        this.initSystemMessages();
        this.bindEvents();
        this.render();
    },
    
    initSystemMessages() {
        let sysMsgs = localStorage.getItem(this.systemMessagesKey);
        if (!sysMsgs) {
            const defaultMsgs = [
                {
                    id: 'sys-1',
                    type: 'system',
                    title: 'Bienvenue',
                    message: "Bienvenue sur l'application RED PRODUCT! Si vous rencontrez un problème, contactez le support.",
                    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
                    unread: true
                },
                {
                    id: 'sys-2',
                    type: 'system',
                    title: 'Maintenance',
                    message: "Une maintenance système est planifiée ce soir à 23h00 (UTC). Les services restent disponibles.",
                    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
                    unread: true
                }
            ];
            localStorage.setItem(this.systemMessagesKey, JSON.stringify(defaultMsgs));
        }
    },
    
    getNotifications() {
        const data = localStorage.getItem(this.notificationsKey);
        return data ? JSON.parse(data) : [];
    },
    
    getSystemMessages() {
        const data = localStorage.getItem(this.systemMessagesKey);
        return data ? JSON.parse(data) : [];
    },
    
    saveNotifications(notifications) {
        localStorage.setItem(this.notificationsKey, JSON.stringify(notifications));
        this.render();
        window.dispatchEvent(new Event('storage'));
    },
    
    saveSystemMessages(messages) {
        localStorage.setItem(this.systemMessagesKey, JSON.stringify(messages));
        this.render();
        window.dispatchEvent(new Event('storage'));
    },
    
    addNotification(type, title, message) {
        const notifications = this.getNotifications();
        const newNotif = {
            id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type,
            title,
            message,
            timestamp: new Date().toISOString(),
            unread: true
        };
        notifications.unshift(newNotif);
        if (notifications.length > 50) {
            notifications.pop();
        }
        this.saveNotifications(notifications);
        // Afficher un toast visuel temporaire
        this.showToast(type, title, message);
    },

    showToast(type, title, message) {
        // Styles du toast injectés une seule fois
        if (!document.getElementById('notifToastStyles')) {
            const style = document.createElement('style');
            style.id = 'notifToastStyles';
            style.textContent = `
                #notifToastContainer {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    pointer-events: none;
                }
                .notif-toast {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    background: rgba(255,255,255,0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                    padding: 14px 18px;
                    min-width: 280px;
                    max-width: 360px;
                    border-left: 4px solid #ccc;
                    animation: toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
                    pointer-events: auto;
                    cursor: pointer;
                }
                .notif-toast.toast-create { border-left-color: #2ed573; }
                .notif-toast.toast-update { border-left-color: #ffa502; }
                .notif-toast.toast-delete { border-left-color: #ff4757; }
                .notif-toast.toast-out {
                    animation: toastSlideOut 0.3s ease forwards;
                }
                .notif-toast-icon {
                    font-size: 22px;
                    line-height: 1;
                    flex-shrink: 0;
                    margin-top: 1px;
                }
                .notif-toast-body { flex: 1; }
                .notif-toast-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #1a1a2e;
                    margin-bottom: 3px;
                }
                .notif-toast-msg {
                    font-size: 11.5px;
                    color: #555;
                    line-height: 1.4;
                }
                .notif-toast-time {
                    font-size: 10px;
                    color: #aaa;
                    margin-top: 4px;
                }
                @keyframes toastSlideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0);    opacity: 1; }
                    to   { transform: translateX(120%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        // Créer ou récupérer le conteneur
        let container = document.getElementById('notifToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifToastContainer';
            document.body.appendChild(container);
        }

        const icons = { create: '✅', update: '✏️', delete: '🗑️' };
        const labels = { create: 'Hôtel ajouté', update: 'Hôtel modifié', delete: 'Hôtel supprimé' };
        const now = new Date();
        const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

        const toast = document.createElement('div');
        toast.className = `notif-toast toast-${type}`;
        toast.innerHTML = `
            <div class="notif-toast-icon">${icons[type] || '🔔'}</div>
            <div class="notif-toast-body">
                <div class="notif-toast-title">${labels[type] || title}</div>
                <div class="notif-toast-msg">${message}</div>
                <div class="notif-toast-time">Aujourd'hui à ${timeStr}</div>
            </div>
        `;
        container.appendChild(toast);

        // Fermer au clic
        toast.addEventListener('click', () => dismissToast(toast));

        // Disparaître automatiquement après 5 secondes
        setTimeout(() => dismissToast(toast), 5000);

        function dismissToast(el) {
            el.classList.add('toast-out');
            setTimeout(() => el.remove(), 300);
        }
    },
    
    bindEvents() {
        // Open Notification Modal when clicking bell icon
        this.bellContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            this.bellNotificationModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        // Close Notification Modal when clicking close button
        if (this.closeBellModalBtn) {
            this.closeBellModalBtn.addEventListener('click', () => {
                this.bellNotificationModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            });
        }

        // Close Modal when clicking outside of it (on overlay)
        this.bellNotificationModal.addEventListener('click', (e) => {
            if (e.target === this.bellNotificationModal) {
                this.bellNotificationModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });

        // Mark all as read
        if (this.markAllReadModalBtn) {
            this.markAllReadModalBtn.addEventListener('click', () => {
                const notifications = this.getNotifications().map(n => ({ ...n, unread: false }));
                this.saveNotifications(notifications);
            });
        }

        // Clear all notifications
        if (this.clearAllNotificationsModalBtn) {
            this.clearAllNotificationsModalBtn.addEventListener('click', () => {
                this.saveNotifications([]);
            });
        }

        // Close Modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.bellNotificationModal.classList.contains('show')) {
                this.bellNotificationModal.classList.remove('show');
                document.body.style.overflow = 'auto';
            }
        });

        // Cross-tab synchronization
        window.addEventListener('storage', () => {
            this.render();
        });
    },
    
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);

        // Heure exacte toujours affichée
        const hrs  = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        const exactTime = `${hrs}:${mins}`;

        const day   = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year  = date.getFullYear();

        if (diffMins < 1)  return `À l'instant · ${exactTime}`;
        if (diffMins < 60) return `Il y a ${diffMins} min · ${exactTime}`;
        if (diffHrs < 24)  return `Aujourd'hui à ${exactTime}`;

        // Hier
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Hier à ${exactTime}`;
        }

        return `${day}/${month}/${year} à ${exactTime}`;
    },
    
    render() {
        const notifications = this.getNotifications();
        const unreadNotifs = notifications.filter(n => n.unread).length;
        
        // Update badge
        if (unreadNotifs > 0) {
            this.bellBadge.textContent = unreadNotifs;
            this.bellBadge.classList.add('show');
        } else {
            this.bellBadge.classList.remove('show');
        }
        
        // Render notifications in modal
        if (notifications.length === 0) {
            this.bellNotificationModalList.innerHTML = '<div class="empty-state">Aucune notification</div>';
        } else {
            const typeLabels  = { create: 'Ajout', update: 'Modif', delete: 'Suppr' };
            const typeIcons   = { create: '✅', update: '✏️', delete: '🗑️' };
            this.bellNotificationModalList.innerHTML = notifications.map(n => `
                <div class="notification-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
                    <div class="notification-text">
                        <span class="action-badge ${n.type}">${typeIcons[n.type] || ''} ${typeLabels[n.type] || n.type}</span>
                        <strong>${n.title}</strong>
                    </div>
                    <div class="notification-text" style="margin-top:2px; color:#555;">${n.message}</div>
                    <div class="notification-time">🕐 ${this.formatTime(n.timestamp)}</div>
                </div>
            `).join('');

            this.bellNotificationModalList.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const notifs = this.getNotifications().map(n => n.id === id ? { ...n, unread: false } : n);
                    this.saveNotifications(notifs);
                });
            });
        }
        
        // --- Section messages système (optionnelle) ---
        if (!this.msgBadge || !this.msgList) return;

        const sysMessages = this.getSystemMessages();
        const unreadSys = sysMessages.filter(m => m.unread).length;

        if (unreadSys > 0) {
            this.msgBadge.textContent = unreadSys;
            this.msgBadge.classList.add('show');
        } else {
            this.msgBadge.classList.remove('show');
        }

        if (sysMessages.length === 0) {
            this.msgList.innerHTML = '<div class="empty-state">Aucun message</div>';
        } else {
            this.msgList.innerHTML = sysMessages.map(m => `
                <div class="notification-item ${m.unread ? 'unread' : ''}" data-id="${m.id}">
                    <div class="notification-text">
                        <strong>📢 ${m.title}</strong>
                    </div>
                    <div class="notification-text" style="margin-top:2px; color:#555;">${m.message}</div>
                    <div class="notification-time">🕐 ${this.formatTime(m.timestamp)}</div>
                </div>
            `).join('');

            this.msgList.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const msgs = this.getSystemMessages().map(m => m.id === id ? { ...m, unread: false } : m);
                    this.saveSystemMessages(msgs);
                });
            });
        }
    }
};

window.NotificationManager = NotificationManager;
