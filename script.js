// ============================================
// OLEX MARKET - XAVFSIZ TELEGRAM WEB APP
// Google Apps Script Web App API orqali
// ============================================

// ⚠️ MUHIM: O'zingizning Apps Script URL ini qo'ying!
const API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

const tg = window.Telegram.WebApp;
let currentUser = null;
let allProducts = [];

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
        
        // UI ni yangilash
        document.getElementById('userName').textContent = currentUser.displayName;
        document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
        document.getElementById('profileName').textContent = currentUser.displayName;
        document.getElementById('profileAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
        document.getElementById('profileUsername').textContent = currentUser.username ? `@${currentUser.username}` : 'username yo\'q';
        document.getElementById('tgId').textContent = currentUser.id;
        document.getElementById('tgUsername').textContent = currentUser.username || '-';
        
        // Splash screen ni yashirish
        setTimeout(() => {
            document.getElementById('splashScreen').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
        }, 1500);
        
        return true;
    } catch (error) {
        console.error('Auth xatosi:', error);
        showToast('❌ Autentifikatsiya xatosi!', 'error');
        return false;
    }
}

// ============================================
// MAHSULOTLARNI GOOGLE SHEETS DAN YUKLASH
// ============================================
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?action=getProducts`, {
            method: 'GET',
            mode: 'cors'
        });
        
        const data = await response.json();
        
        if (data.success) {
            allProducts = data.products || [];
            renderProducts(allProducts);
            loadMyProducts();
        } else {
            throw new Error(data.error || 'Ma\'lumot olishda xatolik');
        }
    } catch (error) {
        console.error('Yuklash xatosi:', error);
        showToast('❌ Mahsulotlarni yuklashda xatolik', 'error');
        document.getElementById('productsContainer').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Ulanishda xatolik</p>
                <p style="font-size:12px;margin-top:8px;">${error.message}</p>
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
                <div class="product-card" onclick="showProductDetail('${product.id}')">
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
// YANGI MAHSULOT QO'SHISH (Google Sheets ga)
// ============================================
async function addProduct() {
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
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'addProduct',
                name: name,
                description: desc,
                price: parseFloat(price),
                category: category,
                contact: contact,
                userId: currentUser.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Mahsulot muvaffaqiyatli qo\'shildi!', 'success');
            document.getElementById('productName').value = '';
            document.getElementById('productDesc').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productContact').value = '';
            await loadProducts();
            
            // Home tab ga o'tish
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
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'deleteProduct',
                rowIndex: rowIndex,
                userId: currentUser.id
            })
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
// PROFIL MA'LUMOTLARINI SAQLASH
// ============================================
async function saveProfile() {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'saveProfile',
                userId: currentUser.id,
                fullName: fullName,
                phone: phone
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Profil ma\'lumotlari saqlandi!', 'success');
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
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// EVENT LISTENERLAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await initTelegramAuth();
    await loadProducts();
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
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
});
