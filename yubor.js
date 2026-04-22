// =====================================================
// yubor.js - OLEX MARKET (MA'LUMOT YUBORISH)
// Telegram botga ulanmasdan ishlaydi (test rejimi)
// =====================================================

// -------------------- KONFIGURATSIYA --------------------
// Apps Script URL (o‘z URL ingiz bilan almashtiring)
const API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec';

// -------------------- YORDAMCHI FUNKSIYALAR --------------------
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(price);
}

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
async function addProduct() {
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
    
    if (!name || !desc || !price || !contact) {
        showToast('⚠️ Barcha maydonlarni to\'ldiring!', 'warning');
        return;
    }
    
    const btn = document.getElementById('addProductBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Yuklanmoqda...'; }
    
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
        formData.append('userId', window.currentUser.id);
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
            if (window.loadProducts) window.loadProducts();
            const homeTab = document.querySelector('.tab-btn[data-tab="home"]');
            if (homeTab) homeTab.click();
        } else {
            throw new Error(data.error || 'Qo\'shishda xatolik');
        }
    } catch (error) {
        console.error(error);
        showToast('❌ ' + error.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '✅ E\'lonni joylash'; }
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
                formData.append('mimeType', file.type);
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) resolve(data.url);
                else reject(new Error(data.error));
            } catch (err) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// -------------------- 2. MAHSULOT O'CHIRISH --------------------
async function deleteMyProduct(rowIndex) {
    if (!confirm('E\'lonni o\'chirmoqchimisiz?')) return;
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'deleteProduct');
        formData.append('rowIndex', rowIndex);
        formData.append('userId', window.currentUser.id);
        
        const response = await fetch(API_URL, {
            method: 'POST',
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
async function saveProfile() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const phone = document.getElementById('phoneNumber')?.value.trim();
    
    localStorage.setItem(`olex_profile_${window.currentUser.id}`, JSON.stringify({ fullName, phone }));
    
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'saveProfile');
        formData.append('userId', window.currentUser.id);
        formData.append('fullName', fullName || '');
        formData.append('phone', phone || '');
        
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            if (fullName) {
                window.currentUser.displayName = fullName;
                if (window.updateUI) window.updateUI();
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
        
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            input.value = '';
            if (window.loadChat) window.loadChat();
        }
    } catch (error) {
        showToast('❌ Xabar yuborilmadi', 'error');
    }
}

// Global funksiyalar
window.addProduct = addProduct;
window.deleteMyProduct = deleteMyProduct;
window.saveProfile = saveProfile;
window.sendMessage = sendMessage;
window.uploadImageToDrive = uploadImageToDrive;
