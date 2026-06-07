/* ============================================================
   BozorUZ — bek.js
   Telegram Mini App · OLX klon (Full Version with Modal Filter)
   ============================================================ */

"use strict";

/* ── SOZLAMALAR ── */
const CFG = {
  SHEETDB:    'https://sheetdb.io/api/v1/ismqzmra83a4l',
  IMGBB_KEY:  '786b6ed20a17f40a8a6d037aef43fdc7',
  SHEET_PRODUCTS: 'Mahsulotlar',
  SHEET_PROFILES: 'Profillar',
  EXPIRE_DAYS: 7
};

/* ── EMOJI RO'YXATI ── */
const EMOJIS = [
  '😊','😎','🤩','🥳','😄','🤗'
];

/* ── KATEGORIYA NOMI ── */
const CAT_LABELS = {
  electronics: '📱 Elektronika',
  livestock:   '🐄 Chorvachilik',
  clothes:     '👗 Kiyim',
  home:        '🏠 Uy jihozlari',
  cars:        '🚗 Avto',
  food:        '🍎 Oziq-ovqat',
  other:       '📦 Boshqa'
};

/* ── HOLAT ── */
let STATE = {
  tgUser:       null,
  profile:      null,
  products:     [],
  filtered:     [],
  currentCat:   'all',
  prevPage:     null,
  selectedEmoji: '😊',
  profileLoaded: false
};

/* ── FILTR HOLATI ── */
let FILTER_STATE = {
  minPrice: '',
  maxPrice: '',
  sortBy: 'default',
  quickFilter: 'all'
};

/* ── MODAL FILTR HOLATI ── */
let MODAL_FILTERS = {
  sortBy: 'default',
  category: 'all',
  quickFilter: 'all',
  minPrice: '',
  maxPrice: ''
};

/* ═══════════════════════════════════════════
   TELEGRAM THEME — DARK MODE QO'LLAB-QUVVATLASH
   ═══════════════════════════════════════════ */
function applyTelegramTheme() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  
  const themeParams = tg.themeParams || {};
  
  // CSS o'zgaruvchilarini yangilash
  document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#f0f4f8');
  document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#1a1a2e');
  document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#7a8498');
  document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2563eb');
  document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2563eb');
  document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#ffffff');
  
  // Body class qo'shish (agar dark mode bo'lsa)
  if (tg.colorScheme === 'dark') {
    document.body.classList.add('tg-dark');
    document.body.classList.remove('tg-light');
  } else {
    document.body.classList.add('tg-light');
    document.body.classList.remove('tg-dark');
  }
  
  // Status bar rangini o'zgartirish
  if (tg.setHeaderColor) {
    tg.setHeaderColor(themeParams.bg_color || '#f0f4f8');
  }
  
  console.log('Theme applied:', tg.colorScheme);
}

function initTelegramTheme() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  
  // Dastlabki ranglarni qo'llash
  applyTelegramTheme();
  
  // Tema o'zgarishini kuzatish
  tg.onEvent('themeChanged', () => {
    applyTelegramTheme();
  });
  
  // WebApp ni kengaytirish
  tg.expand();
  tg.ready();
}

/* ═══════════════════════════════════════════
   ISHGA TUSHURISH
   ═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  // Telegram tema qo'llash
  initTelegramTheme();
  
  // searchToggleBtn listener
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      const bar = document.getElementById('searchBar');
      bar.classList.toggle('hidden');
      if (!bar.classList.contains('hidden')) {
        document.getElementById('searchInput').focus();
      }
    });
  }

  // prodImgInput listener
  const prodImgInput = document.getElementById('prodImgInput');
  if (prodImgInput) {
    prodImgInput.addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('prodImgPreview').src = e.target.result;
        document.getElementById('imgPreviewWrap').classList.remove('hidden');
        document.getElementById('uploadZone').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  // Splash animatsiyasi
  await new Promise(r => setTimeout(r, 1900));

  // Telegram foydalanuvchisini olish
  const tg = window.Telegram?.WebApp;
  const tgUser = getTgUser(tg);
  STATE.tgUser = tgUser;

  // Splash-ni yashirish
  const splash = document.getElementById('splash');
  splash.classList.add('fade-out');
  setTimeout(() => splash.classList.add('hidden'), 500);

  // Sheet headers yaratish
  ensureSheetHeaders();

  // Foydalanuvchini tekshirish
  if (tgUser && tgUser.username) {
    document.getElementById('app').classList.remove('hidden');
    buildEmojiGrid();
    await Promise.all([loadProfile(), loadProducts()]);
  } else if (tgUser && !tgUser.username) {
    document.getElementById('noUsernameScreen').classList.remove('hidden');
  } else {
    // Demo rejim (brauzerda ochilganda)
    STATE.tgUser = { id: 'demo_001', username: 'demo_user', first_name: 'Demo', last_name: 'Foydalanuvchi' };
    document.getElementById('app').classList.remove('hidden');
    buildEmojiGrid();
    await Promise.all([loadProfile(), loadProducts()]);
  }
  
  // Filtr tugmasi ko'rinishini yangilash
  setTimeout(updateFilterFabVisibility, 100);
});

/* Telegram foydalanuvchisini olish */
function getTgUser(tg) {
  try {
    if (tg?.initDataUnsafe?.user) return tg.initDataUnsafe.user;
  } catch(e) {}
  return null;
}

/* ═══════════════════════════════════════════
   SHEET HEADERS
   ═══════════════════════════════════════════ */
async function ensureSheetHeaders() {
  try {
    const r1 = await apiGet(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PRODUCTS}&limit=1`);
    if (!Array.isArray(r1) || r1.length === 0) {
      await apiPost(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PRODUCTS}`, {
        data: [{
          id: 'INIT', user_id: '', title: 'INIT', price: '0',
          category: '', location: '', description: '',
          phone: '', img_url: '', for_sale: 'true',
          created_at: new Date().toISOString()
        }]
      });
      await fetch(`${CFG.SHEETDB}/id/INIT?sheet=${CFG.SHEET_PRODUCTS}`, { method: 'DELETE' });
    }

    const r2 = await apiGet(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PROFILES}&limit=1`);
    if (!Array.isArray(r2) || r2.length === 0) {
      await apiPost(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PROFILES}`, {
        data: [{
          user_id: 'INIT', username: '', ism: '', familya: '',
          telefon: '', shahar: '', emoji: '😊',
          updated_at: new Date().toISOString()
        }]
      });
      await fetch(`${CFG.SHEETDB}/user_id/INIT?sheet=${CFG.SHEET_PROFILES}`, { method: 'DELETE' });
    }
  } catch(e) {
    console.warn('ensureSheetHeaders:', e.message);
  }
}

/* ═══════════════════════════════════════════
   NAVIGATSIYA
   ═══════════════════════════════════════════ */
function navigate(pageName, savePrev = true) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => {
    p.classList.toggle('active', p.id === `page-${pageName}`);
    p.classList.toggle('hidden', p.id !== `page-${pageName}`);
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  if (savePrev) STATE.prevPage = pageName;

  if (pageName === 'home') {
    renderProducts(STATE.filtered.length ? STATE.filtered : STATE.products);
    // Filtr tugmasini ko'rsatish
    const fab = document.getElementById('filterFab');
    if (fab) fab.style.display = 'flex';
  } else {
    // Boshqa sahifalarda filtr tugmasini yashirish
    const fab = document.getElementById('filterFab');
    if (fab) fab.style.display = 'none';
  }
  
  if (pageName === 'profile') {
    renderProfile();
    renderMyProducts();
  }
  
  // Filtr badge sonini yangilash
  updateFilterBadgeCount();
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

/* ═══════════════════════════════════════════
   PROFIL — YUKLASH & SAQLASH
   ═══════════════════════════════════════════ */
async function loadProfile() {
  const uid = String(STATE.tgUser.id);
  try {
    const data = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(uid)}&sheet=${CFG.SHEET_PROFILES}`);
    if (Array.isArray(data) && data.length > 0) {
      STATE.profile = data[0];
      STATE.selectedEmoji = data[0].emoji || '😊';
    } else {
      STATE.profile = {
        user_id: uid,
        username: STATE.tgUser.username || '',
        ism: STATE.tgUser.first_name || '',
        familya: STATE.tgUser.last_name || '',
        telefon: '', shahar: '', emoji: '😊'
      };
    }
  } catch(e) {
    console.error('loadProfile:', e);
    STATE.profile = { user_id: uid, username: STATE.tgUser.username || '', ism: '', familya: '', telefon: '', shahar: '', emoji: '😊' };
  }
  STATE.profileLoaded = true;
}

function renderProfile() {
  if (!STATE.profile) return;
  const p = STATE.profile;

  document.getElementById('profileAvatar').textContent   = p.emoji || '😊';
  document.getElementById('profileName').textContent     = [p.ism, p.familya].filter(Boolean).join(' ') || 'Ism kiritilmagan';
  document.getElementById('profileUsername').textContent = p.username ? `@${p.username}` : '';

  document.getElementById('pfIsm').value     = p.ism || '';
  document.getElementById('pfFamilya').value = p.familya || '';
  document.getElementById('pfTelefon').value = p.telefon || '';
  document.getElementById('pfShahar').value  = p.shahar || '';
  STATE.selectedEmoji = p.emoji || '😊';
  highlightEmoji(STATE.selectedEmoji);
}

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  btn.textContent = 'Saqlanmoqda...';

  const uid = String(STATE.tgUser.id);
  const payload = {
    user_id:    uid,
    username:   STATE.tgUser.username || '',
    ism:        document.getElementById('pfIsm').value.trim(),
    familya:    document.getElementById('pfFamilya').value.trim(),
    telefon:    document.getElementById('pfTelefon').value.trim(),
    shahar:     document.getElementById('pfShahar').value.trim(),
    emoji:      STATE.selectedEmoji,
    updated_at: new Date().toISOString()
  };

  try {
    const existing = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(uid)}&sheet=${CFG.SHEET_PROFILES}`);

    if (Array.isArray(existing) && existing.length > 0) {
      await fetch(`${CFG.SHEETDB}/user_id/${encodeURIComponent(uid)}?sheet=${CFG.SHEET_PROFILES}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });
    } else {
      await apiPost(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PROFILES}`, { data: [payload] });
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
    btn.title = em;
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

/* ═══════════════════════════════════════════
   MAHSULOTLAR — YUKLASH
   ═══════════════════════════════════════════ */
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (grid) {
    grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Yuklanmoqda...</p></div>';
  }
  try {
    let data = await apiGet(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PRODUCTS}`);
    if (!Array.isArray(data)) data = [];

    await autoDeleteExpired(data);

    let fresh = await apiGet(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PRODUCTS}`);
    if (!Array.isArray(fresh)) fresh = [];

    STATE.products = fresh.filter(p => p.id && p.id !== 'INIT' && p.title && p.title !== 'INIT');
    STATE.filtered = [...STATE.products];
    renderProducts(STATE.products);
  } catch(e) {
    if (grid) {
      grid.innerHTML = '<div class="empty-state-full"><span class="big-emoji">⚠️</span><p>Yuklab bo\'lmadi. Qayta urinib ko\'ring.</p></div>';
    }
  }
}

async function autoDeleteExpired(products) {
  const now = Date.now();
  const toDelete = products.filter(p => {
    if (!p.created_at || p.id === 'INIT') return false;
    const created = new Date(p.created_at).getTime();
    if (isNaN(created)) return false;
    return (now - created) > CFG.EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  });

  for (const p of toDelete) {
    try {
      await fetch(`${CFG.SHEETDB}/id/${encodeURIComponent(p.id)}?sheet=${CFG.SHEET_PRODUCTS}`, {
        method: 'DELETE'
      });
    } catch(e) {}
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  if (!products || products.length === 0) {
    grid.innerHTML = '<div class="empty-state-full"><span class="big-emoji">🛒</span><p>Hali mahsulotlar yo\'q</p></div>';
    return;
  }
  grid.innerHTML = products.map(p => productCardHTML(p)).join('');
}

function productCardHTML(p) {
  const daysLeft  = getDaysLeft(p.created_at);
  const isExpired = daysLeft <= 0;
  const imgHTML   = p.img_url
    ? `<img class="card-img" src="${esc(p.img_url)}" alt="${esc(p.title)}" loading="lazy">`
    : `<div class="card-img-placeholder">${getCatEmoji(p.category)}</div>`;
  const saleBadge = p.for_sale === 'true'
    ? `<span class="card-sale-badge">Sotuvda</span>` : '';
  const expBadge  = isExpired ? `<span class="card-expired-badge">Muddati o'tgan</span>` : '';

  return `
    <div class="product-card" onclick="openDetail('${esc(p.id)}')">
      ${imgHTML}
      ${saleBadge}${expBadge}
      <div class="card-body">
        <div class="card-title">${esc(p.title)}</div>
        <div class="card-price">${fmtPrice(p.price)}</div>
        <div class="card-location">📍 ${esc(p.location || '')}</div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════
   FILTER & QIDIRISH
   ═══════════════════════════════════════════ */
function filterByCategory(btn, cat) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  STATE.currentCat = cat;
  applyAllFilters();
}

function filterProducts() {
  applyAllFilters();
}

// Barcha filtrlar va saralashni qo'llash
function applyAllFilters() {
  let filtered = [...STATE.products];
  
  // 1. Kategoriya filtri
  if (STATE.currentCat !== 'all') {
    filtered = filtered.filter(p => p.category === STATE.currentCat);
  }
  
  // 2. Qidiruv filtri
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  if (q) {
    filtered = filtered.filter(p => 
      p.title?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q) || 
      p.location?.toLowerCase().includes(q)
    );
  }
  
  // 3. Narx filtri
  const minPrice = FILTER_STATE.minPrice ? parseFloat(FILTER_STATE.minPrice) : null;
  const maxPrice = FILTER_STATE.maxPrice ? parseFloat(FILTER_STATE.maxPrice) : null;
  
  if (minPrice !== null) {
    filtered = filtered.filter(p => parseFloat(p.price || 0) >= minPrice);
  }
  if (maxPrice !== null) {
    filtered = filtered.filter(p => parseFloat(p.price || 0) <= maxPrice);
  }
  
  // 4. Tezkor filtrlar
  switch(FILTER_STATE.quickFilter) {
    case 'on_sale':
      filtered = filtered.filter(p => p.for_sale === 'true');
      break;
    case 'under_1m':
      filtered = filtered.filter(p => parseFloat(p.price || 0) <= 1000000);
      break;
    case 'under_5m':
      filtered = filtered.filter(p => parseFloat(p.price || 0) <= 5000000);
      break;
    case 'with_photo':
      filtered = filtered.filter(p => p.img_url && p.img_url.length > 0);
      break;
    default:
      break;
  }
  
  // 5. Saralash
  filtered = sortProducts(filtered);
  
  STATE.filtered = filtered;
  renderProducts(STATE.filtered);
}

// Saralash (sorting)
function sortProducts(products) {
  const sortBy = FILTER_STATE.sortBy;
  const sorted = [...products];
  
  switch(sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      break;
    case 'price_desc':
      sorted.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      break;
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      break;
    default:
      break;
  }
  return sorted;
}

// Narx bo'yicha filtr (inputdan)
function filterByPrice() {
  const minPrice = document.getElementById('minPrice')?.value || '';
  const maxPrice = document.getElementById('maxPrice')?.value || '';
  
  FILTER_STATE.minPrice = minPrice;
  FILTER_STATE.maxPrice = maxPrice;
  
  applyAllFilters();
  updateFilterBadges();
  updateFilterBadgeCount();
}

// Saralashni o'zgartirish
function changeSort() {
  const select = document.getElementById('sortSelect');
  if (select) {
    FILTER_STATE.sortBy = select.value;
    applyAllFilters();
    updateFilterBadges();
    updateFilterBadgeCount();
  }
}

// Tezkor filtr
function quickFilter(type) {
  FILTER_STATE.quickFilter = type;
  
  // UI da aktiv holatni ko'rsatish
  document.querySelectorAll('.quick-filter-chip').forEach(chip => {
    chip.classList.remove('active');
    if (chip.dataset.filter === type) {
      chip.classList.add('active');
    }
  });
  
  applyAllFilters();
  updateFilterBadges();
  updateFilterBadgeCount();
}

// Filtr badge larini yangilash
function updateFilterBadges() {
  const container = document.getElementById('activeFilterBadges');
  if (!container) return;
  
  let badges = [];
  
  if (FILTER_STATE.minPrice || FILTER_STATE.maxPrice) {
    let priceText = '';
    if (FILTER_STATE.minPrice && FILTER_STATE.maxPrice) {
      priceText = `${fmtPrice(FILTER_STATE.minPrice)} - ${fmtPrice(FILTER_STATE.maxPrice)} so'm`;
    } else if (FILTER_STATE.minPrice) {
      priceText = `${fmtPrice(FILTER_STATE.minPrice)}+ so'm`;
    } else if (FILTER_STATE.maxPrice) {
      priceText = `0 - ${fmtPrice(FILTER_STATE.maxPrice)} so'm`;
    }
    badges.push({ type: 'price', text: `💰 ${priceText}` });
  }
  
  if (FILTER_STATE.sortBy !== 'default') {
    const sortLabels = {
      price_asc: 'Narx: arzon → qimmat',
      price_desc: 'Narx: qimmat → arzon',
      newest: 'Eng yangi',
      oldest: 'Eng eski'
    };
    badges.push({ type: 'sort', text: `📊 ${sortLabels[FILTER_STATE.sortBy]}` });
  }
  
  if (FILTER_STATE.quickFilter !== 'all') {
    const quickLabels = {
      on_sale: '🏷️ Sotuvda',
      under_1m: '💰 1 mln dan kam',
      under_5m: '💰 5 mln dan kam',
      with_photo: '📸 Rasmlilar'
    };
    badges.push({ type: 'quick', text: quickLabels[FILTER_STATE.quickFilter] });
  }
  
  if (STATE.currentCat !== 'all') {
    const catLabels = {
      electronics: '📱 Elektronika',
      livestock: '🐄 Chorvachilik',
      clothes: '👗 Kiyim',
      home: '🏠 Uy',
      cars: '🚗 Avto',
      food: '🍎 Oziq-ovqat',
      other: '📦 Boshqa'
    };
    badges.push({ type: 'category', text: `📁 ${catLabels[STATE.currentCat] || STATE.currentCat}` });
  }
  
  if (badges.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = badges.map(badge => `
    <span class="filter-badge">
      ${badge.text}
      <button onclick="removeFilter('${badge.type}')">✕</button>
    </span>
  `).join('');
}

// Filtrni olib tashlash
function removeFilter(filterType) {
  switch(filterType) {
    case 'price':
      FILTER_STATE.minPrice = '';
      FILTER_STATE.maxPrice = '';
      if (document.getElementById('minPrice')) document.getElementById('minPrice').value = '';
      if (document.getElementById('maxPrice')) document.getElementById('maxPrice').value = '';
      break;
    case 'sort':
      FILTER_STATE.sortBy = 'default';
      if (document.getElementById('sortSelect')) document.getElementById('sortSelect').value = 'default';
      break;
    case 'quick':
      FILTER_STATE.quickFilter = 'all';
      document.querySelectorAll('.quick-filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.filter === 'all') {
          chip.classList.add('active');
        }
      });
      break;
    case 'category':
      STATE.currentCat = 'all';
      document.querySelectorAll('.filter-tab').forEach(tab => {
        if (tab.dataset.cat === 'all') {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      break;
  }
  updateFilterBadges();
  updateFilterBadgeCount();
  applyAllFilters();
}

// Barcha filtrlar va saralashni reset qilish
function resetAllFilters() {
  FILTER_STATE = {
    minPrice: '',
    maxPrice: '',
    sortBy: 'default',
    quickFilter: 'all'
  };
  
  STATE.currentCat = 'all';
  
  // Inputlarni tozalash
  if (document.getElementById('minPrice')) document.getElementById('minPrice').value = '';
  if (document.getElementById('maxPrice')) document.getElementById('maxPrice').value = '';
  if (document.getElementById('sortSelect')) document.getElementById('sortSelect').value = 'default';
  
  // Qidiruvni tozalash
  if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
  
  // Kategoriya tablarini aktivlashtirish
  document.querySelectorAll('.filter-tab').forEach(tab => {
    if (tab.dataset.cat === 'all') {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Tezkor filtr aktivlarini tozalash
  document.querySelectorAll('.quick-filter-chip').forEach(chip => {
    chip.classList.remove('active');
    if (chip.dataset.filter === 'all') {
      chip.classList.add('active');
    }
  });
  
  updateFilterBadges();
  updateFilterBadgeCount();
  applyAllFilters();
}

/* ═══════════════════════════════════════════
   MODAL FILTR FUNKSIYALARI
   ═══════════════════════════════════════════ */

// Filtr tugmasi faqat home page da ko'rsatish
function updateFilterFabVisibility() {
  const fab = document.getElementById('filterFab');
  const currentPage = document.querySelector('.page.active')?.id;
  if (fab) {
    fab.style.display = currentPage === 'page-home' ? 'flex' : 'none';
  }
}

// Filtr badge sonini yangilash
function updateFilterBadgeCount() {
  let count = 0;
  if (FILTER_STATE.sortBy && FILTER_STATE.sortBy !== 'default') count++;
  if (FILTER_STATE.quickFilter && FILTER_STATE.quickFilter !== 'all') count++;
  if (FILTER_STATE.minPrice || FILTER_STATE.maxPrice) count++;
  if (STATE.currentCat !== 'all') count++;
  
  const badge = document.getElementById('filterBadgeCount');
  const fab = document.getElementById('filterFab');
  
  if (badge && fab) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Filtr modal ochish
function openFilterModal() {
  const modal = document.getElementById('filterModal');
  if (!modal) return;
  
  // Joriy filtr holatini modalga yuklash
  MODAL_FILTERS = {
    sortBy: FILTER_STATE.sortBy || 'default',
    category: STATE.currentCat || 'all',
    quickFilter: FILTER_STATE.quickFilter || 'all',
    minPrice: FILTER_STATE.minPrice || '',
    maxPrice: FILTER_STATE.maxPrice || ''
  };
  
  // Modalga qiymatlarni o'rnatish
  const modalMinPrice = document.getElementById('modalMinPrice');
  const modalMaxPrice = document.getElementById('modalMaxPrice');
  if (modalMinPrice) modalMinPrice.value = MODAL_FILTERS.minPrice;
  if (modalMaxPrice) modalMaxPrice.value = MODAL_FILTERS.maxPrice;
  
  // Saralash radio tugmalari
  document.querySelectorAll('input[name="sortRadio"]').forEach(radio => {
    radio.checked = radio.value === MODAL_FILTERS.sortBy;
  });
  
  // Kategoriyalarni yuklash
  renderCategoryGridModal();
  
  // Tezkor filtr aktivlarini ko'rsatish
  document.querySelectorAll('.quick-filter-chip-modal').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.quick === MODAL_FILTERS.quickFilter);
  });
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Kategoriyalarni modalda ko'rsatish
function renderCategoryGridModal() {
  const container = document.getElementById('catGridModal');
  if (!container) return;
  
  const categories = [
    { id: 'all', name: 'Barchasi', emoji: '📋' },
    { id: 'electronics', name: 'Elektronika', emoji: '📱' },
    { id: 'livestock', name: 'Chorvachilik', emoji: '🐄' },
    { id: 'clothes', name: 'Kiyim', emoji: '👗' },
    { id: 'home', name: 'Uy', emoji: '🏠' },
    { id: 'cars', name: 'Avto', emoji: '🚗' },
    { id: 'food', name: 'Oziq-ovqat', emoji: '🍎' },
    { id: 'other', name: 'Boshqa', emoji: '📦' }
  ];
  
  container.innerHTML = categories.map(cat => `
    <div class="cat-item ${MODAL_FILTERS.category === cat.id ? 'active' : ''}" 
         onclick="selectCategoryModal('${cat.id}')">
      <input type="radio" name="catRadio" value="${cat.id}" 
             ${MODAL_FILTERS.category === cat.id ? 'checked' : ''}>
      <label>${cat.emoji} ${cat.name}</label>
    </div>
  `).join('');
}

// Kategoriya tanlash
function selectCategoryModal(catId) {
  MODAL_FILTERS.category = catId;
  renderCategoryGridModal();
}

// Saralash tanlash
function selectSort(sortValue) {
  MODAL_FILTERS.sortBy = sortValue;
  document.querySelectorAll('input[name="sortRadio"]').forEach(radio => {
    radio.checked = radio.value === sortValue;
  });
}

// Tezkor filtr tanlash
function selectQuickFilterModal(filterValue) {
  MODAL_FILTERS.quickFilter = filterValue;
  document.querySelectorAll('.quick-filter-chip-modal').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.quick === filterValue);
  });
}

// Filtr modaldan qo'llash
function applyFiltersFromModal() {
  // Modal qiymatlarini olish
  const modalMinPrice = document.getElementById('modalMinPrice');
  const modalMaxPrice = document.getElementById('modalMaxPrice');
  
  MODAL_FILTERS.minPrice = modalMinPrice ? modalMinPrice.value : '';
  MODAL_FILTERS.maxPrice = modalMaxPrice ? modalMaxPrice.value : '';
  
  // Global filtr holatini yangilash
  FILTER_STATE.sortBy = MODAL_FILTERS.sortBy;
  FILTER_STATE.quickFilter = MODAL_FILTERS.quickFilter;
  FILTER_STATE.minPrice = MODAL_FILTERS.minPrice;
  FILTER_STATE.maxPrice = MODAL_FILTERS.maxPrice;
  
  // Kategoriyani o'zgartirish
  if (MODAL_FILTERS.category !== STATE.currentCat) {
    const newCat = MODAL_FILTERS.category;
    STATE.currentCat = newCat;
    
    // Kategoriya tablarini yangilash
    document.querySelectorAll('.filter-tab').forEach(tab => {
      if (tab.dataset.cat === newCat) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }
  
  // Filtrlarni qo'llash
  applyAllFilters();
  
  // Badge va tugma sonini yangilash
  updateFilterBadges();
  updateFilterBadgeCount();
  
  // Modalni yopish
  closeFilterModal();
}

// Modaldan reset qilish
function resetFiltersFromModal() {
  MODAL_FILTERS = {
    sortBy: 'default',
    category: 'all',
    quickFilter: 'all',
    minPrice: '',
    maxPrice: ''
  };
  
  const modalMinPrice = document.getElementById('modalMinPrice');
  const modalMaxPrice = document.getElementById('modalMaxPrice');
  if (modalMinPrice) modalMinPrice.value = '';
  if (modalMaxPrice) modalMaxPrice.value = '';
  
  document.querySelectorAll('input[name="sortRadio"]').forEach(radio => {
    radio.checked = radio.value === 'default';
  });
  
  renderCategoryGridModal();
  
  document.querySelectorAll('.quick-filter-chip-modal').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.quick === 'all');
  });
}

// Modalni yopish
function closeFilterModal() {
  const modal = document.getElementById('filterModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Overlay bosganda yopish
function closeFilterModalOnOverlay(event) {
  if (event.target === document.getElementById('filterModal')) {
    closeFilterModal();
  }
}

/* ═══════════════════════════════════════════
   MAHSULOT DETAIL (TELEFON RAQAM FORMATI TUZATILGAN)
   ═══════════════════════════════════════════ */

// Telefon raqamni formatlash (tel: uchun + qo'shish)
function formatPhoneForTel(phone) {
  if (!phone) return '';
  // Raqamdan barcha bo'shliqlar va tirelarni olib tashlash
  let cleanPhone = phone.replace(/[\s\-]/g, '');
  // Faqat raqamlarni olish
  const digits = cleanPhone.replace(/[^0-9]/g, '');
  // Agar raqam 998 bilan boshlansa, + qo'shish
  if (digits.startsWith('998')) {
    return '+' + digits;
  }
  // Agar raqam + bilan boshlanmasa va 998 bilan boshlansa
  if (!cleanPhone.startsWith('+') && cleanPhone.match(/^998\d{9}$/)) {
    return '+' + digits;
  }
  return cleanPhone;
}

async function openDetail(id) {
  const p = STATE.products.find(x => x.id === id);
  if (!p) return;

  STATE.prevPage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'home';
  navigate('detail', false);

  let sellerProfile = null;
  try {
    const sd = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(p.user_id)}&sheet=${CFG.SHEET_PROFILES}`);
    if (Array.isArray(sd) && sd.length > 0) sellerProfile = sd[0];
  } catch(e) {}

  const daysLeft = getDaysLeft(p.created_at);
  const imgHTML  = p.img_url ? `<img class="detail-img" src="${esc(p.img_url)}" alt="${esc(p.title)}">` : '';
  const saleBadge = p.for_sale === 'true'
    ? `<span class="badge badge-sale">✅ Sotuvda</span>`
    : `<span class="badge badge-sold">❌ Sotilgan</span>`;

  const sellerName = sellerProfile
    ? [sellerProfile.ism, sellerProfile.familya].filter(Boolean).join(' ') || 'Sotuvchi'
    : p.user_id || 'Sotuvchi';
  const sellerEmoji = sellerProfile?.emoji || '👤';
  const sellerCity  = sellerProfile?.shahar || '';

  const myUid = String(STATE.tgUser?.id || '');
  const isOwner = p.user_id === myUid;
  
  // Telefon raqamni formatlash (tel: uchun + qo'shilgan)
  const formattedPhone = formatPhoneForTel(p.phone || '');
  
  const phoneHTML = isOwner && p.phone
    ? `<div class="seller-phone">📞 ${esc(p.phone)}</div>` : '';

  const contactBtns = isOwner
    ? `<p style="color:var(--tg-hint);font-size:0.9rem;text-align:center">Bu sizning mahsulotingiz</p>`
    : `
      <a href="tel:${formattedPhone}" class="btn-green">📞 Telefon qilish</a>
      <a href="https://t.me/${esc(sellerProfile?.username || '')}" target="_blank" class="btn-tg" id="tgChatBtn" style="display:none">💬 Telegram orqali yozish</a>
    `;

  const detailContent = document.getElementById('detailContent');
  if (detailContent) {
    detailContent.innerHTML = `
      ${imgHTML}
      <div class="detail-card">
        <div class="detail-title">${esc(p.title)}</div>
        <div class="detail-price">${fmtPrice(p.price)} so'm</div>
        <div class="detail-badges">
          <span class="badge badge-cat">${CAT_LABELS[p.category] || p.category || '📦'}</span>
          <span class="badge badge-loc">📍 ${esc(p.location || '')}</span>
          ${saleBadge}
        </div>
        <div class="detail-desc-title">Tavsif</div>
        <div class="detail-desc">${esc(p.description || 'Tavsif yo\'q')}</div>
        <div class="detail-meta">🕒 ${daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Muddati o\'tgan'} · ${fmtDate(p.created_at)}</div>
      </div>
      <div class="contact-card">
        <h3>Sotuvchi</h3>
        <div class="seller-info">
          <div class="seller-avatar">${sellerEmoji}</div>
          <div>
            <div class="seller-name">${esc(sellerName)}</div>
            ${sellerCity ? `<div class="seller-city">📍 ${esc(sellerCity)}</div>` : ''}
            ${phoneHTML}
          </div>
        </div>
        <div class="contact-buttons">${contactBtns}</div>
      </div>
    `;
  }

  if (!isOwner && sellerProfile?.username) {
    const tgBtn = document.getElementById('tgChatBtn');
    if (tgBtn) {
      tgBtn.style.display = 'flex';
      tgBtn.href = `https://t.me/${sellerProfile.username}`;
    }
  }
}

/* ═══════════════════════════════════════════
   MAHSULOT QO'SHISH
   ═══════════════════════════════════════════ */
function removeProductImage() {
  const imgInput = document.getElementById('prodImgInput');
  const imgPreview = document.getElementById('prodImgPreview');
  const previewWrap = document.getElementById('imgPreviewWrap');
  const uploadZone = document.getElementById('uploadZone');
  
  if (imgInput) imgInput.value = '';
  if (imgPreview) imgPreview.src = '';
  if (previewWrap) previewWrap.classList.add('hidden');
  if (uploadZone) uploadZone.style.display = '';
}

async function addProduct() {
  const title    = document.getElementById('prodTitle')?.value.trim() || '';
  const price    = document.getElementById('prodPrice')?.value.trim() || '';
  const category = document.getElementById('prodCategory')?.value || '';
  const location = document.getElementById('prodLocation')?.value.trim() || '';
  const desc     = document.getElementById('prodDesc')?.value.trim() || '';
  const phone    = document.getElementById('prodPhone')?.value.trim() || '';
  const forSale  = document.getElementById('prodForSale')?.checked || false;
  const file     = document.getElementById('prodImgInput')?.files[0];

  if (!title)    { showMsg('addStatus', '❗ Mahsulot nomini kiriting', 'error'); return; }
  if (!price)    { showMsg('addStatus', '❗ Narxni kiriting', 'error'); return; }
  if (!category) { showMsg('addStatus', '❗ Kategoriyani tanlang', 'error'); return; }
  if (!location) { showMsg('addStatus', '❗ Joylashuvni kiriting', 'error'); return; }
  if (!desc)     { showMsg('addStatus', '❗ Tavsif kiriting', 'error'); return; }
  if (!phone)    { showMsg('addStatus', '❗ Telefon raqam kiriting', 'error'); return; }
  if (!file)     { showMsg('addStatus', '❗ Rasm tanlang', 'error'); return; }

  const btn = document.getElementById('addProductBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Rasm yuklanmoqda...';
  }

  try {
    const base64 = await fileToBase64(file);
    const fd = new FormData();
    fd.append('key', CFG.IMGBB_KEY);
    fd.append('image', base64);

    const imgRes  = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd });
    if (!imgRes.ok) throw new Error('ImgBB HTTP ' + imgRes.status);
    const imgData = await imgRes.json();
    if (!imgData.success) throw new Error('ImgBB: ' + (imgData.error?.message || 'Xato'));
    const imgUrl = imgData.data.url;

    if (btn) btn.textContent = 'Saqlanmoqda...';
    const uid = String(STATE.tgUser.id);
    const prodId = `P${Date.now()}`;

    await apiPost(`${CFG.SHEETDB}?sheet=${CFG.SHEET_PRODUCTS}`, {
      data: [{
        id:          prodId,
        user_id:     uid,
        title,
        price,
        category,
        location,
        description: desc,
        phone,
        img_url:     imgUrl,
        for_sale:    String(forSale),
        created_at:  new Date().toISOString()
      }]
    });

    ['prodTitle','prodPrice','prodLocation','prodDesc','prodPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const catSelect = document.getElementById('prodCategory');
    if (catSelect) catSelect.value = '';
    const forSaleCheck = document.getElementById('prodForSale');
    if (forSaleCheck) forSaleCheck.checked = true;
    removeProductImage();

    showMsg('addStatus', '✅ Mahsulot muvaffaqiyatli joylashtirildi!', 'success');
    await loadProducts();
    setTimeout(() => navigate('home'), 1500);

  } catch(e) {
    showMsg('addStatus', '❌ ' + e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Mahsulot joylash 🚀';
    }
  }
}

/* ═══════════════════════════════════════════
   MENING MAHSULOTLARIM
   ═══════════════════════════════════════════ */
function renderMyProducts() {
  const uid = String(STATE.tgUser?.id || '');
  const mine = STATE.products.filter(p => p.user_id === uid);
  const grid = document.getElementById('myProductGrid');

  if (!mine.length) {
    if (grid) grid.innerHTML = '<div class="empty-my">Hali mahsulot yo\'q</div>';
    return;
  }

  if (grid) {
    grid.innerHTML = mine.map(p => {
      const daysLeft = getDaysLeft(p.created_at);
      const imgHTML  = p.img_url
        ? `<img class="card-img" src="${esc(p.img_url)}" alt="" loading="lazy">`
        : `<div class="card-img-placeholder" style="aspect-ratio:4/3">${getCatEmoji(p.category)}</div>`;
      return `
        <div class="my-prod-card" onclick="openDetail('${esc(p.id)}')">
          ${imgHTML}
          <span class="my-prod-days">${daysLeft > 0 ? `${daysLeft}k` : '❌'}</span>
          <button class="delete-prod-btn" onclick="event.stopPropagation(); deleteMyProduct('${esc(p.id)}')">🗑</button>
          <div class="card-body" style="padding:7px 8px">
            <div class="card-title" style="font-size:0.8rem">${esc(p.title)}</div>
            <div class="card-price" style="font-size:0.88rem">${fmtPrice(p.price)}</div>
          </div>
        </div>`;
    }).join('');
  }
}

async function deleteMyProduct(id) {
  const ok = confirm('Bu mahsulotni o\'chirishni tasdiqlaysizmi?');
  if (!ok) return;
  try {
    await fetch(`${CFG.SHEETDB}/id/${encodeURIComponent(id)}?sheet=${CFG.SHEET_PRODUCTS}`, { method: 'DELETE' });
    await loadProducts();
    renderMyProducts();
  } catch(e) {
    alert('O\'chirishda xatolik: ' + e.message);
  }
}

/* ═══════════════════════════════════════════
   YORDAMCHI FUNKSIYALAR
   ═══════════════════════════════════════════ */
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

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = () => res(reader.result.split(',')[1]);
    reader.onerror = () => rej(new Error('Faylni o\'qib bo\'lmadi'));
    reader.readAsDataURL(file);
  });
}

function fmtPrice(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return val || '—';
  return n.toLocaleString('uz-UZ');
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', { day:'2-digit', month:'2-digit', year:'numeric' });
  } catch(e) { return iso; }
}

function getDaysLeft(createdAt) {
  if (!createdAt) return CFG.EXPIRE_DAYS;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return CFG.EXPIRE_DAYS;
  const elapsed = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(CFG.EXPIRE_DAYS - elapsed));
}

function getCatEmoji(cat) {
  const map = { electronics:'📱', livestock:'🐄', clothes:'👗', home:'🏠', cars:'🚗', food:'🍎', other:'📦' };
  return map[cat] || '📦';
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showMsg(elId, msg, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
