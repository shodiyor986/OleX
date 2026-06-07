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
  selectedEmoji: '😊'
};

window.addEventListener('DOMContentLoaded', async () => {
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      document.getElementById('searchBar').classList.toggle('hidden');
    });
  }

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

  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  await new Promise(r => setTimeout(r, 1900));
  document.getElementById('splash').classList.add('fade-out');
  setTimeout(() => document.getElementById('splash').classList.add('hidden'), 500);

  const tgUser = tg?.initDataUnsafe?.user || null;
  STATE.tgUser = tgUser || { id: 'demo_001', username: 'demo_user', first_name: 'Demo', last_name: 'User' };

  await ensureSheetStructure();

  if (STATE.tgUser.username) {
    document.getElementById('app').classList.remove('hidden');
    buildEmojiGrid();
    await loadProfile();
    await loadProducts();
  } else {
    document.getElementById('noUsernameScreen').classList.remove('hidden');
  }
});

async function ensureSheetStructure() {
  try {
    const headers = ['id', 'user_id', 'title', 'price', 'category', 'location', 'description', 'phone', 'img_url', 'for_sale', 'created_at'];
    await fetch(`${CFG.SHEETDB}/headers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headers, sheet: 'Mahsulotlar' }) }).catch(() => {});
    
    const profileHeaders = ['user_id', 'username', 'ism', 'familya', 'telefon', 'shahar', 'emoji', 'updated_at'];
    await fetch(`${CFG.SHEETDB}/headers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ headers: profileHeaders, sheet: 'Profillar' }) }).catch(() => {});
  } catch(e) { console.warn(e); }
}

function navigate(pageName) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${pageName}`);
    p.classList.toggle('hidden', p.id !== `page-${pageName}`);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
  if (pageName === 'profile') {
    renderProfile();
    renderMyProducts();
  }
}

function navigateToAdd() {
  if (!STATE.tgUser?.username) {
    alert('Mahsulot qo\'shish uchun Telegram username kerak!');
    return;
  }
  navigate('add');
}

function goBack() { navigate('home'); }

async function loadProfile() {
  const uid = String(STATE.tgUser.id);
  try {
    const data = await apiGet(`${CFG.SHEETDB}/search?user_id=${encodeURIComponent(uid)}&sheet=Profillar`);
    if (data && data.length > 0) {
      STATE.profile = data[0];
      STATE.selectedEmoji = data[0].emoji || '😊';
    } else {
      STATE.profile = { user_id: uid, username: STATE.tgUser.username || '', ism: '', familya: '', telefon: '', shahar: '', emoji: '😊' };
    }
  } catch(e) {
    STATE.profile = { user_id: uid, username: STATE.tgUser.username || '', ism: '', familya: '', telefon: '', shahar: '', emoji: '😊' };
  }
}

function renderProfile() {
  if (!STATE.profile) return;
  document.getElementById('profileAvatar').textContent = STATE.profile.emoji || '😊';
  document.getElementById('profileName').textContent = [STATE.profile.ism, STATE.profile.familya].filter(B
