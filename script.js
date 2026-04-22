// ============================================
// OLEX MARKET - TO'LIQ FRONTEND (DIAGNOSTIKA BILAN)
// ============================================

const API_URL = 'https://script.google.com/macros/s/AKfycbz70foBkgKEFDmWdH_VSv-115jeuT9euIFs093owFYofSObtw8zE1Tbvj-ff-Nj58b0yQ/exec';

const tg = window.Telegram.WebApp;
let currentUser = null;
let allProducts = [];
let chatMessages = [];
let currentFilter = 'all';
let searchQuery = '';

// ============================================
// TELEGRAM AUTH
// ============================================
async function initTelegramAuth() {
    try {
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (!user || !user.id) {
            currentUser = { id: 'test_' + Date.now(), firstName: 'Test', lastName: 'User', username: 'test_user', displayName: 'Test User' };
        } else {
            currentUser = {
                id: String(user.id),
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                username: user.username || '',
                displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User_${user.id}`
            };
        }
        updateUI();
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
        }, 1500);
        return true;
    } catch(e) { console.error(e); return false; }
}

function updateUI() {
    const elements = {
        userName: document.getElementById('userName'),
        userAvatar: document.getElementById('userAvatar'),
        profileName: document.getElementById('profileName'),
        profileAvatar: document.getElementById('profileAvatar'),
        profileUsername: document.getElementById('profileUsername'),
        tgId: document.getElementById('tgId'),
        tgUsername: document.getElementById('tgUsername'),
        loginDate: document.getElementById('loginDate')
    };
    if (elements.userName) elements.userName.textContent = currentUser.displayName;
    if (elements.userAvatar) elements.userAvatar.textContent = currentUser.displayName.charAt(0).toUpperCase();
    if (elements.profileName) elements.profileName.textContent = currentUser.displayName;
    if (elements.profileAvatar) elements.profileAvatar.textContent = currentUser.displayName.charAt(0).toUpperCase();
    if (elements.profileUsername) elements.profileUsername.textContent = currentUser.username ? `@${currentUser.username}` : 'username yo\'q';
    if (elements.tgId) elements.tgId.textContent = currentUser.id;
    if (elements.tgUsername) elements.tgUsername.textContent = currentUser.username || '-';
    if (elements.loginDate) elements.loginDate.textContent = new Date().toLocaleString('uz-UZ');
    
    const savedProfile = localStorage.getItem(`olex_profile_${currentUser.id}`);
    if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (document.getElementById('fullName')) document.getElementById('fullName').value = profile.fullName || '';
        if (document.getElementById('phoneNumber')) document.getElementById('phoneNumber').value = profile.phone || '';
    }
}

// ============================================
// MAHSULOTLAR
// ============================================
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Mahsulotlar yuklanmoqda...</p></div>';
    try {
        const response = await fetch(`${API_URL}?action=getProducts&t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.success) {
            allProducts = data.products || [];
            renderProducts(allProducts);
            loadMyProducts();
            showToast(`✅ ${allProducts.length} ta mahsulot yuklandi`, 'success');
        } else {
            throw new Error(data.error);
        }
    } catch(e) {
        showToast('❌ ' + e.message, 'error');
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Xatolik: ${e.message}</p><button onclick="loadProducts()">🔄 Qayta urinish</button></div>`;
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    let filtered = products.filter(p => p.status !== 'deleted');
    if (currentFilter !== 'all') filtered = filtered.filter(p => p.category === currentFilter);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (!filtered.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Mahsulot topilmadi</p></div>';
        return;
    }
    container.innerHTML = `<div class="product-grid">${filtered.map(p => `
        <div class="product-card" onclick="showProductDetail(${p.id})">
            <div class="product-image">${p.imageUrl ? `<img src="${p.imageUrl}">` : getCategoryIcon(p.category)}</div>
            <div class="product-info">
                <div class="product-category">${escapeHtml(p.category)}</div>
                <div class="product-name">${escapeHtml(p.name)}</div>
                <div class="product-desc">${escapeHtml(p.description)}</div>
                <div class="product-price">${formatPrice(p.price)} so'm</div>
                <div class="product-contact">📞 ${escapeHtml(p.contact)}</div>
            </div>
        </div>
    `).join('')}</div>`;
}

// ============================================
// YANGI MAHSULOT QO'SHISH (ASOSIY TUZATILGAN FUNKSIYA)
// ============================================
async function addProduct() {
    if (!currentUser) { showToast('❌ Iltimos, qaytadan kiring!', 'error'); return; }
    
    const name = document.getElementById('productName')?.value.trim();
    const desc = document.getElementById('productDesc')?.value.trim();
    const price = document.getElementById('productPrice')?.value;
    const category = document.getElementById('productCategory')?.value;
    const contact = document.getElementById('productContact')?.value.trim();
    
    if (!name || !desc || !price || !contact) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'warning');
        return;
    }
    
    const btn = document.getElementById('addProductBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Yuklanmoqda...'; }
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'addProduct');
        formData.append('name', name);
        formData.append('description', desc);
        formData.append('price', parseFloat(price));
        formData.append('category', category);
        formData.append('contact', contact);
        formData.append('userId', currentUser.id);
        
        console.log('📤 Yuborilayotgan ma\'lumot:', Object.fromEntries(formData));
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        const data = await response.json();
        console.log('📥 Server javobi:', data);
        
        if (data.success) {
            showToast('✅ Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
            // Formani tozalash
            document.getElementById('productName').value = '';
            document.getElementById('productDesc').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productContact').value = '';
            document.getElementById('productImage').value = '';
            // Mahsulotlarni qayta yuklash
            await loadProducts();
            // Home tabga o'tish
            document.querySelector('.tab-btn[data-tab="home"]').click();
        } else {
            throw new Error(data.error || 'Qo\'shishda xatolik');
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✅ E\'lonni joylash'; }
    }
}

// ============================================
// BOSHQA FUNKSIYALAR (CHAT, PROFIL, VA HOKAZO)
// ============================================
function showProductDetail(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3>${escapeHtml(product.name)}</h3><button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button></div>
            <div class="modal-body">
                <div style="text-align:center">${product.imageUrl ? `<img src="${product.imageUrl}" style="width:200px;height:200px;object-fit:cover;border-radius:16px;">` : `<div style="font-size:64px;">${getCategoryIcon(product.category)}</div>`}</div>
                <div class="info-row"><span class="info-label">📌 Kategoriya</span><span class="info-value">${escapeHtml(product.category)}</span></div>
                <div class="info-row"><span class="info-label">💰 Narxi</span><span class="info-value" style="color:var(--success);font-weight:bold;">${formatPrice(product.price)} so'm</span></div>
                <div class="info-row"><span class="info-label">📖 Tavsif</span><span class="info-value">${escapeHtml(product.description)}</span></div>
                <div class="info-row"><span class="info-label">📞 Aloqa</span><span class="info-value">${escapeHtml(product.contact)}</span></div>
                <button onclick="window.location.href='tel:${product.contact.replace(/[^0-9+]/g, '')}'" style="width:100%;padding:12px;background:var(--success);color:white;border:none;border-radius:12px;margin-top:16px;cursor:pointer;">📞 Bog'lanish</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function loadMyProducts() {
    const myProducts = allProducts.filter(p => p.userId === currentUser?.id && p.status !== 'deleted');
    const container = document.getElementById('myProductsList');
    if (!container) return;
    if (!myProducts.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Sizning e\'lonlaringiz yo\'q</p></div>'; return; }
    container.innerHTML = myProducts.map(p => `
        <div class="my-product-item">
            <div class="my-product-icon">${p.imageUrl ? '🖼️' : getCategoryIcon(p.category)}</div>
            <div class="my-product-info"><div class="my-product-name">${escapeHtml(p.name)}</div><div class="my-product-price">${formatPrice(p.price)} so'm</div></div>
            <button class="delete-product-btn" onclick="deleteMyProduct(${p.id})">🗑️</button>
        </div>
    `).join('');
}

async function deleteMyProduct(rowIndex) {
    if (!confirm('O\'chirilsinmi?')) return;
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'deleteProduct');
        formData.append('rowIndex', rowIndex);
        formData.append('userId', currentUser.id);
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) { showToast('✅ O\'chirildi', 'success'); await loadProducts(); }
        else throw new Error(data.error);
    } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function loadChat() {
    try {
        const res = await fetch(`${API_URL}?action=getMessages&t=${Date.now()}`);
        const data = await res.json();
        if (data.success) { chatMessages = data.messages || []; renderChat(); }
    } catch(e) { console.error(e); }
}

function renderChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    if (!chatMessages.length) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Hozircha xabarlar yo\'q</p></div>'; return; }
    container.innerHTML = chatMessages.map(msg => {
        const isSent = currentUser && msg.userId === currentUser.id;
        return `<div class="message ${isSent ? 'sent' : 'received'}">
            ${!isSent ? `<div class="message-sender">${escapeHtml(msg.senderName)}</div>` : ''}
            <div class="message-bubble">${escapeHtml(msg.text)}</div>
            <div class="message-time">${msg.time}</div>
        </div>`;
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
        const res = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) { input.value = ''; await loadChat(); }
    } catch(e) { showToast('❌ Xabar yuborilmadi', 'error'); }
}

async function saveProfile() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const phone = document.getElementById('phoneNumber')?.value.trim();
    localStorage.setItem(`olex_profile_${currentUser.id}`, JSON.stringify({ fullName, phone }));
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'saveProfile');
        formData.append('userId', currentUser.id);
        formData.append('fullName', fullName || '');
        formData.append('phone', phone || '');
        await fetch(API_URL, { method: 'POST', body: formData });
        if (fullName) { currentUser.displayName = fullName; updateUI(); }
        showToast('✅ Profil saqlandi!', 'success');
    } catch(e) { showToast('⚠️ Profil lokal saqlandi', 'warning'); }
}

// ============================================
// YORDAMCHI FUNKSIYALAR
// ============================================
function getCategoryIcon(cat) { const icons = { 'elektronika':'📱','kiyim-kechak':'👕','uy-joy':'🏠','transport':'🚗','boshqa':'📦' }; return icons[cat] || '📦'; }
function formatPrice(p) { return new Intl.NumberFormat('uz-UZ').format(p); }
function escapeHtml(t) { if (!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function showToast(msg, type) {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    c.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideInToast 0.3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============================================
// EVENT LISTENERLAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await initTelegramAuth();
    await loadProducts();
    await loadChat();
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
            if (tabId === 'chat') loadChat();
        });
    });
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.cat;
            renderProducts(allProducts);
        });
    });
    
    document.getElementById('searchInput')?.addEventListener('input', e => { searchQuery = e.target.value; renderProducts(allProducts); });
    document.getElementById('addProductBtn')?.addEventListener('click', addProduct);
    document.getElementById('saveProfileBtn')?.addEventListener('click', saveProfile);
    document.getElementById('sendChatBtn')?.addEventListener('click', sendMessage);
    document.getElementById('chatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
    
    setInterval(() => { if (document.querySelector('.tab-btn[data-tab="chat"]')?.classList.contains('active')) loadChat(); }, 5000);
});
