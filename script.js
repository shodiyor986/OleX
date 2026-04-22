// ============================================
// OLEX MARKET - Frontend JavaScript
// ============================================

const API_URL = 'http://localhost:5000';

let products = [];
let isLoading = false;

// ============================================
// MAHSULOTLARNI YUKLASH
// ============================================
async function loadProducts() {
    if (isLoading) return;
    isLoading = true;
    
    const statusDiv = document.getElementById('connStatus');
    const container = document.getElementById('productsList');
    
    try {
        statusDiv.innerHTML = '🟡 Maʼlumotlar yuklanmoqda...';
        statusDiv.style.background = '#fff3cd';
        statusDiv.style.color = '#856404';
        
        const response = await fetch(`${API_URL}/get_products`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            products = data.products || [];
            statusDiv.innerHTML = `✅ ${products.length} ta mahsulot yuklandi`;
            statusDiv.style.background = '#d4edda';
            statusDiv.style.color = '#155724';
            renderProducts(products);
        } else {
            throw new Error(data.error || 'Maʼlumot olishda xatolik');
        }
        
    } catch (error) {
        console.error('Xatolik:', error);
        statusDiv.innerHTML = `❌ Ulanish xatosi: ${error.message}`;
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        container.innerHTML = `
            <div class="loading">
                ❌ Serverga ulanishda xatolik<br>
                <small>${error.message}</small><br><br>
                <button onclick="location.reload()" style="padding:8px 20px;margin-top:10px;cursor:pointer;">🔄 Qayta urinish</button>
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

// ============================================
// MAHSULOTLARNI KO'RSATISH
// ============================================
function renderProducts(items) {
    const container = document.getElementById('productsList');
    
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="loading">📭 Hech qanday mahsulot topilmadi</div>`;
        return;
    }
    
    container.innerHTML = items.map(product => `
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
    `).join('');
}

// ============================================
// MAHSULOT DETAIL
// ============================================
function showProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div style="text-align:center;font-size:64px;margin-bottom:16px;">${getCategoryIcon(product.category)}</div>
            <h2 style="margin-bottom:8px;">${escapeHtml(product.name)}</h2>
            <div style="color:#2c5f8a;font-weight:bold;margin-bottom:12px;">${formatPrice(product.price)} so'm</div>
            <div style="margin-bottom:12px;"><strong>📖 Tavsif:</strong><br>${escapeHtml(product.description)}</div>
            <div style="margin-bottom:12px;"><strong>📞 Aloqa:</strong> ${escapeHtml(product.contact)}</div>
            <div style="margin-bottom:12px;"><strong>📅 Sana:</strong> ${product.date_added || 'Nomaʼlum'}</div>
            <button onclick="window.location.href='tel:${product.contact.replace(/[^0-9+]/g, '')}'" style="width:100%;padding:12px;background:#2c5f8a;color:white;border:none;border-radius:40px;margin-top:16px;cursor:pointer;">
                📞 Bog'lanish
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// ============================================
// YANGI MAHSULOT QO'SHISH
// ============================================
async function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const desc = document.getElementById('productDesc').value.trim();
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const contact = document.getElementById('productContact').value.trim();
    
    if (!name || !desc || !price || !contact) {
        alert('⚠️ Barcha maydonlarni to\'ldiring!');
        return;
    }
    
    const btn = document.getElementById('addProductBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Yuklanmoqda...';
    
    try {
        const response = await fetch(`${API_URL}/add_product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                description: desc,
                price: parseFloat(price),
                category: category,
                contact: contact
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Mahsulot muvaffaqiyatli qo\'shildi!');
            document.getElementById('productName').value = '';
            document.getElementById('productDesc').value = '';
            document.getElementById('productPrice').value = '';
            document.getElementById('productContact').value = '';
            loadProducts();
        } else {
            alert('❌ Xatolik: ' + data.error);
        }
    } catch (error) {
        alert('❌ Server xatosi: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "✅ E'lonni joylash";
    }
}

// ============================================
// FILTER VA QIDIRUV
// ============================================
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    let filtered = [...products];
    
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts(filtered);
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

// ============================================
// EVENT LISTENERLAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    document.getElementById('refreshBtn').addEventListener('click', loadProducts);
    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
});
