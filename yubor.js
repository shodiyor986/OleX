// =====================================================
// yubor.js - OLEX MARKET FRONTEND (MA'LUMOT YUBORISH)
// Vazifasi: Foydalanuvchi amallarini (e'lon qo'shish, profil saqlash,
// xabar yuborish, rasm yuklash) serverga POST so'rovlar orqali yuborish.
// =====================================================

// -------------------- KONFIGURATSIYA --------------------
// Apps Script ning web app URL manzili (o'z URL ingiz bilan almashtiring)
const API_URL = 'https://script.google.com/macros/s/1lvX7SqYioAO5Y1sEmHtLGcE1taeo43oBXsk4mTunADwmfJgBKiw0hNE6/exec';

// -------------------- YORDAMCHI FUNKSIYALAR --------------------
/**
 * Xatolik yoki muvaffaqiyat haqida qisqa xabar ko'rsatish (toast)
 * @param {string} message - Ko'rsatiladigan matn
 * @param {string} type - 'success', 'error', 'warning'
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

/**
 * HTML ichidagi matnni xavfsiz ko'rsatish uchun (XSS hujumlarining oldini olish)
 * @param {string} text - Kiruvchi matn
 * @returns {string} - Xavfsiz matn
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Narxni so'm formatida ko'rsatish (masalan: 1,500,000 so'm)
 * @param {number} price - Narx
 * @returns {string} - Formatlangan narx
 */
function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(price);
}

/**
 * Kategoriya nomiga mos emoji qaytaradi
 * @param {string} category - Kategoriya (elektronika, kiyim-kechak, ...)
 * @returns {string} - Emoji belgisi
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

// -------------------- 1. YANGI MAHSULOT QO'SHISH --------------------
/**
 * Formadan olingan ma'lumotlarni serverga POST so'rov orqali yuboradi.
 * Rasm mavjud bo'lsa, avval uni Drive ga yuklaydi, so'ng mahsulot ma'lumotlarini yuboradi.
 */
async function addProduct() {
    // Joriy foydalanuvchi global `currentUser` o'zgaruvchisida saqlanadi (qabul.js da aniqlanadi)
    if (!window.currentUser) {
        showToast('❌ Iltimos, qaytadan kiring!', 'error');
        return;
    }
    
    const name = document.getElementById('productName')?.value.trim();
    const desc = document.getElementById('productDesc')?.value.trim();
    const price = document.getElementById('productPrice')?.value;
    const category = document.getElementById('productCategory')?.value;
    const contact = document.getElementById('productContact')?.value.trim();
    const imageFile = document.getElementById('productImage')?.files[0];
    
    // Maydonlarni tekshirish
    if (!name || !desc || !price || !contact) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'warning');
        return;
    }
    
    const btn = document.getElementById('addProductBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Yuklanmoqda...'; }
    
    try {
        let imageUrl = '';
        // Agar rasm tanlangan bo'lsa, avval uni yuklash
        if (imageFile) {
            imageUrl = await uploadImageToDrive(imageFile);
        }
        
        // POST so'rov uchun ma'lumotlar tayyorlash
        const formData = new URLSearchParams();
        formData.append('action', 'addProduct');
        formData.append('name', name);
        formData.append('description', desc);
        formData.append('price', parseFloat(price));
        formData.append('category', category);
        formData.append('contact', contact);
        formData.append('userId', window.currentUser.id);
        formData.append('imageUrl', imageUrl);
        
        console.log('📤 Yuborilayotgan mahsulot:', Object.fromEntries(formData));
        
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
            // Mahsulotlarni qayta yuklash (qabul.js dagi loadProducts funksiyasi)
            if (window.loadProducts) window.loadProducts();
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
        if (btn) { btn.disabled = false; btn.textContent = '✅ E\'lonni joylash'; }
    }
}

/**
 * Rasmni Google Drive ga yuklaydi va uning URL manzilini qaytaradi
 * @param {File} file - Yuklanadigan rasm fayli
 * @returns {string} - Google Drive rasm URL i
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

// -------------------- 2. MAHSULOT O'CHIRISH --------------------
/**
 * Mahsulotni o'chirish (statusni 'deleted' ga o'zgartirish) uchun POST so'rov yuboradi
 * @param {number} rowIndex - O'chiriladigan mahsulotning qator raqami (id)
 */
async function deleteMyProduct(rowIndex) {
    if (!confirm('E\'lonni o\'chirmoqchimisiz?')) return;
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'deleteProduct');
        formData.append('rowIndex', rowIndex);
        formData.append('userId', window.currentUser.id);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            showToast('✅ E\'lon o\'chirildi', 'success');
            if (window.loadProducts) window.loadProducts();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

// -------------------- 3. PROFIL MA'LUMOTLARINI SAQLASH --------------------
/**
 * Profil ma'lumotlarini (to'liq ism, telefon) serverga POST so'rov orqali yuboradi
 */
async function saveProfile() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const phone = document.getElementById('phoneNumber')?.value.trim();
    
    // Lokal saqlash (zaxira)
    localStorage.setItem(`olex_profile_${window.currentUser.id}`, JSON.stringify({ fullName, phone }));
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'saveProfile');
        formData.append('userId', window.currentUser.id);
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
                window.currentUser.displayName = fullName;
                if (window.updateUI) window.updateUI(); // UI ni yangilash
            }
            showToast('✅ Profil saqlandi!', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('⚠️ Profil lokal saqlandi', 'warning');
    }
}

// -------------------- 4. XABAR YUBORISH (CHAT) --------------------
/**
 * Chat xabarini serverga POST so'rov orqali yuboradi
 */
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text || !window.currentUser) return;
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'sendMessage');
        formData.append('userId', window.currentUser.id);
        formData.append('senderName', window.currentUser.displayName);
        formData.append('text', text);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            input.value = '';
            if (window.loadChat) window.loadChat(); // Chatni yangilash
        }
    } catch (error) {
        showToast('❌ Xabar yuborilmadi', 'error');
    }
}

// Global funksiyalarni oynaga biriktirish (HTML dan chaqirish uchun)
window.addProduct = addProduct;
window.deleteMyProduct = deleteMyProduct;
window.saveProfile = saveProfile;
window.sendMessage = sendMessage;
window.uploadImageToDrive = uploadImageToDrive;
