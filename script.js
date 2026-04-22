// ============================================
// OLEX MARKET - TO'LIQ ISHLAYDI
// ============================================

// ⚠️ O'ZINGIZNING YANGI DEPLOY QILGAN URL INGIZNI QO'YING!
const API_URL = 'https://script.google.com/macros/s/AKfycbx7YaVd4NeBTXyZeb9MUoNM_scfJzI18JwsDEmo9BdwuTkkS3abHY4TANoN9jDrbv5xMQ/exec';


// Telegram WebApp
const tg = window.Telegram.WebApp;
let currentUser = null;
let allProducts = [];

// ============================================
// TELEGRAM AUTH
// ============================================
async function initTelegramAuth() {
    try {
        tg.ready();
        tg.expand();
        
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
        document.getElementById('loginDate').textContent = new Date().toLocaleString('uz-UZ');
        
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
        console.log('So\'rov yuborilmoqda:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
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
                    <div class="product-image">${getCategoryIcon(product.category)}</div>
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
    
    if (!name || !desc || !price || !contact) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'warning');
        return;
    }
    
    const btn = document.getElementById('addProductBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Yuklanmoqda...';
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'addProduct');
        formData.append('name', name);
        formData.append('description', desc);
        formData.append('price', parseFloat(price));
        formData.append('category', category);
        formData.append('contact', contact);
        formData.append('userId', currentUser.id);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
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
                <div style="text-align:center;font-size:64px;margin-bottom:16px;">${getCategoryIcon(product.category)}</div>
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
            <div class="my-product-icon">${getCategoryIcon(p.category)}</div>
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
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
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
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts(allProducts);
    });
    
    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
});

// Save profile funksiyasi
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
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}
