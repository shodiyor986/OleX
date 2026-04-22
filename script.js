// ============================================
// OLEX MARKET - Google Sheets orqali
// SIZNING SHEET ID (Google Sheets fayl ID si)
// ============================================
const SHEET_ID = '17kp71tr4Ac0fY-pW-r_zwj0gXoeQ8Ax_ZHXoFrN-at4';
// Sheet nomi (asosiy sahifa nomi)
const SHEET_NAME = 'Sheet1'; // yoki 'Olex', sizning sheetdagi nom

// Google Sheets ni CSV sifatida olish URL i
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;

let products = [];
let isLoading = false;

// ============================================
// MAHSULOTLARNI GOOGLE SHEETS DAN O‘QISH
// ============================================
async function loadProductsFromSheet() {
    if (isLoading) return;
    isLoading = true;
    
    const statusDiv = document.getElementById('connStatus');
    const container = document.getElementById('productsList');
    
    try {
        statusDiv.innerHTML = '🟡 Google Sheets ga ulanish...';
        statusDiv.style.background = '#fff3cd';
        statusDiv.style.color = '#856404';
        
        // Google Sheets dan CSV ma'lumotni olish
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        // CSV ni parse qilish
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
            throw new Error('Sheetda maʼlumotlar topilmadi');
        }
        
        // Birinchi qator sarlavhalar
        const headers = rows[0];
        
        // Mahsulotlarni o‘qish
        products = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 5) continue;
            
            // Sarlavhalarga qarab ma'lumotlarni olish
            const product = {
                id: i,
                name: row[0] || '',
                description: row[1] || '',
                price: parseFloat(row[2]) || 0,
                category: (row[3] || 'boshqa').toLowerCase(),
                contact: row[4] || '',
                date_added: row[5] || '',
                status: row[6] || 'active'
            };
            
            // Faqat active mahsulotlarni ko‘rsatish
            if (product.status !== 'deleted' && product.name) {
                products.push(product);
            }
        }
        
        statusDiv.innerHTML = `✅ ${products.length} ta mahsulot yuklandi (Google Sheets dan)`;
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';
        
        // Mahsulotlarni ko‘rsatish
        renderProducts(products);
        
    } catch (error) {
        console.error('Xatolik:', error);
        statusDiv.innerHTML = `❌ Ulanish xatosi: ${error.message}`;
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        container.innerHTML = `
            <div class="loading">
                ❌ Google Sheets ga ulanishda xatolik<br>
                <small>${error.message}</small><br><br>
                ⚠️ Sabablari:<br>
                1. Sheet fayli "Har kim ko‘rishi mumkin" qilib sozlanmagan<br>
                2. Sheet ID to‘g‘ri emas<br>
                3. Internet aloqasi muammosi<br><br>
                <button onclick="location.reload()" style="padding:8px 20px;margin-top:10px;">🔄 Qayta urinish</button>
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

// ============================================
// CSV PARSE FUNKSIYASI
// ============================================
function parseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            currentRow.push(currentCell.trim());
            if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentCell = '';
            if (char === '\r') i++;
        } else {
            currentCell += char;
        }
    }
    
    // Oxirgi qatorni qo‘shish
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0 && currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
        }
    }
    
    return rows;
}

// ============================================
// MAHSULOTLARNI KO‘RSATISH
// ============================================
function renderProducts(items) {
    const container = document.getElementById('productsList');
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="loading">
                📭 Hech qanday mahsulot topilmadi<br>
                <small>Birinchi e'lonni qo'shish uchun Google Sheets ga ma'lumot qo'shing</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(product => `
        <div class="product-card">
            <div class="product-image">${getCategoryIcon(product.category)}</div>
            <div class="product-info">
                <div class="product-category">${escapeHtml(product.category)}</div>
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-desc">${escapeHtml(product.description)}</div>
                <div class="product-price">${formatPrice(product.price)} so‘m</div>
                <div class="product-contact">📞 ${escapeHtml(product.contact)}</div>
            </div>
        </div>
    `).join('');
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
// YANGI MAHSULOT QO‘SHISH (Google Forms orqali)
// ============================================
function addProductToSheet() {
    // Google Sheets ga yozish uchun Google Forms yoki Apps Script kerak
    // Hozircha browser da to‘g‘ridan-to‘g‘ri yozish imkoniyati cheklangan
    
    const name = document.getElementById('productName').value.trim();
    const desc = document.getElementById('productDesc').value.trim();
    const price = document.getElementById('productPrice').value;
    const category = document.getElementById('productCategory').value;
    const contact = document.getElementById('productContact').value.trim();
    
    if (!name || !desc || !price || !contact) {
        alert('⚠️ Iltimos, barcha maydonlarni to‘ldiring!');
        return;
    }
    
    // Google Forms yaratish kerak yoki Apps Script Web App
    // Vaqtinchalik: Google Sheets ga to‘g‘ridan-to‘g‘ri yozishni ko‘rsatamiz
    
    const newProductData = {
        name: name,
        description: desc,
        price: price,
        category: category,
        contact: contact,
        date: new Date().toLocaleString()
    };
    
    // Ma'lumotni localStorage ga saqlash (vaqtinchalik)
    let pendingProducts = JSON.parse(localStorage.getItem('olex_pending') || '[]');
    pendingProducts.push(newProductData);
    localStorage.setItem('olex_pending', JSON.stringify(pendingProducts));
    
    // Ko‘rsatma
    alert(`✅ Ma'lumot vaqtincha saqlandi!\n\nGoogle Sheets ga qo‘shish uchun:\n1. Google Sheet faylini oching\n2. Quyidagi ma'lumotlarni qo‘shing:\n\nNomi: ${name}\nNarxi: ${price}\nKategoriya: ${category}\nAloqa: ${contact}\n\nYoki administrator bilan bog‘laning.`);
    
    // Formani tozalash
    document.getElementById('productName').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productContact').value = '';
    
    // Yangilash
    loadProductsFromSheet();
}

// ============================================
// EVENT LISTENERLAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Mahsulotlarni yuklash
    loadProductsFromSheet();
    
    // Event listenerlar
    document.getElementById('refreshBtn').addEventListener('click', loadProductsFromSheet);
    document.getElementById('addProductBtn').addEventListener('click', addProductToSheet);
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
});
