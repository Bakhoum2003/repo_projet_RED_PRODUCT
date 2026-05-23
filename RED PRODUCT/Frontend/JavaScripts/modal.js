// Récupération des éléments
const openBtn = document.getElementById('openFormBtn');
const modal = document.getElementById('hotelFormModal');
const closeBtn = document.querySelector('.close-modal');
const saveBtn = document.getElementById('saveHotelBtn');

// Vérifier si les éléments existent
if (!openBtn) console.error('Bouton openFormBtn non trouvé');
if (!modal) console.error('Modal hotelFormModal non trouvée');

// Ouvrir la modale
function openModal() {
  if (modal) {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  }
}

// Fermer la modale
function closeModal() {
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
  }
}

// Récupérer les valeurs du formulaire
function getFormData() {
  return {
    nomHotel: document.getElementById('nomHotel')?.value || '',
    adresse: document.getElementById('adresse')?.value || '',
    email: document.getElementById('email')?.value || '',
    telephone: document.getElementById('telephone')?.value || '',
    prix: document.getElementById('prix')?.value || '',
    devise: document.getElementById('devise')?.value || ''
  };
}

// Valider le formulaire
function validateForm() {
  const data = getFormData();
  
  if (!data.nomHotel.trim()) {
    alert('Veuillez saisir le nom de l\'hôtel');
    return false;
  }
  if (!data.adresse.trim()) {
    alert('Veuillez saisir l\'adresse');
    return false;
  }
  if (!data.email.trim()) {
    alert('Veuillez saisir l\'email');
    return false;
  }
  if (!data.telephone.trim()) {
    alert('Veuillez saisir le téléphone');
    return false;
  }
  
  return true;
}

// Sauvegarder l'hôtel
function saveHotel() {
  if (!validateForm()) return;
  
  const formData = getFormData();
  console.log('Nouvel hôtel:', formData);
    // If frontend provided a hook to save on server, use it
    if (typeof window.saveHotelToServer === 'function') {
      // saveHotelToServer should handle UI update and alerts
      window.saveHotelToServer(formData).then(() => {
        closeModal();
        // reset form
        document.getElementById('nomHotel').value = '';
        document.getElementById('adresse').value = '';
        document.getElementById('email').value = '';
        document.getElementById('telephone').value = '';
        document.getElementById('prix').value = '';
        document.getElementById('devise').value = '';
      }).catch((e) => {
        console.error('Erreur ajout hôtel:', e);
      });
      return;
    }

    // Fallback: Ajouter une nouvelle carte d'hôtel à la grille
    addHotelCard(formData);
    alert(`Hôtel "${formData.nomHotel}" ajouté avec succès !`);
    closeModal();
    // Réinitialiser le formulaire
    document.getElementById('nomHotel').value = '';
    document.getElementById('adresse').value = '';
    document.getElementById('email').value = '';
    document.getElementById('telephone').value = '';
    document.getElementById('prix').value = '';
    document.getElementById('devise').value = '';
}

// Ajouter une carte d'hôtel dynamiquement
function addHotelCard(hotel) {
  const grid = document.querySelector('.grid');
  if (!grid) return;
  
  const newCard = document.createElement('div');
  newCard.className = 'card';
  newCard.innerHTML = `
    <img src="../Images/default_hotel.png" alt="${hotel.nomHotel}">
    <div class="card-body">
      <p class="address">${hotel.adresse}</p>
      <h3>${hotel.nomHotel}</h3>
      <p class="price">${hotel.prix} ${hotel.devise} par nuit</p>
    </div>
  `;
  
  grid.appendChild(newCard);
  
  // Mettre à jour le compteur
  const span = document.querySelector('.header-bottom h2 span');
  if (span) {
    const currentCount = parseInt(span.textContent) || 0;
    span.textContent = currentCount + 1;
  }
}

// Événements
if (openBtn) openBtn.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (saveBtn) saveBtn.addEventListener('click', saveHotel);

// Fermer en cliquant à l'extérieur
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Fermer avec Echap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && modal.style.display === 'block') {
    closeModal();
  }
});