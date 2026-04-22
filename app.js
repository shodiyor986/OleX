// =====================================================
// app.js - OLEX MARKET (FRONTEND LOGIKA)
// Telegram Web App SDK bilan to'liq integratsiya qilingan
// =====================================================

const API_URL = 'BU_YERGA_GOOGLE_APPS_SCRIPT_URL_QOYASIZ'; // <--- O'ZGARTIRISHNI UNUTMANG

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

    document.getElementById('userName').textContent = currentUser.displayName;
    document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0);
    document.getElementById('profileName').textContent = currentUser.displayName;
    document.getElementById('profileAvatar').textContent = currentUser.displayName.charAt(0);
    document.getElementById('profileUsername').textContent = `@${currentUser.username}`;
    document.getElementById('tgId').textContent = currentUser.id;

    setTimeout(() => {
        document.getElementById('splashScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    }, 1500);
}

// YORDAMCHI FUNKSIYALAR
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
        const res = await fetch(`${API_URL}?action=getAllData`);
        const data = await res.json();
        if (data.success) {
            allProducts = data.products || [];
            chatMessages = data.messages || [];
            renderProducts();
            renderMyProducts();
            renderChat();
        }
    } catch (err) {
        showToast('Internetga ulanishda xatolik', 'error');
    }
}

// MAHSULOTLARNI KO'RSATISH
function renderProducts() {
    const container = document.getElementById('productsContainer');
    let filtered = allProducts;
    if (currentFilter !== 'all') filtered = filtered.filter(p => p.category === currentFilter);
    
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query));

    container.innerHTML = filtered.length ? `<div class="product-grid">${filtered.map(p => `
        <div class="product-card">
            <div class="product-image">${p.imageUrl ? `<img src="${p.imageUrl}">` : '📦'}</div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-price">${new Intl.NumberFormat('uz-UZ').format(p.price)} so'm</div>
                <div class="product-contact">📞 ${p.contact}</div>
            </div>
        </div>
    `).join('')}</div>` : '<p style="text-align:center; padding:20px;">Mahsulot topilmadi</p>';
}

// MENING E'LONLARIM
function renderMyProducts() {
    const container = document.getElementById('myProductsList');
    const myProducts = allProducts.filter(p => p.userId === currentUser.id);
    container.innerHTML = myProducts.map(p => `
        <div class="my-product-item">
            <div class="my-product-info"><b>${p.name}</b><br>${p.price} so'm</div>
            <button onclick="deleteProduct(${p.id})" style="color:red; border:none; background:none; cursor:pointer;">🗑️ O'chirish</button>
        </div>
    `).join('') || '<p>E\'lonlaringiz yo\'q</p>';
}

// Yuborish funksiyalari (Product, Chat, Delete)
async function submitData(action, formData) {
    formData.append('action', action);
    try {
        const res = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
            showToast('Muvaffaqiyatli bajarildi!');
            loadData(); // Yangilash
            return true;
        } throw new Error();
    } catch (e) {
        showToast('Xatolik yuz berdi', 'error');
        return false;
    }
}

document.getElementById('addProductBtn').addEventListener('click', async () => {
    const btn = document.getElementById('addProductBtn');
    btn.disabled = true; btn.textContent = '⏳ Yuklanmoqda...';
    
    const fd = new URLSearchParams();
    fd.append('userId', currentUser.id);
    fd.append('name', document.getElementById('productName').value);
    fd.append('price', document.getElementById('productPrice').value);
    fd.append('category', document.getElementById('productCategory').value);
    fd.append('desc', document.getElementById('productDesc').value);
    fd.append('contact', document.getElementById('productContact').value);

    // Rasm yuklash kodi bu yerda qo'shilishi mumkin (Base64)
    
    if (await submitData('addProduct', fd)) {
        document.querySelectorAll('.form-input').forEach(i => i.value = '');
    }
    btn.disabled = false; btn.textContent = '✅ E\'lonni joylash';
});

// Chat Render
function renderChat() {
    const container = document.getElementById('chatMessages');
    container.innerHTML = chatMessages.map(m => `
        <div class="message ${m.userId === currentUser.id ? 'sent' : 'received'}">
            <b>${m.senderName}</b>: ${m.text} <small>(${m.time})</small>
        </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
}

document.getElementById('sendChatBtn').addEventListener('click', () => {
    const input = document.getElementById('chatInput');
    if (!input.value.trim()) return;
    const fd = new URLSearchParams();
    fd.append('userId', currentUser.id);
    fd.append('senderName', currentUser.displayName);
    fd.append('text', input.value);
    submitData('sendMessage', fd);
    input.value = '';
});

// Tab va filter logikasi
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`${e.target.dataset.tab}Tab`).classList.add('active');
    });
});

document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.cat;
        renderProducts();
    });
});

document.getElementById('searchInput').addEventListener('input', renderProducts);

// Ishga tushirish
initAuth();
loadData();
setInterval(loadData, 10000); // Har 10 soniyada ma'lumotlarni yangilab turadi
