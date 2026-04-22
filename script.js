// ============================================
// OLEX MARKET - FULL VERSION
// Google Drive + Telegram WebApp
// ============================================

// ⚠️ Google Apps Script URL (deploy qilingandan keyin qo'yiladi)
const API_URL = 'https://script.google.com/macros/s/AKfycbxwIp99MgNyJN65DpFhSCrhLtRuM0X0TOvPqbkM8yBWdFGIm6mDmnQhp59gkWBrYv88/exec';

// Google Drive papkalari ID'lari
const FOLDERS = {
    olex: '1f4P1p2TP8ftbQiSXB-ulwKsEMaUpeu94',
    images: '1lFKoDCNvHIlgSCUbEYRr2zcOKrELO4dx'
};

// Sheets ID'lari
const SHEETS = {
    products: '18AdwNA4paO40DXekWME2jg-ChD_kKh1g2gN2hFO6X8o',
    chat: '15MGWdJgI-Pgib3mPYy-_sXGkD40-Im2hugia9AEZqb4'
};

// Telegram WebApp
const tg = window.Telegram.WebApp;
let currentUser = null;
let allProducts = [];
let chatMessages = [];

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
        document.getElementById('userName').textContent = currentUser.displayName;
        document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = currentUser.displayName;
        document.getElementById('profileAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
        document.getElementById('profileUsername').textContent = currentUser.username ? `@${currentUser.username}` : 'username yo\'q';
        document.getElementById('tgId').textContent = currentUser.id;
        document.getElementById('tgUsername').textContent = currentUser.username || '-';
        
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
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Mahsulotlar yuklanmoqda...</p></div>';
    
    try {
        const url = `${API_URL}?action=getProducts&t=${Date.now()}`;
        const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
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
                <button onclick="loadProducts()" style="margin-top:16px;padding:8px 20px;background:var(--accent);border:none;border-radius:20px;color:white;cursor:pointer;">🔄 Qayta urinish</button>
            </div>
        `;
    }
}

// ============================================
// MAHSULOTLARNI KO'RSATISH
// ============================================
let currentFilter = 'all';
let searchQuery = '';

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    
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
    
    const name = document.getElementById('productName').value.trim();
    const desc = document.getElementById('productDesc').value.trim();
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const contact = document.getElementById('productContact').value.trim();
    const imageFile = document.getElementById('productImage').files[0];
    
    if (!name || !desc || !price || !contact) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'warning');
        return;
    }
    
    const btn = document.getElementById('addProductBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Yuklanmoqda...';
    
    try {
        let imageUrl = '';
        
        // Rasm bo'lsa, Google Drive ga yuklash
        if (imageFile) {
            const reader = new FileReader();
            imageUrl = await new Promise((resolve) => {
                reader.onload = async (e) => {
                    const base64 = e.target.result.split(',')[1];
                    const formData = new URLSearchParams();
                    formData.append('action', 'uploadImage');
                    formData.append('image', base64);
                    formData.append('fileName', imageFile.name);
                    formData.append('folderId', FOLDERS.images);
                    
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: formData
                    });
                    const data = await response.json();
                    resolve(data.url || '');
                };
                reader.readAsDataURL(imageFile);
            });
        }
        
        // Mahsulotni qo'shish
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
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
            document.getElementById('productName').value = '';
            document.getElementById('productDesc').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productContact').value = '';
            document.getElementById('productImage').value = '';
            await loadProducts();
            document.querySelector('.tab-btn[data-tab="home"]').click();
        } else {
            throw new Error(data.error || 'Qo\'shishda xatolik');
        }
    } catch (error) {
        console.error('Xatolik:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ E\'lonni joylash';
    }
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
    
    const containerEl = document.getElementById('chatMessages');
    containerEl.scrollTop = containerEl.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
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
            input.value = '';
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
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'saveProfile');
        formData.append('userId', currentUser.id);
        formData.append('fullName', fullName);
        formData.append('phone', phone);
        
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
                document.getElementById('userName').textContent = fullName;
                document.getElementById('profileName').textContent = fullName;
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
        'elektronika': '📱', 'kiyim-kechak': '👕', 'uy-joy': '🏠',
        'transport': '🚗', 'boshqa': '📦'
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
            document.getElementById(`${tabId}Tab`).classList.add('active');
            
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
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts(allProducts);
    });
    
    // Add product
    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    
    // Save profile
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    
    // Chat
    document.getElementById('sendChatBtn').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Har 5 sekundda chatni yangilash
    setInterval(() => {
        if (document.querySelector('.tab-btn[data-tab="chat"]').classList.contains('active')) {
            loadChat();
        }
    }, 5000);
});
