/* ============================================================
   BozorUZ — bek.js
   Telegram Mini App · OLX klon
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
  livestock:   '🐄 chorvachilik',
  clothes:     '👗 Kiyim',
  home:        '🏠 Uy jihozlari',
  cars:        '🚗 Avto',
  food:        '🍎 Oziq-ovqat',
  other:       '📦 Boshqa',
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

/* ═══════════════════════════════════════════
   ISHGA TUSHURISH
   ═══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  // ✅ FIX: searchToggleBtn listener shu yerda bo'lishi kerak
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

  // Telegram SDK
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    document.documentElement.style.setProperty('--tg-bg', tg.themeParams?.bg_color || '#f0f4f8');
  }

  // Splash animatsiyasi
  await new Promise(r => setTimeout(r, 1900));

  // Telegram foydalanuvchisini olish
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
  document.getElementById('productGrid').innerHTML =
    '<div class="loading-state"><div class="spinner"></div><p>Yuklanmoqda...</p></div>';
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
    document.getElementById('productGrid').innerHTML =
      '<div class="empty-state-full"><span class="big-emoji">⚠️</span><p>Yuklab bo\'lmadi. Qayta urinib ko\'ring.</p></div>';
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
  applyFilters();
}

function filterProducts() {
  applyFilters();
}

function applyFilters() {
  const q   = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat = STATE.currentCat;

  STATE.filtered = STATE.products.filter(p => {
    const matchCat  = cat === 'all' || p.category === cat;
    const matchQ    = !q || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  renderProducts(STATE.filtered);
}

/* ═══════════════════════════════════════════
   MAHSULOT DETAIL
   ═══════════════════════════════════════════ */
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
  const phoneHTML = isOwner && p.phone
    ? `<div class="seller-phone">📞 ${esc(p.phone)}</div>` : '';

  const contactBtns = isOwner
    ? `<p style="color:var(--tg-hint);font-size:0.9rem;text-align:center">Bu sizning mahsulotingiz</p>`
    : `
      <a href="tel:${esc(p.phone || '')}" class="btn-green">📞 Telefon qilish</a>
      <a href="https://t.me/${esc(sellerProfile?.username || '')}" target="_blank" class="btn-tg" id="tgChatBtn" style="display:none">💬 Telegram orqali yozish</a>
    `;

  document.getElementById('detailContent').innerHTML = `
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
  document.getElementById('prodImgInput').value = '';
  document.getElementById('prodImgPreview').src = '';
  document.getElementById('imgPreviewWrap').classList.add('hidden');
  document.getElementById('uploadZone').style.display = '';
}

async function addProduct() {
  const title    = document.getElementById('prodTitle').value.trim();
  const price    = document.getElementById('prodPrice').value.trim();
  const category = document.getElementById('prodCategory').value;
  const location = document.getElementById('prodLocation').value.trim();
  const desc     = document.getElementById('prodDesc').value.trim();
  const phone    = document.getElementById('prodPhone').value.trim();
  const forSale  = document.getElementById('prodForSale').checked;
  const file     = document.getElementById('prodImgInput').files[0];

  if (!title)    { showMsg('addStatus', '❗ Mahsulot nomini kiriting', 'error'); return; }
  if (!price)    { showMsg('addStatus', '❗ Narxni kiriting', 'error'); return; }
  if (!category) { showMsg('addStatus', '❗ Kategoriyani tanlang', 'error'); return; }
  if (!location) { showMsg('addStatus', '❗ Joylashuvni kiriting', 'error'); return; }
  if (!desc)     { showMsg('addStatus', '❗ Tavsif kiriting', 'error'); return; }
  if (!phone)    { showMsg('addStatus', '❗ Telefon raqam kiriting', 'error'); return; }
  if (!file)     { showMsg('addStatus', '❗ Rasm tanlang', 'error'); return; }

  const btn = document.getElementById('addProductBtn');
  btn.disabled = true;
  btn.textContent = 'Rasm yuklanmoqda...';

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

    btn.textContent = 'Saqlanmoqda...';
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
      document.getElementById(id).value = '';
    });
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodForSale').checked = true;
    removeProductImage();

    showMsg('addStatus', '✅ Mahsulot muvaffaqiyatli joylashtirildi!', 'success');
    await loadProducts();
    setTimeout(() => navigate('home'), 1500);

  } catch(e) {
    showMsg('addStatus', '❌ ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Mahsulot joylash 🚀';
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
    grid.innerHTML = '<div class="empty-my">Hali mahsulot yo\'q</div>';
    return;
  }

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
  const map = { electronics:'📱', clothes:'👗', home:'🏠', cars:'🚗', food:'🍎', other:'📦' };
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
