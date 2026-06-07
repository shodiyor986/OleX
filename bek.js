"use strict";

const CFG = {
  SHEETDB: 'https://sheetdb.io/api/v1/ismqzmra83a4l',
  IMGBB_KEY: '786b6ed20a17f40a8a6d037aef43fdc7',
  EXPIRE_DAYS: 7
};

const EMOJIS = ['😊', '😎', '🤩', '🥳', '😄', '🤗'];

const CAT_LABELS = {
  electronics: '📱 Elektronika',
  clothes: '👗 Kiyim',
  home: '🏠 Uy',
  cars: '🚗 Avto',
  food: '🍎 Oziq-ovqat',
  other: '📦 Boshqa'
};

let STATE = {
  tgUser: null,
  profile: null,
  products: [],
  filtered: [],
  currentCat: 'all',
  selectedEmoji: '😊',
  prevPage: 'home'
};

window.addEventListener('DOMContentLoaded', async () => {
  // Search toggle
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      document.getElementById('searchBar').classList.toggle('hidden');
    });
  }

  // Image upload preview
  const prodImgInput = document.getElementById('prodImgInput');
  if (prodImgInput) {
    prodImgInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          document.getElementById('prodImgPreview').src = e.target.result;
          document.getElementById('imgPreviewWrap').classList.remove('hidden');
          document.getElementById('uploadZone').style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Telegram WebApp
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  // Splash screen
  await new Promise(r => setTimeout(r, 1900));
  document.getElementById('splash').classList.add('fade-out');
  setTimeout(() => document.getElementById('splash').classList.add('hidden'), 500);

  // Get user
  const tgUser = tg?.initDataUnsafe?.user || null;
  STATE.tgUser = tgUser || { 
    id: 'demo_' + Date.now(), 
    username: 'demo_user', 
    first_name: 'Demo', 
    last_name: 'Foydalanuvchi' 
  };

  // Check username
  if (STATE.tgUser.username) {
    document.getElementById('app').classList.remove('hidden');
    buildEmojiGrid();
    await loadProfile();
    await loadProducts();
  } else {
    document.getElementById('noUsernameScreen').classList.remove('hidden');
  }
});

// ========== API FUNCTIONS ==========
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('GET ' + res.status);
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('POST ' + res.status);
  return res.json();
}

// ========== NAVIGATION ==========
function navigate(pageName, savePrev = true) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${pageName}`);
    p.classList.toggle('hidden', p.id !== `page-${pageName}`);
  });
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
  
  if (savePrev) STATE.prevPage = pageName;
  
  if (pageName === 'home') {
    renderProducts(STATE.filtered.length ? STATE.filtered : STATE.products);
  }
  if (pageName === 'profile') {
    renderProfile();
    renderMyProducts();
  }
}

function navigateToAdd() {
  if (!STATE.tgUser?.username) {
    showMsg('addStatus', '❌ Mahsulot qo\'shish uchun Telegram username kerak!', 'error');
    return;
  }
  navigate('add');
}

function goBack() {
  navigate(STATE.prevPage || 'home', false);
}

// ========== PROFILE ==========
async function loadProfile() {
  const uid = String(STATE.tgUser.id);
  try {
    const data = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(uid)}&sheet=Profillar`);
    if (Array.isArray(data) && data.length > 0) {
      STATE.profile = data[0];
      STATE.selectedEmoji = data[0].emoji || '😊';
    } else {
      STATE.profile = {
        user_id: uid,
        username: STATE.tgUser.username || '',
        ism: STATE.tgUser.first_name || '',
        familya: STATE.tgUser.last_name || '',
        telefon: '',
        shahar: '',
        emoji: '😊'
      };
    }
  } catch(e) {
    console.error('loadProfile:', e);
    STATE.profile = {
      user_id: uid,
      username: STATE.tgUser.username || '',
      ism: STATE.tgUser.first_name || '',
      familya: STATE.tgUser.last_name || '',
      telefon: '',
      shahar: '',
      emoji: '😊'
    };
  }
}

function renderProfile() {
  if (!STATE.profile) return;
  
  document.getElementById('profileAvatar').textContent = STATE.profile.emoji || '😊';
  document.getElementById('profileName').textContent = 
    [STATE.profile.ism, STATE.profile.familya].filter(Boolean).join(' ') || 'Ism kiritilmagan';
  document.getElementById('profileUsername').textContent = STATE.profile.username ? `@${STATE.profile.username}` : '';
  
  document.getElementById('pfIsm').value = STATE.profile.ism || '';
  document.getElementById('pfFamilya').value = STATE.profile.familya || '';
  document.getElementById('pfTelefon').value = STATE.profile.telefon || '';
  document.getElementById('pfShahar').value = STATE.profile.shahar || '';
  
  STATE.selectedEmoji = STATE.profile.emoji || '😊';
  highlightEmoji(STATE.selectedEmoji);
}

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  btn.textContent = 'Saqlanmoqda...';
  
  const uid = String(STATE.tgUser.id);
  const payload = {
    user_id: uid,
    username: STATE.tgUser.username || '',
    ism: document.getElementById('pfIsm').value.trim(),
    familya: document.getElementById('pfFamilya').value.trim(),
    telefon: document.getElementById('pfTelefon').value.trim(),
    shahar: document.getElementById('pfShahar').value.trim(),
    emoji: STATE.selectedEmoji,
    updated_at: new Date().toISOString()
  };
  
  try {
    const existing = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(uid)}&sheet=Profillar`);
    
    if (Array.isArray(existing) && existing.length > 0) {
      await fetch(`${CFG.SHEETDB}/user_id/${encodeURIComponent(uid)}?sheet=Profillar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });
    } else {
      await apiPost(`${CFG.SHEETDB}?sheet=Profillar`, { data: [payload] });
    }
    
    STATE.profile = payload;
    renderProfile();
    showMsg('profileStatus', '✅ Profil saqlandi!', 'success');
  } catch(e) {
    showMsg('profileStatus', '❌ Xatolik: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Saqlash ✅';
  }
}

function buildEmojiGrid() {
  const grid = document.getElementById('emojiGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  EMOJIS.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'emoji-item';
    btn.textContent = em;
    btn.onclick = () => {
      STATE.selectedEmoji = em;
      highlightEmoji(em);
    };
    grid.appendChild(btn);
  });
}

function highlightEmoji(em) {
  document.querySelectorAll('.emoji-item').forEach(el => {
    el.classList.toggle('selected', el.textContent === em);
  });
}

// ========== PRODUCTS ==========
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (grid) grid.innerHTML = '<div class="loading-state">⏳ Yuklanmoqda...</div>';
  
  try {
    let data = await apiGet(`${CFG.SHEETDB}?sheet=Mahsulotlar`);
    if (!Array.isArray(data)) data = [];
    
    // Filter out INIT entries
    data = data.filter(p => p.id && p.id !== 'INIT' && p.title && p.title !== 'INIT');
    
    // Auto delete expired
    const now = Date.now();
    const toDelete = data.filter(p => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at).getTime();
      return !isNaN(created) && (now - created) > CFG.EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    });
    
    for (const p of toDelete) {
      try {
        await fetch(`${CFG.SHEETDB}/id/${encodeURIComponent(p.id)}?sheet=Mahsulotlar`, { method: 'DELETE' });
      } catch(e) {}
    }
    
    // Reload after deletion
    let fresh = await apiGet(`${CFG.SHEETDB}?sheet=Mahsulotlar`);
    if (!Array.isArray(fresh)) fresh = [];
    
    STATE.products = fresh.filter(p => p.id && p.id !== 'INIT' && p.title && p.title !== 'INIT');
    STATE.filtered = [...STATE.products];
    renderProducts(STATE.products);
  } catch(e) {
    console.error('loadProducts:', e);
    if (grid) grid.innerHTML = '<div class="empty-state-full">⚠️ Yuklab bo\'lmadi</div>';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  if (!products || products.length === 0) {
    grid.innerHTML = '<div class="empty-state-full">🛒 Hali mahsulotlar yo\'q</div>';
    return;
  }
  
  grid.innerHTML = products.map(p => productCardHTML(p)).join('');
}

function productCardHTML(p) {
  const daysLeft = getDaysLeft(p.created_at);
  const isExpired = daysLeft <= 0;
  const imgHTML = p.img_url
    ? `<img class="card-img" src="${escapeHtml(p.img_url)}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23cccccc%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3E📷%3C/text%3E%3C/svg%3E'">`
    : `<div class="card-img-placeholder">${getCatEmoji(p.category)}</div>`;
  
  const saleBadge = p.for_sale === 'true'
    ? '<span class="card-sale-badge">Sotuvda</span>'
    : '';
  const expBadge = isExpired ? '<span class="card-expired-badge">Muddati o\'tgan</span>' : '';
  
  return `
    <div class="product-card" onclick="openDetail('${escapeHtml(p.id)}')">
      ${imgHTML}
      ${saleBadge}${expBadge}
      <div class="card-body">
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="card-price">${formatPrice(p.price)} so'm</div>
        <div class="card-location">📍 ${escapeHtml(p.location || '')}</div>
      </div>
    </div>`;
}

// ========== FILTERS ==========
function filterByCategory(btn, cat) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  STATE.currentCat = cat;
  applyFilters();
}

function filterProducts() {
  applyFilters();
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const cat = STATE.currentCat;
  
  STATE.filtered = STATE.products.filter(p => {
    const matchCat = cat === 'all' || p.category === cat;
    const matchQ = !q || 
      (p.title && p.title.toLowerCase().includes(q)) || 
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q));
    return matchCat && matchQ;
  });
  renderProducts(STATE.filtered);
}

// ========== PRODUCT DETAIL ==========
async function openDetail(id) {
  const p = STATE.products.find(x => x.id === id);
  if (!p) return;
  
  STATE.prevPage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'home';
  navigate('detail', false);
  
  let sellerProfile = null;
  try {
    const sd = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(p.user_id)}&sheet=Profillar`);
    if (Array.isArray(sd) && sd.length > 0) sellerProfile = sd[0];
  } catch(e) {}
  
  const daysLeft = getDaysLeft(p.created_at);
  const imgHTML = p.img_url 
    ? `<img class="detail-img" src="${escapeHtml(p.img_url)}" alt="${escapeHtml(p.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3E📷%3C/text%3E%3C/svg%3E'">`
    : '';
  
  const saleBadge = p.for_sale === 'true'
    ? '<span class="badge badge-sale">✅ Sotuvda</span>'
    : '<span class="badge badge-sold">❌ Sotilgan</span>';
  
  const sellerName = sellerProfile
    ? [sellerProfile.ism, sellerProfile.familya].filter(Boolean).join(' ') || 'Sotuvchi'
    : p.user_id || 'Sotuvchi';
  const sellerEmoji = sellerProfile?.emoji || '👤';
  const sellerCity = sellerProfile?.shahar || '';
  
  const myUid = String(STATE.tgUser?.id || '');
  const isOwner = p.user_id === myUid;
  const phoneHTML = isOwner && p.phone
    ? `<div class="seller-phone">📞 ${escapeHtml(p.phone)}</div>`
    : '';
  
  const contactBtns = isOwner
    ? '<p style="color:#666;font-size:0.85rem;text-align:center">Bu sizning mahsulotingiz</p>'
    : `
      ${p.phone ? `<a href="tel:${escapeHtml(p.phone)}" class="btn-green">📞 Telefon qilish</a>` : ''}
      ${sellerProfile?.username ? `<a href="https://t.me/${escapeHtml(sellerProfile.username)}" target="_blank" class="btn-tg">💬 Telegramda yozish</a>` : ''}
    `;
  
  const detailContent = document.getElementById('detailContent');
  if (detailContent) {
    detailContent.innerHTML = `
      ${imgHTML}
      <div class="detail-card">
        <div class="detail-title">${escapeHtml(p.title)}</div>
        <div class="detail-price">${formatPrice(p.price)} so'm</div>
        <div class="detail-badges">
          <span class="badge badge-cat">${CAT_LABELS[p.category] || p.category || '📦 Boshqa'}</span>
          <span class="badge badge-loc">📍 ${escapeHtml(p.location || '')}</span>
          ${saleBadge}
        </div>
        <div class="detail-desc-title">Tavsif</div>
        <div class="detail-desc">${escapeHtml(p.description || 'Tavsif yo\'q')}</div>
        <div class="detail-meta">🕒 ${daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Muddati o\'tgan'} · ${formatDate(p.created_at)}</div>
      </div>
      <div class="contact-card">
        <h3>Sotuvchi</h3>
        <div class="seller-info">
          <div class="seller-avatar">${sellerEmoji}</div>
          <div>
            <div class="seller-name">${escapeHtml(sellerName)}</div>
            ${sellerCity ? `<div class="seller-city">📍 ${escapeHtml(sellerCity)}</div>` : ''}
            ${phoneHTML}
          </div>
        </div>
        <div class="contact-buttons">${contactBtns}</div>
      </div>
    `;
  }
}

// ========== ADD PRODUCT ==========
function removeProductImage() {
  document.getElementById('prodImgInput').value = '';
  document.getElementById('prodImgPreview').src = '';
  document.getElementById('imgPreviewWrap').classList.add('hidden');
  document.getElementById('uploadZone').style.display = '';
}

async function addProduct() {
  const title = document.getElementById('prodTitle').value.trim();
  const price = document.getElementById('prodPrice').value.trim();
  const category = document.getElementById('prodCategory').value;
  const location = document.getElementById('prodLocation').value.trim();
  const desc = document.getElementById('prodDesc').value.trim();
  const phone = document.getElementById('prodPhone').value.trim();
  const forSale = document.getElementById('prodForSale').checked;
  const file = document.getElementById('prodImgInput').files[0];
  
  if (!title) { showMsg('addStatus', '❗ Mahsulot nomini kiriting', 'error'); return; }
  if (!price) { showMsg('addStatus', '❗ Narxni kiriting', 'error'); return; }
  if (!category) { showMsg('addStatus', '❗ Kategoriyani tanlang', 'error'); return; }
  if (!location) { showMsg('addStatus', '❗ Joylashuvni kiriting', 'error'); return; }
  if (!desc) { showMsg('addStatus', '❗ Tavsif kiriting', 'error'); return; }
  if (!phone) { showMsg('addStatus', '❗ Telefon raqam kiriting', 'error'); return; }
  if (!file) { showMsg('addStatus', '❗ Rasm tanlang', 'error'); return; }
  
  const btn = document.getElementById('addProductBtn');
  btn.disabled = true;
  btn.textContent = 'Rasm yuklanmoqda...';
  
  try {
    const base64 = await fileToBase64(file);
    const fd = new FormData();
    fd.append('key', CFG.IMGBB_KEY);
    fd.append('image', base64);
    
    const imgRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
    if (!imgRes.ok) throw new Error('Rasm yuklanmadi');
    const imgData = await imgRes.json();
    if (!imgData.success) throw new Error(imgData.error?.message || 'Rasm yuklanmadi');
    const imgUrl = imgData.data.url;
    
    btn.textContent = 'Saqlanmoqda...';
    const uid = String(STATE.tgUser.id);
    const prodId = 'P' + Date.now();
    
    await apiPost(`${CFG.SHEETDB}?sheet=Mahsulotlar`, {
      data: [{
        id: prodId,
        user_id: uid,
        title: title,
        price: price,
        category: category,
        location: location,
        description: desc,
        phone: phone,
        img_url: imgUrl,
        for_sale: String(forSale),
        created_at: new Date().toISOString()
      }]
    });
    
    // Clear form
    document.getElementById('prodTitle').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodLocation').value = '';
    document.getElementById('prodDesc').value = '';
    document.getElementById('prodPhone').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodForSale').checked = true;
    removeProductImage();
    
    showMsg('addStatus', '✅ Mahsulot qo\'shildi!', 'success');
    await loadProducts();
    setTimeout(() => navigate('home'), 1500);
  } catch(e) {
    showMsg('addStatus', '❌ ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Mahsulot qo\'shish';
  }
}

// ========== MY PRODUCTS ==========
function renderMyProducts() {
  const uid = String(STATE.tgUser?.id || '');
  const mine = STATE.products.filter(p => p.user_id === uid);
  const grid = document.getElementById('myProductGrid');
  
  if (!grid) return;
  
  if (!mine.length) {
    grid.innerHTML = '<div class="empty-my">Hali mahsulot yo\'q</div>';
    return;
  }
  
  grid.innerHTML = mine.map(p => {
    const daysLeft = getDaysLeft(p.created_at);
    const imgHTML = p.img_url
      ? `<img class="card-img" src="${escapeHtml(p.img_url)}" alt="" loading="lazy" style="aspect-ratio:4/3">`
      : `<div class="card-img-placeholder" style="aspect-ratio:4/3">${getCatEmoji(p.category)}</div>`;
    
    return `
      <div class="my-prod-card" onclick="openDetail('${escapeHtml(p.id)}')">
        ${imgHTML}
        <span class="my-prod-days">${daysLeft > 0 ? daysLeft + 'k' : '❌'}</span>
        <button class="delete-prod-btn" onclick="event.stopPropagation(); deleteMyProduct('${escapeHtml(p.id)}')">🗑</button>
        <div class="card-body" style="padding:7px 8px">
          <div class="card-title" style="font-size:0.8rem">${escapeHtml(p.title)}</div>
          <div class="card-price" style="font-size:0.85rem">${formatPrice(p.price)} so'm</div>
        </div>
      </div>`;
  }).join('');
}

async function deleteMyProduct(id) {
  if (!confirm('Mahsulotni o\'chirishni tasdiqlaysizmi?')) return;
  
  try {
    await fetch(`${CFG.SHEETDB}/id/${encodeURIComponent(id)}?sheet=Mahsulotlar`, { method: 'DELETE' });
    await loadProducts();
    renderMyProducts();
    showMsg('profileStatus', '✅ Mahsulot o\'chirildi', 'success');
  } catch(e) {
    alert('O\'chirishda xatolik: ' + e.message);
  }
}

// ========== HELPER FUNCTIONS ==========
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.readAsDataURL(file);
  });
}

function formatPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return val || '0';
  return n.toLocaleString('uz-UZ');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch(e) {
    return iso;
  }
}

function getDaysLeft(createdAt) {
  if (!createdAt) return CFG.EXPIRE_DAYS;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return CFG.EXPIRE_DAYS;
  const elapsed = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(CFG.EXPIRE_DAYS - elapsed));
}

function getCatEmoji(cat) {
  const map = { electronics: '📱', clothes: '👗', home: '🏠', cars: '🚗', food: '🍎', other: '📦' };
  return map[cat] || '📦';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showMsg(elId, msg, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
