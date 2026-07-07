// Récupération des éléments
const openBtn = document.getElementById('openFormBtn');
const modal = document.getElementById('hotelFormModal');
const closeBtn = document.querySelector('.close-modal');
const saveBtn = document.getElementById('saveHotelBtn');

// Gestion de la photo
let selectedImageBase64 = null;
let currentEditHotelId = null;
const photoInput = document.getElementById('photo');
const photoPreviewBox = document.getElementById('photo-preview-box');
const photoPreview = document.getElementById('photo-preview');
const deletePhotoPreview = document.getElementById('delete-photo-preview');

if (photoInput) {
  photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast('Veuillez sélectionner un fichier image valide.', 'warning');
        photoInput.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        selectedImageBase64 = event.target.result;
        if (photoPreview) photoPreview.src = selectedImageBase64;
        if (photoPreviewBox) photoPreviewBox.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (deletePhotoPreview) {
  deletePhotoPreview.addEventListener('click', function() {
    resetPhotoUpload();
  });
}

function resetPhotoUpload() {
  selectedImageBase64 = null;
  if (photoInput) photoInput.value = '';
  if (photoPreview) photoPreview.src = '';
  if (photoPreviewBox) photoPreviewBox.style.display = 'none';
}

function toast(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    alert(message);
  }
}

// Vérifier si les éléments existent
if (!openBtn) console.error('Bouton openFormBtn non trouvé');
if (!modal) console.error('Modal hotelFormModal non trouvée');

// Réinitialiser les champs et l'aperçu
function resetFormFields() {
  currentEditHotelId = null;
  const title = document.getElementById('modalTitleText');
  if (title) title.textContent = "CRÉER UN NOUVEL HÔTEL";
  if (saveBtn) saveBtn.textContent = "Enregistrer";
  
  if (document.getElementById('nomHotel')) document.getElementById('nomHotel').value = '';
  if (document.getElementById('adresse')) document.getElementById('adresse').value = '';
  if (document.getElementById('email')) document.getElementById('email').value = '';
  if (document.getElementById('telephone')) document.getElementById('telephone').value = '';
  if (document.getElementById('prix')) document.getElementById('prix').value = '';
  if (document.getElementById('devise')) document.getElementById('devise').value = '';
  resetPhotoUpload();
}

// Ouvrir la modale
function openModal() {
  if (modal) {
    if (currentEditHotelId === null) {
      resetFormFields();
    }
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
    resetFormFields();
  }
}

// Ouvrir la modale en mode modification
window.editHotelById = function(hotel) {
  currentEditHotelId = hotel._id;
  
  const title = document.getElementById('modalTitleText');
  if (title) title.textContent = "MODIFIER L'HÔTEL";
  if (saveBtn) saveBtn.textContent = "Modifier";
  
  if (document.getElementById('nomHotel')) document.getElementById('nomHotel').value = hotel.name || '';
  if (document.getElementById('adresse')) document.getElementById('adresse').value = hotel.address?.street || hotel.adresse || '';
  if (document.getElementById('email')) document.getElementById('email').value = hotel.email || '';
  if (document.getElementById('telephone')) document.getElementById('telephone').value = hotel.phone || hotel.telephone || '';
  if (document.getElementById('prix')) document.getElementById('prix').value = hotel.pricePerNight || hotel.prix || '';
  if (document.getElementById('devise')) document.getElementById('devise').value = hotel.currency || hotel.devise || 'XOF';
  
  const imgUrl = (hotel.images && hotel.images[0]) || hotel.image;
  if (imgUrl) {
    selectedImageBase64 = null; // Pas de nouvelle image lue encore, mais affichage de l'aperçu existant
    if (photoPreview) photoPreview.src = imgUrl;
    if (photoPreviewBox) photoPreviewBox.style.display = 'block';
  } else {
    resetPhotoUpload();
  }
  
  if (modal) {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  }
};

// Récupérer les valeurs du formulaire
function getFormData() {
  return {
    nomHotel: document.getElementById('nomHotel')?.value || '',
    adresse: document.getElementById('adresse')?.value || '',
    email: document.getElementById('email')?.value || '',
    telephone: document.getElementById('telephone')?.value || '',
    prix: document.getElementById('prix')?.value || '',
    devise: document.getElementById('devise')?.value || '',
    image: selectedImageBase64
  };
}

// Valider le formulaire
function validateForm() {
  const data = getFormData();
  const telephonePattern = /^\d{9}$/;
  const prixPattern = /^\d{5}$/;

  if (!data.nomHotel.trim()) {
    toast('Veuillez saisir le nom de l\'hôtel', 'warning');
    return false;
  }
  if (data.nomHotel.trim().length > 35) {
    toast('Le nom de l\'hôtel ne doit pas dépasser 35 caractères', 'warning');
    return false;
  }
  if (!data.adresse.trim()) {
    toast('Veuillez saisir l\'adresse', 'warning');
    return false;
  }
  if (data.adresse.trim().length > 35) {
    toast('L\'adresse ne doit pas dépasser 35 caractères', 'warning');
    return false;
  }
  if (!data.email.trim()) {
    toast('Veuillez saisir l\'email', 'warning');
    return false;
  }
  if (!data.telephone.trim()) {
    toast('Veuillez saisir le téléphone', 'warning');
    return false;
  }
  if (!telephonePattern.test(data.telephone)) {
    toast('Le téléphone doit contenir exactement 9 chiffres', 'warning');
    return false;
  }
  if (!data.prix.trim()) {
    toast('Veuillez saisir le prix par nuit', 'warning');
    return false;
  }
  if (!prixPattern.test(data.prix)) {
    toast('Le prix par nuit doit contenir exactement 5 chiffres', 'warning');
    return false;
  }
  if (!data.devise.trim()) {
    toast('Veuillez choisir une devise', 'warning');
    return false;
  }
  
  return true;
}

// Sauvegarder l'hôtel (Création ou Modification)
function saveHotel() {
  if (!validateForm()) return;
  
  const formData = getFormData();
  
  if (currentEditHotelId) {
    if (typeof window.updateHotelOnServer === 'function') {
      window.updateHotelOnServer(currentEditHotelId, formData).then(() => {
        closeModal();
        resetFormFields();
      }).catch((e) => {
        console.error('Erreur modification hôtel:', e);
      });
      return;
    }
  } else {
    if (typeof window.saveHotelToServer === 'function') {
      window.saveHotelToServer(formData).then(() => {
        closeModal();
        resetFormFields();
      }).catch((e) => {
        console.error('Erreur ajout hôtel:', e);
      });
      return;
    }
  }

  // Fallback local
  if (currentEditHotelId) {
    toast("Mode modification en local non supporté.", 'error');
  } else {
    addHotelCard(formData);
    toast(`Hôtel "${formData.nomHotel}" ajouté avec succès !`, 'success');
  }
  closeModal();
  resetFormFields();
}

// Ajouter une carte d'hôtel dynamiquement (uniquement utilisé en création locale / fallback)
function addHotelCard(hotel) {
  const grid = document.querySelector('.grid');
  if (!grid) return;
  
  const imageUrl = (hotel.images && hotel.images[0]) || hotel.image || '../Images/default_hotel.png';
  
  const newCard = document.createElement('div');
  newCard.className = 'card';
  newCard.innerHTML = `
    <img src="${imageUrl}" alt="${hotel.nomHotel}">
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