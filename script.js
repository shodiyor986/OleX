// ============================================
// OLEX MARKET - XAVFSIZ TELEGRAM WEB APP
// ============================================

// Telegram WebApp
const tg = window.Telegram.WebApp;

// Global variables
let currentUser = null;
let allProducts = [];
let myProducts = [];
let currentFilter = 'all';
let searchQuery = '';

// Session storage kaliti
const SESSION_KEY = 'olex_session';

// ============================================
// XAVFSIZLIK: Foydalanuvchi autentifikatsiyasi
// ============================================
function initTelegramAuth() {
    try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();
        
        const user = tg.initDataUnsafe?.user;
        
        if (!user || !user.id) {
            throw new Error('Telegram foydalanuvchisi topilmadi');
        }
        
        // Xavfsiz session ID yaratish
        const sessionId = btoa(`${user.id}_${Date.now()}_${Math.random()}`);
        
        currentUser = {
            id: String(user.id),
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            username: user.username || '',
            languageCode: user.language_code || 'uz',
            photoUrl: user.photo_url || '',
            sessionId: sessionId,
            loginTime: new Date().toISOString(),
            displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User_${user.id}`
        };
        
        // Session ni localStorage ga saqlash
        const session = {
            userId: currentUser.id,
            sessionId: sessionId,
            loginTime: currentUser.loginTime,
            userData: currentUser
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        
        return true;
    } catch (error) {
        console.error('Auth xatosi:', error);
        showToast('❌ Autentifikatsiya xatosi! Iltimos, Telegram orqali qaytadan urining.', 'error');
        return false;
    }
}

// ============================================
// SESSION TEKSHIRISH (boshqa user kirmasligi uchun)
// ============================================
function verifySession() {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (!savedSession) return false;
    
    try {
        const session = JSON.parse(savedSession);
        // Faqat shu Telegram user sessioni ishlaydi
        return session.userId === currentUser?.id;
    } catch {
        return false;
    }
}

// ============================================
// MAHSULOTLARNI YUKLASH
// ============================================
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    
    try {
        // Mahsulotlarni localStorage dan o'qish
        const stored = localStorage.getItem('olex_products');
        if (stored) {
            allProducts = JSON.parse(stored);
        } else {
            // Namuna mahsulotlar
            allProducts = [
                {
                    id: '1',
                    userId: 'system',
                    name: 'iPhone 15 Pro Max',
                    description: '256GB, Dark Blue, Ideal holat',
                    price: 14500000,
                    category: 'elektronika',
                    contact: '+998901234567',
                    date: new Date().toISOString(),
                    status: 'active'
                },
                {
                    id: '2',
                    userId: 'system',
                    name: 'Chevrolet Nexia 3',
                    description: '2022 yil, 45000 km yurgan',
                    price: 120000000,
                    category: 'transport',
                    contact: '+998901234568',
                    date: new Date().toISOString(),
                    status: 'active'
                },
                {
                    id: '3',
                    userId: 'system',
                    name: '2 xonali kvartira',
                    description: 'Chilonzor, 52 kv.m, ta\'mirlangan',
                    price: 350000000,
                    category: 'uy-joy',
                    contact: '+998901234569',
                    date: new Date().toISOString(),
                    status: 'active'
                }
            ];
            localStorage.setItem('olex_products', JSON.stringify(allProducts));
        }
        
        // Faqat active mahsulotlarni ko'rsatish
        const activeProducts = allProducts.filter(p => p.status !== 'deleted');
        renderProducts(activeProducts);
        
    } catch (error) {
        console.error('Yuklash xatosi:', error);
        showToast('❌ Mahsulotlarni yuklashda xatolik', 'error');
    }
}

// ============================================
// MAHSULOTLARNI KO'RSATISH
// ============================================
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    
    let filtered = [...products];
    
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Mahsulot topilmadi</p>
                <p style="font-size: 12px; margin-top: 8px;">Boshqa kategoriya yoki kalit so'z bilan qidirib ko'ring</p>
            </div>
        `;
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
// MAHSULOT DETAIL
// ============================================
function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const isOwner = currentUser && product.userId === currentUser.id;
    
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
                <div class="info-row"><span class="info-label">📅 Sana</span><span class="info-value">${new Date(product.date).toLocaleDateString('uz-UZ')}</span></div>
                ${!isOwner ? `
                    <button onclick="window.location.href='tel:${product.contact.replace(/[^0-9+]/g, '')}'" style="width:100%;padding:12px;background:var(--success);color:white;border:none;border-radius:12px;margin-top:16px;cursor:pointer;">
                        📞 Bog'l
