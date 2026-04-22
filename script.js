// ============================================
// script.js - OLEX MARKET FRONTEND
// Vazifasi: Telegram WebApp bilan ishlash, backend API ga so'rov yuborish, UI boshqaruvi
// Tegishli backend fayllari: yubor.gs (GET), qabul.gs (POST)
// ============================================

// ============================================
// KONFIGURATSIYA
// ============================================

// Google Apps Script Web App URL (o'z URL ingiz bilan almashtiring)
// Bu URL doGet va doPost ni o'z ichiga oladi
const API_URL = 'https://script.google.com/macros/s/AKfycbz70foBkgKEFDmWdH_VSv-115jeuT9euIFs093owFYofSObtw8zE1Tbvj-ff-Nj58b0yQ/exec';

// Telegram WebApp obyekti
const tg = window.Telegram.WebApp;

// Global o'zgaruvchilar
let currentUser = null;      // Joriy foydalanuvchi ma'lumotlari
let allProducts = [];        // Barcha mahsulotlar
let chatMessages = [];       // Chat xabarlari
let currentFilter = 'all';   // Hozirgi kategoriya filtri
let searchQuery = '';        // Qidiruv so'zi

// ============================================
// 1. TELEGRAM AUTHENTIFICATION
// ============================================

/**
 * Telegram autentifikatsiyasi va foydalanuvchi ma'lumotlarini olish
 * Telegram WebApp orqali foydalanuvchi ID, ism, username olinadi
 */
async function initTelegramAuth() {
    try {
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();
        
        const user = tg.initDataUnsafe?.user;
        
        if (!user || !user.id) {
            // Test rejimi (brauzerda ishlatish uchun)
            currentUser = {
                id: 'test_' + Date.now(),
                firstName: 'Test',
                lastName: 'User',
                username: 'test_user',
                displayName: 'Test User',
                loginTime: new Date().toISOString()
            };
        } else {
            // Haqiqiy Telegram foydalanuvchisi
            currentUser = {
                id: String(user.id),
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                username: user.username || '',
                displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User_${user.id}`,
                loginTime: new Date().toISOString()
            };
        }
        
        // UI ni yangilash
        updateUI();
        
        // Splash screen ni yashirish (1.5 sekunddan keyin)
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            const app = document.getElementById('appContainer');
            if (splash) splash.style.display = 'none';
            if (app) app.style.display = 'block';
        }, 1500);
        
        console.log('✅ Foydalanuvchi autentifikatsiyasi muvaffaqiyatli:', currentUser.displayName);
        return true;
        
    } catch (error) {
        console.error('❌ Auth xatosi:', error);
        showToast('❌ Autentifikatsiya xatosi!', 'error');
        return false;
    }
}

/**
 * UI elementlarini yangilash (header, profil sahifasi)
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
    
    if (elements.userName) elements.userName.textContent = currentUser.displayName;
    if (elements.userAvatar) elements.userAvatar.textContent = currentUser.displayName.charAt(0).toUpperCase();
    if (elements.profileName) elements.profileName.textContent = currentUser.displayName;
    if (elements.profileAvatar) elements.profileAvatar.textContent = currentUser.displayName.charAt(0).toUpperCase();
    if (elements.profileUsername) elements.profileUsername.textContent = currentUser.username ? `@${currentUser.username}` : 'username yo\'q';
    if (elements.tgId) elements.tgId.textContent = currentUser.id;
    if (elements.tgUsername) elements.tgUsername.textContent = currentUser.username || '-';
    if (elements.loginDate) elements.loginDate.textContent = new Date().toLocaleString('uz-UZ');
    
    // Profil formasini to'ldirish (agar localStorage da saqlangan bo'lsa)
    const savedProfile = localStorage.getItem(`olex_profile_${currentUser.id}`);
    if (savedProfile) {
        try {
            const profile = JSON.parse(savedProfile);
            const fullNameInput = document.getElementById('fullName');
            const phoneInput = document.getElementById('phoneNumber');
            if (fullNameInput && profile.fullName) fullNameInput.value = profile.fullName;
            if (phoneInput && profile.phone) phoneInput.value = profile.phone;
        } catch(e) {}
    }
}

// ============================================
// 2. MAHSULOTLARNI YUKLASH (GET so'rovi)
// ============================================

/**
 * Mahsulotlarni backend dan yuklash (GET /?action=getProducts)
 * Natijada allProducts massivi to'ldiriladi va UI renderlanadi
 */
async function loadProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Mahsulotlar yuklanmoqda...</p></div>';
    
    try {
        const url = `${API_URL}?action=getProducts&t=${Date.now()}`;
        console.log('📤 So\'rov yuborilmoqda:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Olingan ma\'lumot:', data);
        
        if (data.success) {
            allProducts = data.products || [];
            renderProducts(allProducts);
            loadMyProducts();  // Profil sahifasidagi "Mening e'lonlarim" ni yangilash
            showToast(`✅ ${allProducts.length} ta mahsulot yuklandi`, 'success');
        } else {
            throw new Error(data.error || 'Ma\'lumot olishda xatolik');
        }
        
    } catch (error) {
        console.error('❌ Yuklash xatosi:', error);
        showToast('❌ ' + error.message, 'error');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>Google Sheets ga ulanishda xatolik</p>
                <p style="font-size:12px;margin-top:8px;">${error.message}</p>
                <button onclick="loadProducts()" style="margin-top:16px;padding:8px 20px;background:var(--accent);border:none;border-radius:20px;color:white;cursor:pointer;">
                    🔄 Qayta urinish
                </button>
            </div>
        `;
    }
}

/**
 * Mahsulotlarni UI da ko'rsatish (filter va qidiruv qo'llanilgan holda)
 * @param {Array} products - mahsulotlar massivi
 */
function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    // Filtr va qidiruvni qo'llash
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
// 3. YANGI MAHSULOT QO'SHISH (POST so'rovi)
// ============================================

/**
 * Yangi mahsulot qo'shish (POST action=addProduct)
 * Formadagi ma'lumotlarni olib, backendga yuboradi
 */
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
        
        // Agar rasm tanlangan bo'lsa, avval Drive ga yuklash
        if (imageFile) {
            imageUrl = await uploadImageToDrive(imageFile);
        }
        
        // POST so'rovi uchun ma'lumotlarni tayyorlash
        const formData = new URLSearchParams();
        formData.append('action', 'addProduct');
        formData.append('name', name);
        formData.append('description', desc);
        formData.append('price', parseFloat(price));
        formData.append('category', category);
        formData.append('contact', contact);
        formData.append('userId', currentUser.id);
        formData.append('imageUrl', imageUrl);
        
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
            const homeTab = document.querySelector('.tab-btn[data-tab="home"]');
            if (homeTab) homeTab.click();
        } else {
            throw new Error(data.error || 'Qo\'shishda xatolik');
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '✅ E\'lonni joylash';
        }
    }
}

/**
 * Rasmni Google Drive papkasiga yuklash (POST action=uploadImage)
 * @param {File} file - yuklanadigan rasm fayli
 * @returns {Promise<string>} - rasmning umumiy URL i
 */
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
                formData.append('mimeType', file.type);
                
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
// 4. MAHSULOT DETAIL MODAL
// ============================================

/**
 * Mahsulot tafsilotlarini modal oynada ko'rsatish
 * @param {number} productId - mahsulot ID si (qator raqami)
 */
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
// 5. Mening e'lonlarim (Profil sahifasi)
// ============================================

/**
 * Joriy foydalanuvchining o'z e'lonlarini yuklash va ko'rsatish
 */
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

/**
 * O'z e'lonini o'chirish (POST action=deleteProduct)
 * @param {number} rowIndex - o'chiriladigan qator raqami
 */
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
            await loadProducts(); // Ro'yxatni yangilash
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

// ============================================
// 6. CHAT FUNKSIYALARI
// ============================================

/**
 * Chat xabarlarini yuklash (GET /?action=getMessages)
 */
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

/**
 * Xabarlarni UI da ko'rsatish
 */
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
                <div class="message-time">${msg.time || new Date(msg.date).toLocaleTimeString('uz-UZ')}</div>
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

/**
 * Yangi xabar yuborish (POST action=sendMessage)
 */
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
            await loadChat(); // Xabarlarni qayta yuklash
        }
    } catch (error) {
        console.error('Xabar yuborish xatosi:', error);
        showToast('❌ Xabar yuborilmadi', 'error');
    }
}

// ============================================
// 7. PROFIL MA'LUMOTLARINI SAQLASH
// ============================================

/**
 * Profil ma'lumotlarini saqlash (POST action=saveProfile)
 * Ma'lumotlar localStorage va Google Sheets'ga yoziladi
 */
async function saveProfile() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const phone = document.getElementById('phoneNumber')?.value.trim();
    
    // LocalStorage ga saqlash (offline rejim uchun)
    const profile = {
        fullName: fullName,
        phone: phone,
        updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`olex_profile_${currentUser.id}`, JSON.stringify(profile));
    
    // Serverga yuborish
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
            if (fullName) {
                currentUser.displayName = fullName;
                updateUI();
            }
            showToast('✅ Profil saqlandi!', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        // Serverga yuborilmagan bo'lsa ham, lokal saqlandi
        showToast('⚠️ Profil lokal saqlandi', 'warning');
    }
}

// ============================================
// 8. YORDAMCHI FUNKSIYALAR
// ============================================

/**
 * Kategoriya ikonkasini qaytarish
 * @param {string} category - kategoriya nomi
 * @returns {string} emoji
 */
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

/**
 * Narxni formatlash (minglik ajratgich bilan)
 * @param {number} price - narx
 * @returns {string} formatlangan narx
 */
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(price);
}

/**
 * HTML special charlarni o'chirish (XSS himoyasi)
 * @param {string} text - matn
 * @returns {string} tozalangan matn
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Bildirishnoma (toast) ko'rsatish
 * @param {string} message - xabar matni
 * @param {string} type - turi: success, error, warning
 */
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
// 9. EVENT LISTENERLAR VA ISHGA TUSHIRISH
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM yuklandi, ilova ishga tushmoqda...');
    
    // 1. Telegram autentifikatsiyasi
    await initTelegramAuth();
    
    // 2. Mahsulotlar va chatni yuklash
    await loadProducts();
    await loadChat();
    
    // 3. Tablarni sozlash
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                const activeTab = document.getElementById(`${tabId}Tab`);
                if (activeTab) activeTab.classList.add('active');
                if (tabId === 'chat') loadChat(); // Chat tab ochilganda yangilash
                console.log(`📑 Tab o'zgartirildi: ${tabId}`);
            });
        });
    }
    
    // 4. Kategoriya filtr tugmalari
    const catBtns = document.querySelectorAll('.cat-btn');
    if (catBtns.length) {
        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.cat;
                renderProducts(allProducts);
                console.log(`🏷️ Filter o'zgartirildi: ${currentFilter}`);
            });
        });
    }
    
    // 5. Qidiruv inputi
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts(allProducts);
        });
    }
    
    // 6. E'lon qo'shish tugmasi
    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addProduct);
        console.log('✅ Add product button connected');
    }
    
    // 7. Profil saqlash tugmasi
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
        console.log('✅ Save profile button connected');
    }
    
    // 8. Chat yuborish tugmasi
    const sendBtn = document.getElementById('sendChatBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
        console.log('✅ Send chat button connected');
    }
    
    // 9. Chat inputda Enter tugmasi
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // 10. Chatni avtomatik yangilash (har 5 sekundda)
    setInterval(() => {
        const chatTab = document.querySelector('.tab-btn[data-tab="chat"]');
        if (chatTab && chatTab.classList.contains('active')) {
            loadChat();
        }
    }, 5000);
    
    console.log('🚀 Ilova to\'liq ishga tushdi!');
});

// Global funksiyalar (HTML dan chaqirish uchun)
window.loadProducts = loadProducts;
window.addProduct = addProduct;
window.showProductDetail = showProductDetail;
window.deleteMyProduct = deleteMyProduct;
window.sendMessage = sendMessage;
window.saveProfile = saveProfile;
window.loadChat = loadChat;
window.renderProducts = renderProducts;
