// =====================================================
// qabul.js - OLEX MARKET FRONTEND (MA'LUMOT QABUL QILISH)
// Vazifasi: Serverdan (Google Sheets, Docs, Drive) ma'lumotlarni
// GET so'rovlar orqali olish va ularni UI da ko'rsatish.
// =====================================================

// -------------------- KONFIGURATSIYA --------------------
const API_URL = 'https://script.google.com/macros/s/AKfycbxenE0AM6qvA3C8b_1uPMrncnj-hjUuBI2MB6ynNwWZ7P3IMHDnVolxYYXENnnuku8wAg/exec';

// -------------------- GLOBAL O'ZGARUVCHILAR --------------------
window.currentUser = null;      // Joriy foydalanuvchi ma'lumotlari
window.allProducts = [];         // Barcha mahsulotlar ro'yxati
window.chatMessages = [];        // Chat xabarlari ro'yxati
window.currentFilter = 'all';    // Tanlangan kategoriya filtri
window.searchQuery = '';         // Qidiruv so'rovi

// -------------------- YORDAMCHI FUNKSIYALAR --------------------
function showToast(message, type) { /* xuddi yubor.js dagi kabi */ }
function escapeHtml(text) { /* xuddi yubor.js dagi kabi */ }
function formatPrice(price) { /* xuddi yubor.js dagi kabi */ }
function getCategoryIcon(category) { /* xuddi yubor.js dagi kabi */ }

// -------------------- 1. TELEGRAM AUTHENTIFICATION --------------------
/**
 * Telegram WebApp orqali foydalanuvchi ma'lumotlarini olish va UI ni yangilash
 */
async function initTelegramAuth() {
    try {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        
        if (!user || !user.id) {
            // Test rejimi (brauzerda ishlatish uchun)
            window.currentUser = {
                id: 'test_' + Date.now(),
                firstName: 'Test',
                lastName: 'User',
                username: 'test_user',
                displayName: 'Test User'
            };
        } else {
            window.currentUser = {
                id: String(user.id),
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                username: user.username || '',
                displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User_${user.id}`
            };
        }
        
        updateUI();
        
        // Splash ekranini yashirish
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

/**
 * UI elementlarini joriy foydalanuvchi ma'lumotlariga mos ravishda yangilaydi
 */
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
    
    if (elements.userName) elements.userName.textContent = window.currentUser.displayName;
    if (elements.userAvatar) elements.userAvatar.textContent = window.currentUser.displayName.charAt(0).toUpperCase();
    if (elements.profileName) elements.profileName.textContent = window.currentUser.displayName;
    if (elements.profileAvatar) elements.profileAvatar.textContent = window.currentUser.displayName.charAt(0).toUpperCase();
    if (elements.profileUsername) elements.profileUsername.textContent = window.currentUser.username ? `@${window.currentUser.username}` : 'username yo\'q';
    if (elements.tgId) elements.tgId.textContent = window.currentUser.id;
    if (elements.tgUsername) elements.tgUsername.textContent = window.currentUser.username || '-';
    if (elements.loginDate) elements.loginDate.textContent = new Date().toLocaleString('uz-UZ');
    
    // Profil formasini lokal saqlangan ma'lumotlar bilan to'ldirish
    const savedProfile = localStorage.getItem(`olex_profile_${window.currentUser.id}`);
    if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (document.getElementById('fullName')) document.getElementById('fullName').value = profile.fullName || '';
        if (document.getElementById('phoneNumber')) document.getElementById('phoneNumber').value = profile.phone || '';
    }
}

// -------------------- 2. MAHSULOTLARNI YUKLASH --------------------
/**
 * Serverdan barcha mahsulotlarni GET so'rov orqali olish va ro'yxatni ko'rsatish
 */
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Mahsulotlar yuklanmoqda...</p></div>';
    
    try {
        const response = await fetch(`${API_URL}?action=getProducts&t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (data.success) {
            window.allProducts = data.products || [];
            renderProducts(window.allProducts);
            loadMyProducts();
            showToast(`✅ ${window.allProducts.length} ta mahsulot yuklandi`, 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Xatolik: ${error.message}</p><button onclick="loadProducts()">🔄 Qayta urinish</button></div>`;
    }
}

/**
 * Mahsulotlar ro'yxatini HTML da ko'rsatish (filter va qidiruvni qo'llagan holda)
 * @param {Array} products - Mahsulotlar massivi
 */
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    let filtered = products.filter(p => p.status !== 'deleted');
    if (window.currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === window.currentFilter);
    }
    if (window.searchQuery) {
        const q = window.searchQuery.toLowerCase();
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

/**
 * Mahsulot detalini modal oynada ko'rsatish
 * @param {number} productId - Mahsulotning id si (qator raqami)
 */
function showProductDetail(productId) {
    const product = window.allProducts.find(p => p.id == productId);
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

// -------------------- 3. MENGING E'LONLARIM --------------------
/**
 * Joriy foydalanuvchiga tegishli e'lonlarni ro'yxatini ko'rsatadi
 */
function loadMyProducts() {
    const myProducts = window.allProducts.filter(p => p.userId === window.currentUser?.id && p.status !== 'deleted');
    const container = document.getElementById('myProductsList');
    if (!container) return;
    
    if (!myProducts.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Sizning e\'lonlaringiz yo\'q</p></div>';
        return;
    }
    
    container.innerHTML = myProducts.map(p => `
        <div class="my-product-item">
            <div class="my-product-icon">${p.imageUrl ? '🖼️' : getCategoryIcon(p.category)}</div>
            <div class="my-product-info"><div class="my-product-name">${escapeHtml(p.name)}</div><div class="my-product-price">${formatPrice(p.price)} so'm</div></div>
            <button class="delete-product-btn" onclick="deleteMyProduct(${p.id})">🗑️</button>
        </div>
    `).join('');
}

// -------------------- 4. CHAT XABARLARINI YUKLASH --------------------
/**
 * Serverdan chat xabarlarini GET so'rov orqali olish va ko'rsatish
 */
async function loadChat() {
    try {
        const response = await fetch(`${API_URL}?action=getMessages&t=${Date.now()}`);
        const data = await response.json();
        if (data.success) {
            window.chatMessages = data.messages || [];
            renderChat();
        }
    } catch (error) {
        console.error('Chat yuklash xatosi:', error);
    }
}

/**
 * Chat xabarlarini HTML da ko'rsatish (eng yangisi eng pastda)
 */
function renderChat() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (!window.chatMessages.length) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Hozircha xabarlar yo\'q</p></div>';
        return;
    }
    
    container.innerHTML = window.chatMessages.map(msg => {
        const isSent = window.currentUser && msg.userId === window.currentUser.id;
        return `<div class="message ${isSent ? 'sent' : 'received'}">
            ${!isSent ? `<div class="message-sender">${escapeHtml(msg.senderName)}</div>` : ''}
            <div class="message-bubble">${escapeHtml(msg.text)}</div>
            <div class="message-time">${msg.time}</div>
        </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

// -------------------- 5. EVENT LISTENERLAR VA BOSHLANG'ICH SOZLAMALAR --------------------
/**
 * DOM to'liq yuklangandan keyin barcha kerakli funksiyalarni ishga tushiradi
 */
document.addEventListener('DOMContentLoaded', async () => {
    await initTelegramAuth();
    await loadProducts();
    await loadChat();
    
    // Tab o'zgartirish
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
    
    // Kategoriya filtri
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.currentFilter = btn.dataset.cat;
            renderProducts(window.allProducts);
        });
    });
    
    // Qidiruv inputi
    document.getElementById('searchInput')?.addEventListener('input', e => {
        window.searchQuery = e.target.value;
        renderProducts(window.allProducts);
    });
    
    // Tugmalarni ulash (yubor.js dagi funksiyalar)
    document.getElementById('addProductBtn')?.addEventListener('click', window.addProduct);
    document.getElementById('saveProfileBtn')?.addEventListener('click', window.saveProfile);
    document.getElementById('sendChatBtn')?.addEventListener('click', window.sendMessage);
    document.getElementById('chatInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') window.sendMessage(); });
    
    // Har 5 sekundda chatni yangilash (agar chat tabi aktiv bo'lsa)
    setInterval(() => {
        const chatTab = document.querySelector('.tab-btn[data-tab="chat"]');
        if (chatTab?.classList.contains('active')) loadChat();
    }, 5000);
});

// Global funksiyalarni oynaga biriktirish (HTML dan chaqirish uchun)
window.loadProducts = loadProducts;
window.showProductDetail = showProductDetail;
window.loadChat = loadChat;
window.updateUI = updateUI;
