// ============================================
// OLEX MARKET - FRONTEND
// Google Apps Script API bilan ishlaydi
// ============================================

// ============================================
// KONFIGURATSIYA (O'Z URL INGIZNI QO'YING)
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxwIp99MgNyJN65DpFhSCrhLtRuM0X0TOvPqbkM8yBWdFGIm6mDmnQhp59gkWBrYv88/exec';

// Telegram WebApp
const tg = window.Telegram.WebApp;
let currentUser = null;
let allProducts = [];
let chatMessages = [];
let currentFilter = 'all';
let searchQuery = '';

// ============================================
// TELEGRAM AUTHENTIFICATION
// ============================================
async function initTelegramAuth() {
  try {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    
    const user = tg.initDataUnsafe?.user;
    
    if (!user || !user.id) {
      throw new Error('Telegram foydalanuvchisi topilmadi');
    }
    
    currentUser = {
      id: String(user.id),
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User_${user.id}`,
      loginTime: new Date().toISOString()
    };
    
    // UI yangilash
    const userNameEl = document.getElementById('userName');
    const userAvatarEl = document.getElementById('userAvatar');
    const profileNameEl = document.getElementById('profileName');
    const profileAvatarEl = document.getElementById('profileAvatar');
    const profileUsernameEl = document.getElementById('profileUsername');
    const tgIdEl = document.getElementById('tgId');
    const tgUsernameEl = document.getElementById('tgUsername');
    
    if (userNameEl) userNameEl.textContent = currentUser.displayName;
    if (userAvatarEl) userAvatarEl.textContent = currentUser.displayName.charAt(0).toUpperCase();
    if (profileNameEl) profileNameEl.textContent = currentUser.displayName;
    if (profileAvatarEl) profileAvatarEl.textContent = currentUser.displayName.charAt(0).toUpperCase();
    if (profileUsernameEl) profileUsernameEl.textContent = currentUser.username ? `@${currentUser.username}` : 'username yo\'q';
    if (tgIdEl) tgIdEl.textContent = currentUser.id;
    if (tgUsernameEl) tgUsernameEl.textContent = currentUser.username || '-';
    
    // Splash screen ni yashirish
    setTimeout(() => {
      const splash = document.getElementById('splashScreen');
      const app = document.getElementById('appContainer');
      if (splash) splash.style.display = 'none';
      if (app) app.style.display = 'block';
    }, 1500);
    
    return true;
  } catch (error) {
    console.error('Auth xatosi:', error);
    showToast('❌ Autentifikatsiya xatosi!', 'error');
    return false;
  }
}

// ============================================
// MAHSULOTLARNI YUKLASH
// ============================================
async function loadProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Mahsulotlar yuklanmoqda...</p></div>';
  
  try {
    const url = `${API_URL}?action=getProducts&t=${Date.now()}`;
    console.log('So\'rov yuborilmoqda:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('Javob status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Olingan ma\'lumot:', data);
    
    if (data.success) {
      allProducts = data.products || [];
      renderProducts(allProducts);
      loadMyProducts();
      showToast(`✅ ${allProducts.length} ta mahsulot yuklandi`, 'success');
    } else {
      throw new Error(data.error || 'Ma\'lumot olishda xatolik');
    }
  } catch (error) {
    console.error('Yuklash xatosi:', error);
    showToast('❌ ' + error.message, 'error');
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Ulanishda xatolik</p>
        <p style="font-size:12px;margin-top:8px;">${error.message}</p>
        <p style="font-size:11px;margin-top:8px;color:var(--text-tertiary);">
          API URL: ${API_URL.substring(0, 50)}...
        </p>
        <button onclick="loadProducts()" style="margin-top:16px;padding:8px 20px;background:var(--accent);border:none;border-radius:20px;color:white;cursor:pointer;">
          🔄 Qayta urinish
        </button>
      </div>
    `;
  }
}

// ============================================
// MAHSULOTLARNI KO'RSATISH
// ============================================
function renderProducts(products) {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  let filtered = products.filter(p => p.status !== 'deleted');
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(p => p.category === currentFilter);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>Mahsulot topilmadi</p></div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="product-grid">
      ${filtered.map(product => `
        <div class="product-card" onclick="showProductDetail(${product.id})">
          <div class="product-image">
            ${product.imageUrl ? `<img src="${product.imageUrl}" style="width:100%;height:100%;object-fit:cover;">` : getCategoryIcon(product.category)}
          </div>
          <div class="product-info">
            <div class="product-category">${escapeHtml(product.category)}</div>
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-desc">${escapeHtml(product.description)}</div>
            <div class="product-price">${formatPrice(product.price)} so'm</div>
            <div class="product-contact">📞 ${escapeHtml(product.contact)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================
// YANGI MAHSULOT QO'SHISH
// ============================================
async function addProduct() {
  if (!currentUser) {
    showToast('❌ Iltimos, qaytadan kiring!', 'error');
    return;
  }
  
  const name = document.getElementById('productName')?.value.trim();
  const desc = document.getElementById('productDesc')?.value.trim();
  const price = document.getElementById('productPrice')?.value;
  const category = document.getElementById('productCategory')?.value;
  const contact = document.getElementById('productContact')?.value.trim();
  const imageFile = document.getElementById('productImage')?.files[0];
  
  if (!name || !desc || !price || !contact) {
    showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'warning');
    return;
  }
  
  const btn = document.getElementById('addProductBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Yuklanmoqda...';
  }
  
  try {
    let imageUrl = '';
    
    if (imageFile) {
      imageUrl = await uploadImageToDrive(imageFile);
    }
    
    const formData = new URLSearchParams();
    formData.append('action', 'addProduct');
    formData.append('name', name);
    formData.append('description', desc);
    formData.append('price', parseFloat(price));
    formData.append('category', category);
    formData.append('contact', contact);
    formData.append('userId', currentUser.id);
    formData.append('imageUrl', imageUrl);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('✅ Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
      if (document.getElementById('productName')) document.getElementById('productName').value = '';
      if (document.getElementById('productDesc')) document.getElementById('productDesc').value = '';
      if (document.getElementById('productPrice')) document.getElementById('productPrice').value = '';
      if (document.getElementById('productContact')) document.getElementById('productContact').value = '';
      if (document.getElementById('productImage')) document.getElementById('productImage').value = '';
      await loadProducts();
      
      const homeTabBtn = document.querySelector('.tab-btn[data-tab="home"]');
      if (homeTabBtn) homeTabBtn.click();
    } else {
      throw new Error(data.error || 'Qo\'shishda xatolik');
    }
  } catch (error) {
    console.error('Xatolik:', error);
    showToast('❌ ' + error.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '✅ E\'lonni joylash';
    }
  }
}

async function uploadImageToDrive(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target.result.split(',')[1];
        const formData = new URLSearchParams();
        formData.append('action', 'uploadImage');
        formData.append('image', base64);
        formData.append('fileName', file.name);
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
        
        const data = await response.json();
        if (data.success) {
          resolve(data.url);
        } else {
          reject(new Error(data.error));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================
// MAHSULOT DETAIL
// ============================================
function showProductDetail(productId) {
  const product = allProducts.find(p => p.id == productId);
  if (!product) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${escapeHtml(product.name)}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:16px;">
          ${product.imageUrl ? `<img src="${product.imageUrl}" style="width:200px;height:200px;object-fit:cover;border-radius:16px;">` : `<div style="font-size:64px;">${getCategoryIcon(product.category)}</div>`}
        </div>
        <div class="info-row"><span class="info-label">📌 Kategoriya</span><span class="info-value">${escapeHtml(product.category)}</span></div>
        <div class="info-row"><span class="info-label">💰 Narxi</span><span class="info-value" style="color:var(--success);font-weight:bold;">${formatPrice(product.price)} so'm</span></div>
        <div class="info-row"><span class="info-label">📖 Tavsif</span><span class="info-value">${escapeHtml(product.description)}</span></div>
        <div class="info-row"><span class="info-label">📞 Aloqa</span><span class="info-value">${escapeHtml(product.contact)}</span></div>
        <button onclick="window.location.href='tel:${product.contact.replace(/[^0-9+]/g, '')}'" style="width:100%;padding:12px;background:var(--success);color:white;border:none;border-radius:12px;margin-top:16px;cursor:pointer;">
          📞 Bog'lanish
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ============================================
// Mening e'lonlarim
// ============================================
function loadMyProducts() {
  const myProducts = allProducts.filter(p => p.userId === currentUser?.id && p.status !== 'deleted');
  const container = document.getElementById('myProductsList');
  if (!container) return;
  
  if (myProducts.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>Sizning e'lonlaringiz yo'q</p></div>`;
    return;
  }
  
  container.innerHTML = myProducts.map(p => `
    <div class="my-product-item">
      <div class="my-product-icon">${p.imageUrl ? '🖼️' : getCategoryIcon(p.category)}</div>
      <div class="my-product-info">
        <div class="my-product-name">${escapeHtml(p.name)}</div>
        <div class="my-product-price">${formatPrice(p.price)} so'm</div>
      </div>
      <button class="delete-product-btn" onclick="deleteMyProduct(${p.id})">🗑️</button>
    </div>
  `).join('');
}

async function deleteMyProduct(rowIndex) {
  if (!confirm('E\'lonni o\'chirmoqchimisiz?')) return;
  
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'deleteProduct');
    formData.append('rowIndex', rowIndex);
    formData.append('userId', currentUser.id);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('✅ E\'lon o\'chirildi', 'success');
      await loadProducts();
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
}

// ============================================
// CHAT FUNKSIYALARI
// ============================================
async function loadChat() {
  try {
    const url = `${API_URL}?action=getMessages&t=${Date.now()}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      chatMessages = data.messages || [];
      renderChat();
    }
  } catch (error) {
    console.error('Chat yuklash xatosi:', error);
  }
}

function renderChat() {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  
  if (chatMessages.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Hozircha xabarlar yo\'q</p></div>';
    return;
  }
  
  container.innerHTML = chatMessages.map(msg => {
    const isSent = currentUser && msg.userId === currentUser.id;
    return `
      <div class="message ${isSent ? 'sent' : 'received'}">
        ${!isSent ? `<div class="message-sender">${escapeHtml(msg.senderName)}</div>` : ''}
        <div class="message-bubble">${escapeHtml(msg.text)}</div>
        <div class="message-time">${msg.time || new Date(msg.date).toLocaleTimeString()}</div>
      </div>
    `;
  }).join('');
  
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input?.value.trim();
  
  if (!text || !currentUser) return;
  
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'sendMessage');
    formData.append('userId', currentUser.id);
    formData.append('senderName', currentUser.displayName);
    formData.append('text', text);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (input) input.value = '';
      await loadChat();
    }
  } catch (error) {
    console.error('Xabar yuborish xatosi:', error);
    showToast('❌ Xabar yuborilmadi', 'error');
  }
}

// ============================================
// PROFIL MA'LUMOTLARINI SAQLASH
// ============================================
async function saveProfile() {
  const fullName = document.getElementById('fullName')?.value.trim();
  const phone = document.getElementById('phoneNumber')?.value.trim();
  
  try {
    const formData = new URLSearchParams();
    formData.append('action', 'saveProfile');
    formData.append('userId', currentUser.id);
    formData.append('fullName', fullName || '');
    formData.append('phone', phone || '');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('✅ Profil saqlandi!', 'success');
      if (fullName) {
        currentUser.displayName = fullName;
        const userNameEl = document.getElementById('userName');
        const profileNameEl = document.getElementById('profileName');
        if (userNameEl) userNameEl.textContent = fullName;
        if (profileNameEl) profileNameEl.textContent = fullName;
      }
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    showToast('❌ ' + error.message, 'error');
  }
}

// ============================================
// YORDAMCHI FUNKSIYALAR
// ============================================
function getCategoryIcon(category) {
  const icons = {
    'elektronika': '📱',
    'kiyim-kechak': '👕',
    'uy-joy': '🏠',
    'transport': '🚗',
    'boshqa': '📦'
  };
  return icons[category] || '📦';
}

function formatPrice(price) {
  return new Intl.NumberFormat('uz-UZ').format(price);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInToast 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// EVENT LISTENERLAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  await initTelegramAuth();
  await loadProducts();
  await loadChat();
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tabContent = document.getElementById(`${tabId}Tab`);
      if (tabContent) tabContent.classList.add('active');
      
      if (tabId === 'chat') loadChat();
    });
  });
  
  // Category filter
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderProducts(allProducts);
    });
  });
  
  // Search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderProducts(allProducts);
    });
  }
  
  // Add product
  const addBtn = document.getElementById('addProductBtn');
  if (addBtn) addBtn.addEventListener('click', addProduct);
  
  // Save profile
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveProfile);
  
  // Chat
  const sendBtn = document.getElementById('sendChatBtn');
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
  
  // Har 5 sekundda chatni yangilash
  setInterval(() => {
    const chatTab = document.querySelector('.tab-btn[data-tab="chat"]');
    if (chatTab && chatTab.classList.contains('active')) {
      loadChat();
    }
  }, 5000);
});
