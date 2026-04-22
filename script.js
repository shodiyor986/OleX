// ============================================
// OLEX MARKET - Google Sheets orqali
// ============================================

// SIZNING GOOGLE SHEET ID INGIZ
const SHEET_ID = '17kp71tr4Ac0fY-pW-r_zwj0gXoeQ8Ax_ZHXoFrN-at4';

// Google Sheets ni JSON formatida olish URL i
// Buning uchun sheetni "Anyone with link can view" qilib sozlang!
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let products = [];
let isLoading = false;

// ============================================
// MAHSULOTLARNI GOOGLE SHEETS DAN O'QISH
// ============================================
async function loadProducts() {
    if (isLoading) return;
    isLoading = true;
    
    const statusDiv = document.getElementById('connStatus');
    const container = document.getElementById('productsList');
    
    try {
        statusDiv.innerHTML = '🟡 Google Sheets ga ulanish...';
        statusDiv.style.background = '#fff3cd';
        statusDiv.style.color = '#856404';
        
        // Google Sheets dan ma'lumot olish
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        
        // JSON formatini tozalash
        let jsonStr = text;
        jsonStr = jsonStr.replace("/*O_o*/", "");
        jsonStr = jsonStr.replace("google.visualization.Query.setResponse(", "");
        jsonStr = jsonStr.slice(0, -2);
        
        const data = JSON.parse(jsonStr);
        
        // Ma'lumotlarni parse qilish
        const rows = data.table.rows;
        const cols = data.table.cols;
        
        products = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].c;
            
            if (row && row[0] && row[0].v) {
                const product = {
                    id: i,
                    name: row[0] ? row[0].v : '',
                    description: row[1] ? row[1].v : '',
                    price: row[2] ? parseFloat(row[2].v) : 0,
                    category: row[3] ? String(row[3].v).toLowerCase() : 'boshqa',
                    contact: row[4] ? row[4].v : '',
                    date_added: row[5] ? row[5].v : '',
                    status: row[6] ? row[6].v : 'active'
                };
                
                if (product.name && product.status !== 'deleted') {
                    products.push(product);
                }
            }
        }
        
        if (products.length > 0) {
            statusDiv.innerHTML = `✅ ${products.length} ta mahsulot yuklandi`;
            statusDiv.style.background = '#d4edda';
            statusDiv.style.color = '#155724';
            renderProducts(products);
        } else {
            statusDiv.innerHTML = `⚠️ Ma'lumot topilmadi. Iltimos, Google Sheet ni to'ldiring.`;
            statusDiv.style.background = '#fff3cd';
            statusDiv.style.color = '#856404';
            container.innerHTML = `
                <div class="loading">
                    📭 Hozircha mahsulotlar yo'q<br>
                    <small>Birinchi e'loni qo'shing!</small>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Xatolik:', error);
        statusDiv.innerHTML = `❌ Ulanish xatosi: ${error.message}`;
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        container.innerHTML = `
            <div class="loading">
                ❌ Google Sheets ga ulanishda xatolik<br>
                <small>${error.message}</small><br><br>
                <strong>⚠️ Yechim:</strong><br>
                1. Google Sheet faylini oching<br>
                2. "Share" tugmasini bosing<br>
                3. "General access" → "Anyone with the link"<br>
                4. "Viewer" holatiga qo'ying<br>
                5. Quyidagi formatda ma'lumot qo'shing:<br><br>
                <table style="margin:0 auto; font-size:12px; border-collapse:collapse;">
                    <tr style="background:#2c5f8a;color:white;">
                        <th style="padding:5px;">A</th><th style="padding:5px;">B</th><th style="padding:5px;">C</th>
                        <th style="padding:5px;">D</th><th style="padding:5px;">E</th><th style="padding:5px;">F</th>
                    </tr>
                    <tr><td style="padding:5px;">name</td><td>description</td><td>price</td>
                    <td>category</td><td>contact</td><td>date</td></tr>
                </table>
                <br>
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
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
});
