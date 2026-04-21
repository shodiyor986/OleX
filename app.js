// ============================================
// OLEX MARKET - MAIN APPLICATION
// ============================================

// Global variables
let allProducts = [];
let currentFilter = 'all';
let searchQuery = '';

// ============================================
// PRODUCTS MANAGEMENT
// ============================================

function loadProducts() {
    const stored = localStorage.getItem('olex_products');
    if (stored) {
        allProducts = JSON.parse(stored);
    } else {
        // Sample products
        allProducts = [
            {
                id: '1',
                userId: 'system',
                category: 'Telefonlar',
                name: 'iPhone 15 Pro Max 256GB',
                price: 14500000,
                description: 'Ideal holat, quti bilan. 1 yil kafolat.',
                phone: '+998901234567',
                image: '',
                icon: '📱',
                date: new Date().toISOString()
            },
            {
                id: '2',
                userId: 'system',
                category: 'Mashinalar',
                name: 'Chevrolet Nexia 3 2022',
                price: 120000000,
                description: 'Yurishi 45000 km. To\'liq servis tarixi bor.',
                phone: '+998901234568',
                image: '',
                icon: '🚗',
                date: new Date().toISOString()
            },
            {
                id: '3',
                userId: 'system',
                category: 'Uy-joy',
                name: 'Chilonzor 2 xonali kvartira',
                price: 350000000,
                description: '52 kv.m, ta\'mirlangan, jihozlangan.',
                phone: '+998901234569',
                image: '',
                icon: '🏠',
                date: new Date().toISOString()
            }
        ];
        localStorage.setItem('olex_products', JSON.stringify(allProducts));
    }
    
    renderProducts();
}

function renderProducts() {
    let filtered = allProducts;
    
    // Filter by category
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    // Filter by search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        );
    }
    
    const container = document.getElementById('productsContainer');
    
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
                    <div class="product-image">
                        ${product.image ? `<img src="${product.image}" alt="${product.name}">` : product.icon}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <div class="product-name">${escapeHtml(product.name)}</div>
                        <div class="product-price">${formatPrice(product.price)} so'm</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function filterByCategory(category) {
    currentFilter = category;
    renderProducts();
}

function filterProducts(query) {
    searchQuery = query;
    renderProducts();
}

function submitProduct() {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    
    if (!user) {
        showToast('❌ Iltimos, Telegram orqali kiring!', 'error');
        return;
    }
    
    const category = document.getElementById('productCategory').value;
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value;
    const desc = document.getElementById('productDesc').value.trim();
    const phone = document.getElementById('productPhone').value.trim();
    const image = document.getElementById('productImage').value.trim();
    
    if (!category || !name || !price || !desc || !phone) {
        showToast('⚠️ Barcha majburiy maydonlarni to\'ldiring!', 'error');
        return;
    }
    
    const categoryIcons = {
        'Telefonlar': '📱',
        'Mashinalar': '🚗',
        'Uy-joy': '🏠',
        'Kiyimlar': '👕',
        'Elektronika': '💻',
        'Maishiy texnika': '🔧',
        'Hayvonlar': '🐕',
        'Boshqa': '📦'
    };
    
    const newProduct = {
        id: Date.now().toString(),
        userId: String(user.id),
        category: category,
        name: name,
        price: parseInt(price),
        description: desc,
        phone: phone,
        image: image,
        icon: categoryIcons[category] || '📦',
        date: new Date().toISOString()
    };
    
    allProducts.push(newProduct);
    localStorage.setItem('olex_products', JSON.stringify(allProducts));
    
    showToast('✅ E\'lon muvaffaqiyatli joylandi!', 'success');
    closeAddModal();
    
    // Clear form
    document.getElementById('productCategory').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productPhone').value = '';
    document.getElementById('productImage').value = '';
    
    renderProducts();
}

function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const tg = window.Telegram.WebApp;
    const currentUser = tg.initDataUnsafe?.user;
    const isOwner = currentUser && String(product.userId) === String(currentUser.id);
    
    const modalBody = document.getElementById('detailBody');
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 80px; margin-bottom: 16px;">${product.icon}</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--success);">${formatPrice(product.price)} so'm</div>
        </div>
        
        <div class="info-row">
            <span class="info-label">📌 Kategoriya</span>
            <span class="info-value">${product.category}</span>
        </div>
        
        <div class="info-row">
            <span class="info-label">📝 Nomi</span>
            <span class="info-value">${escapeHtml(product.name)}</span>
        </div>
        
        <div class="info-row">
            <span class="info-label">📖 Tavsif</span>
            <span class="info-value">${escapeHtml(product.description)}</span>
        </div>
        
        <div class="info-row">
            <span class="info-label">📅 Sana</span>
            <span class="info-value">${new Date(product.date).toLocaleDateString('uz-UZ')}</span>
        </div>
        
        ${product.phone ? `
            <div class="info-row">
                <span class="info-label">📞 Telefon</span>
                <span class="info-value">${escapeHtml(product.phone)}</span>
            </div>
            <button class="btn-submit" style="margin-top: 16px; background: var(--success);" onclick="window.location.href='tel:${product.phone}'">
                📞 Qo'ng'iroq qilish
            </button>
        ` : ''}
        
        ${isOwner ? `
            <button class="btn-submit" style="margin-top: 12px; background: var(--danger);" onclick="deleteProductFromDetail('${product.id}')">
                🗑 E'loni o'chirish
            </button>
        ` : ''}
    `;
    
    document.getElementById('detailModal').style.display = 'flex';
}

function deleteProductFromDetail(productId) {
    if (confirm("E'lonni o'chirmoqchimisiz?")) {
        allProducts = allProducts.filter(p => p.id !== productId);
        localStorage.setItem('olex_products', JSON.stringify(allProducts));
        closeDetailModal();
        renderProducts();
        showToast('✅ E\'lon o\'chirildi', 'success');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    
    // Close modals when clicking outside
    window.onclick = (event) => {
        const addModal = document.getElementById('addModal');
        const detailModal = document.getElementById('detailModal');
        
        if (event.target === addModal) {
            closeAddModal();
        }
        if (event.target === detailModal) {
            closeDetailModal();
        }
    };
});