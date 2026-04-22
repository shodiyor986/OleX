// =====================================================
// app.js - OLEX MARKET (FRONTEND LOGIKA)
// Telegram Web App SDK bilan to'liq integratsiya qilingan
// Rasm yuklash va barcha ma'lumotlar saqlanishi to'g'rilangan
// =====================================================

// SIZNING GOOGLE APPS SCRIPT MANZILINGIZ:
const API_URL = 'https://script.google.com/macros/s/AKfycbxenE0AM6qvA3C8b_1uPMrncnj-hjUuBI2MB6ynNwWZ7P3IMHDnVolxYYXENnnuku8wAg/exec';

let currentUser = null;
let allProducts = [];
let chatMessages = [];
let currentFilter = 'all';

// TELEGRAM WEB APP INITALIZATION
const tg = window.Telegram.WebApp;
tg.expand(); // Ilovani to'liq ekranga ochish

function initAuth() {
    // Agar Telegramdan kirmasa, Test profil beradi (kompyuterda test qilish uchun)
    const user = tg.initDataUnsafe?.user || {
        id: '123456789',
        first_name: 'Test',
        last_name: 'Foydalanuvchi',
        username: 'test_user'
    };

    currentUser = {
        id: String(user.id),
        firstName: user.first_name,
        lastName: user.last_name || '',
        username: user.username || 'yashirin',
        displayName: `${user.first_name} ${user.last_name || ''}`.trim()
    };

    // Profil ma'lumotlarini HTML ga yozish
    document.getElementById('userName').textContent = currentUser.displayName;
    document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0);
    document.getElementById('profileName').textContent = currentUser.displayName;
    document.getElementById('profileAvatar').textContent = currentUser.displayName.charAt(0);
    document.getElementById('profileUsername').textContent = `@${currentUser.username}`;
    document.getElementById('tgId').textContent = currentUser.id;

    // Splash screenni yashirish
    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    }, 1500);
}

// TOAST XABARLAR UCHUN FUNKSIYA
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// BARCHA MA'LUMOTLARNI YUKLASH (Products + Chat)
async function loadData() {
    try {
        // DIQQAT: API_URL oxiriga keshni tozalovchi t= param qo'shildi
        const url = `${API_URL}?action=getAllData&t=${new Date().getTime()}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.success) {
            allProducts = data.products || [];
            chatMessages = data.messages || [];
            renderProducts();
            renderMyProducts();
            renderChat();
        }
    } catch (err) {
        console.error("Ma'lumot yuklashda xatolik: ", err);
    }
}

// MAHSULOTLARNI KO'RSATISH
function renderProducts() {
    const container = document.getElementById('productsContainer');
    let filtered = allProducts;
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (query) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query));
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Mahsulot topilmadi</p></div>';
        return;
    }

    container.innerHTML = `<div class="product-grid">${filtered.map(p => `
        <div class="product-card">
            <div class="product-image">${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}">` : '📦'}</div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-desc">${p.desc}</div>
                <div class="product-price">${new Intl.NumberFormat('uz-UZ').format(p.price)} so'm</div>
                <div class="product-contact">📞 ${p.contact}</div>
            </div>
        </div>
    `).join('')}</div>`;
}

// MENING E'LONLARIM QISMI
function renderMyProducts() {
    const container = document.getElementById('myProductsList');
    const myProducts = allProducts.filter(p => String(p.userId) === String(currentUser.id));
    
    if (myProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Sizda hozircha e\'lonlar yo\'q</p></div>';
        return;
    }

    container.innerHTML = myProducts.map(p => `
        <div class="my-product-item">
            <div class="my-product-icon">${p.imageUrl ? '🖼️' : '📦'}</div>
            <div class="my-product-info">
                <div class="my-product-name">${p.name}</div>
                <div class="my-product-price">${new Intl.NumberFormat('uz-UZ').format(p.price)} so'm</div>
            </div>
        </div>
    `).join('');
}

// YUBORISH UCHUN UMUMIY FUNKSIYA
async function submitData(formData) {
    try {
        const res = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            loadData(); // Muvaffaqiyatli bo'lsa, ro'yxatni yangilaymiz
            return true;
        } 
        throw new Error(data.error || 'Server xatosi');
    } catch (e) {
        console.error("Xatolik: ", e);
        return false;
    }
}

// ==========================================
// RASM YUKLASH FUNKSIYASI (DRIVE UCHUN)
// ==========================================
async function uploadImageToDrive(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Base64 formatiga o'tkazish
                const base64 = e.target.result.split(',')[1];
                const fd = new URLSearchParams();
                fd.append('action', 'uploadImage');
                fd.append('image', base64);
                fd.append('fileName', file.name);
                fd.append('mimeType', file.type);
                
                const res = await fetch(API_URL, { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success) {
                    resolve(data.url);
                } else {
                    reject(new Error(data.error));
                }
            } catch (err) { 
                reject(err); 
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file); // Faylni o'qishni boshlash
    });
}

// ==========================================
// E'LON QO'SHISH TUGMASI BOSILGANDA
// ==========================================
document.getElementById('addProductBtn').addEventListener('click', async () => {
    const btn = document.getElementById('addProductBtn');
    
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value.trim();
    const category = document.getElementById('productCategory').value;
    const desc = document.getElementById('productDesc').value.trim();
    const contact = document.getElementById('productContact').value.trim();
    const imageFile = document.getElementById('productImage').files[0];

    // Tekshiruv
    if (!name || !price || !contact) {
        showToast("Iltimos, ism, narx va telefon raqamni kiriting!", "warning");
        return;
    }

    btn.disabled = true; 
    
    try {
        let imageUrl = '';
        
        // 1-QADAM: Agar rasm tanlangan bo'lsa, oldin uni Drive-ga yuklaymiz
        if (imageFile) {
            btn.textContent = '🖼️ Rasm yuklanmoqda (Kuting)...';
            imageUrl = await uploadImageToDrive(imageFile);
            showToast("Rasm muvaffaqiyatli yuklandi!", "success");
        }

        // 2-QADAM: Barcha ma'lumotlarni Sheets'ga yuboramiz
        btn.textContent = '⏳ E\'lon saqlanmoqda...';
        
        const fd = new URLSearchParams();
        fd.append('action', 'addProduct');
        fd.append('userId', currentUser.id);
        fd.append('name', name);
        fd.append('price', price);
        fd.append('category', category);
        fd.append('desc', desc);
        fd.append('contact', contact);
        fd.append('imageUrl', imageUrl);

        const isSuccess = await submitData(fd);
        
        if (isSuccess) {
            showToast("E'loningiz muvaffaqiyatli joylandi!", "success");
            // Formalarni tozalash
            document.querySelectorAll('.form-input').forEach(i => i.value = '');
            // Bosh sahifaga avtomatik o'tish
            document.querySelector('.tab-btn[data-tab="home"]').click(); 
        } else {
            showToast("Saqlashda xatolik yuz berdi", "error");
        }
    } catch (error) {
        console.error(error);
        showToast("Rasm yuklashda xatolik yuz berdi!", "error");
    } finally {
        btn.disabled = false; 
        btn.textContent = '✅ E\'lonni joylash';
    }
});

// ==========================================
// CHAT FUNKSIYASI
// ==========================================
function renderChat() {
    const container = document.getElementById('chatMessages');
    
    if (chatMessages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Hozircha xabarlar yo\'q</p></div>';
        return;
    }

    container.innerHTML = chatMessages.map(m => `
        <div class="message ${String(m.userId) === String(currentUser.id) ? 'sent' : 'received'}">
            <div class="message-sender">${m.senderName}</div>
            <div class="message-bubble">${m.text}</div>
            <div class="message-time">${m.time}</div>
        </div>
    `).join('');
    
    // Eng pastga tushirib qo'yish
    container.scrollTop = container.scrollHeight;
}

document.getElementById('sendChatBtn').addEventListener('click', async () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    const fd = new URLSearchParams();
    fd.append('action', 'sendMessage');
    fd.append('userId', currentUser.id);
    fd.append('senderName', currentUser.displayName);
    fd.append('text', text);
    
    input.value = ''; // Inputni darhol tozalash
    await submitData(fd);
});

// Chat inputida Enter bosilganda yuborish
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('sendChatBtn').click();
    }
});

// ==========================================
// INTERFEYS (UI) HODISALARI
// ==========================================
// Tablarni almashtirish
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        
        e.target.classList.add('active');
        const tabId = e.target.dataset.tab;
        document.getElementById(`${tabId}Tab`).classList.add('active');
        
        // Chatga kirganda pastga tushirish
        if(tabId === 'chat') {
            const chatCont = document.getElementById('chatMessages');
            chatCont.scrollTop = chatCont.scrollHeight;
        }
    });
});

// Kategoriya filtrlari
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.cat;
        renderProducts();
    });
});

// Qidiruv
document.getElementById('searchInput').addEventListener('input', renderProducts);

// ==========================================
// ILOVANI ISHGA TUSHIRISH
// ==========================================
initAuth();
loadData();
// Har 10 soniyada ma'lumotlarni avtomatik yangilab turish (jonli chat va e'lonlar uchun)
setInterval(loadData, 10000);
