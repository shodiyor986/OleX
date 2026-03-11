<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OleX | 2026</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }

        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --primary-light: #e0e7ff;
            --secondary: #0ea5e9;
            --dark: #0f172a;
            --light: #f8fafc;
            --gray-100: #f1f5f9;
            --gray-200: #e2e8f0;
            --gray-300: #cbd5e1;
            --gray-400: #94a3b8;
            --gray-500: #64748b;
            --gray-600: #475569;
            --bg-color: #ffffff;
            --text-color: #0f172a;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
            line-height: 1.5;
            padding-bottom: 80px;
        }

        .header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(255,255,255,0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--gray-200);
            padding: 12px 16px;
        }

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 600px;
            margin: 0 auto;
        }

        .logo {
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .icon-btn {
            width: 40px;
            height: 40px;
            border-radius: 9999px;
            background: var(--gray-100);
            border: 1px solid var(--gray-200);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            color: var(--text-color);
        }

        .search-section {
            padding: 16px;
            max-width: 600px;
            margin: 0 auto;
        }

        .search-container {
            background: white;
            border-radius: 24px;
            padding: 4px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            border: 1px solid var(--gray-200);
            display: flex;
            gap: 8px;
        }

        .search-input {
            flex: 1;
            padding: 12px 16px;
            border: none;
            border-radius: 24px;
            font-size: 15px;
            font-family: 'Inter', sans-serif;
            background: transparent;
            outline: none;
            color: var(--text-color);
        }

        .search-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 24px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            white-space: nowrap;
        }

        .categories-section {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 16px;
        }

        .categories-scroll {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            padding-bottom: 8px;
        }

        .categories-scroll::-webkit-scrollbar {
            display: none;
        }

        .category-chip {
            background: white;
            padding: 8px 16px;
            border-radius: 9999px;
            border: 1px solid var(--gray-200);
            font-size: 13px;
            font-weight: 500;
            color: var(--gray-600);
            white-space: nowrap;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .category-chip.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .products-section {
            max-width: 600px;
            margin: 0 auto;
            padding: 16px;
        }

        .products-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .product-card {
            background: white;
            border-radius: 16px;
            padding: 16px;
            border: 1px solid var(--gray-200);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            cursor: pointer;
            transition: transform 0.2s;
        }

        .product-card:active {
            transform: scale(0.98);
        }

        .product-title {
            font-weight: 600;
            font-size: 17px;
            color: var(--text-color);
            margin-bottom: 8px;
        }

        .product-price {
            font-weight: 700;
            font-size: 19px;
            color: var(--primary);
            margin: 8px 0;
        }

        .product-meta {
            display: flex;
            gap: 16px;
            font-size: 11px;
            color: var(--gray-500);
        }

        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(12px);
            border-top: 1px solid var(--gray-200);
            padding: 8px 16px 16px;
            z-index: 100;
        }

        .nav-container {
            max-width: 600px;
            margin: 0 auto;
            display: flex;
            justify-content: space-around;
            align-items: center;
        }

        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 16px;
            border-radius: 9999px;
            cursor: pointer;
            color: var(--gray-500);
            font-size: 11px;
            font-weight: 500;
            flex: 1;
        }

        .nav-item.active {
            color: var(--primary);
            background: var(--primary-light);
        }

        .nav-icon {
            font-size: 24px;
        }

        .fab {
            position: fixed;
            bottom: 100px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            font-size: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 20px rgba(99,102,241,0.4);
            cursor: pointer;
            z-index: 90;
        }

        .modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 200;
            align-items: flex-end;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            width: 100%;
            border-radius: 24px 24px 0 0;
            padding: 24px;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.3s;
            max-width: 600px;
            margin: 0 auto;
        }

        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--gray-600);
        }

        .form-input,
        .form-select,
        .form-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--gray-200);
            border-radius: 12px;
            font-size: 15px;
            font-family: 'Inter', sans-serif;
            background: var(--gray-100);
            outline: none;
            color: var(--text-color);
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
        }

        .btn-primary {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
            margin-bottom: 8px;
        }

        .btn-secondary {
            width: 100%;
            padding: 16px;
            background: var(--gray-200);
            color: var(--gray-600);
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            cursor: pointer;
        }

        .profile-header {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 24px;
            text-align: center;
        }

        .profile-avatar {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 40px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: var(--primary);
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }

        .profile-stats {
            display: flex;
            justify-content: center;
            gap: 24px;
            padding: 16px;
            background: white;
            margin: 16px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 800;
            color: var(--primary);
        }

        .stat-label {
            font-size: 11px;
            color: var(--gray-500);
        }

        .loading {
            text-align: center;
            padding: 32px;
            color: var(--gray-400);
        }

        .empty-state {
            text-align: center;
            padding: 32px;
            color: var(--gray-400);
        }

        .page {
            display: none;
        }

        .page.active {
            display: block;
        }

        .notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 14px;
            z-index: 1000;
            animation: slideDown 0.3s;
            box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }

        @keyframes slideDown {
            from { top: -50px; opacity: 0; }
            to { top: 20px; opacity: 1; }
        }
    </style>
</head>
<body>
    <!-- HOME PAGE -->
    <div id="homePage" class="page active">
        <header class="header">
            <div class="header-content">
                <div class="logo">OLE X</div>
                <div class="icon-btn" onclick="showPage('profilePage')">👤</div>
            </div>
        </header>

        <div class="search-section">
            <div class="search-container">
                <input type="text" class="search-input" id="searchInput" placeholder="Mahsulot qidirish...">
                <button class="search-btn" onclick="searchProducts()">Izlash</button>
            </div>
        </div>

        <div class="categories-section">
            <div class="categories-scroll" id="categoriesList">
                <div class="category-chip active" data-category="all" onclick="filterByCategory('all')">Hammasi</div>
                <div class="category-chip" data-category="Telefonlar" onclick="filterByCategory('Telefonlar')">📱 Telefonlar</div>
                <div class="category-chip" data-category="Mashinalar" onclick="filterByCategory('Mashinalar')">🚗 Mashinalar</div>
                <div class="category-chip" data-category="Uy-joy" onclick="filterByCategory('Uy-joy')">🏠 Uy-joy</div>
                <div class="category-chip" data-category="Elekronika" onclick="filterByCategory('Elekronika')">💻 Elekronika</div>
                <div class="category-chip" data-category="Kiyimlar" onclick="filterByCategory('Kiyimlar')">👕 Kiyimlar</div>
            </div>
        </div>

        <div class="products-section">
            <div class="products-grid" id="productsList"></div>
        </div>
    </div>

    <!-- ADD PRODUCT PAGE -->
    <div id="addPage" class="page">
        <header class="header">
            <div class="header-content">
                <div class="icon-btn" onclick="showPage('homePage')">←</div>
                <div class="logo">Yangi e'lon</div>
                <div style="width: 40px;"></div>
            </div>
        </header>

        <div class="products-section">
            <form id="productForm" onsubmit="addProduct(event)">
                <div class="form-group">
                    <label class="form-label">Kategoriya</label>
                    <select class="form-select" id="turkumi" required>
                        <option value="">Tanlang</option>
                        <option value="Telefonlar">📱 Telefonlar</option>
                        <option value="Mashinalar">🚗 Mashinalar</option>
                        <option value="Uy-joy">🏠 Uy-joy</option>
                        <option value="Elekronika">💻 Elekronika</option>
                        <option value="Kiyimlar">👕 Kiyimlar</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Mahsulot nomi</label>
                    <input type="text" class="form-input" id="nomi" placeholder="Masalan: iPhone 15 Pro Max" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Narx (so'm)</label>
                    <input type="number" class="form-input" id="narxi" placeholder="14999000" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Telefon raqam</label>
                    <input type="tel" class="form-input" id="telefon" placeholder="+998901234567" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Tavsif</label>
                    <textarea class="form-textarea" id="tavsif" rows="4" placeholder="Mahsulot haqida batafsil..."></textarea>
                </div>

                <button type="submit" class="btn-primary">➕ E'lonni joylash</button>
                <button type="button" class="btn-secondary" onclick="showPage('homePage')">Bekor qilish</button>
            </form>
        </div>
    </div>

    <!-- PROFILE PAGE -->
    <div id="profilePage" class="page">
        <div class="profile-header">
            <div class="profile-avatar" id="profileAvatar">👤</div>
            <div class="profile-name" id="profileName">Yuklanmoqda...</div>
            <div class="profile-username" id="profileUsername"></div>
        </div>

        <div class="profile-stats">
            <div class="stat-item">
                <div class="stat-value" id="totalProducts">0</div>
                <div class="stat-label">Mahsulotlar</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="userId"></div>
                <div class="stat-label">ID</div>
            </div>
        </div>

        <!-- Profil formasi -->
        <div style="padding: 16px;">
            <div class="form-group">
                <label class="form-label">F.I.O</label>
                <input type="text" class="form-input" id="fish" placeholder="Aliyev Alisher">
            </div>
            <div class="form-group">
                <label class="form-label">Telefon</label>
                <input type="tel" class="form-input" id="tel" placeholder="+998901234567">
            </div>
            <button class="btn-primary" onclick="saveProfile()">Profilsaqlash</button>
        </div>

        <div class="products-section">
            <h3 style="margin-bottom: 16px; font-size: 18px;">📦 Mening e'lonlarim</h3>
            <div class="products-grid" id="userProducts"></div>
        </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
        <div class="nav-container">
            <div class="nav-item active" onclick="showPage('homePage')">
                <span class="nav-icon">🏠</span>
                <span>Bosh sahifa</span>
            </div>
            <div class="nav-item" onclick="showPage('profilePage')">
                <span class="nav-icon">👤</span>
                <span>Profil</span>
            </div>
        </div>
    </nav>

    <!-- FAB -->
    <button class="fab" onclick="showPage('addPage')">+</button>

    <!-- Modal -->
    <div class="modal" id="productModal">
        <div class="modal-content">
            <h3 style="margin-bottom: 20px; font-size: 20px;" id="modalTitle"></h3>
            <div id="modalBody"></div>
            <button class="btn-secondary" onclick="closeModal()" style="margin-top: 20px;">Yopish</button>
        </div>
    </div>

    <script>
        // API URL - SIZNING APPS SCRIPT URL
        const API_URL = 'https://script.google.com/macros/s/AKfycbyUObDGe6J7sKFJeWU5SLhBbNoRVg0lS9Kug6A9HUHQzMafrOAdgUO_zUlCiSN-b7ksCA/exec';
        
        // State
        let allProducts = [];
        let currentCategory = 'all';
        let currentUser = null;

        // Telegram Web App
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.ready();
            
            // Foydalanuvchi ma'lumotlarini olish
            const user = tg.initDataUnsafe?.user;
            if (user) {
                checkUser(user);
            } else {
                // Test uchun
                checkUser({ username: 'user_' + Math.random().toString(36).substring(7) });
            }
        } else {
            // Test uchun
            checkUser({ username: 'user_' + Math.random().toString(36).substring(7) });
        }

        // Foydalanuvchini tekshirish
        async function checkUser(user) {
            try {
                const username = user.username || 'user_' + Math.random().toString(36).substring(7);
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'checkUser',
                        username: username
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentUser = data.user;
                    document.getElementById('profileName').textContent = data.user.fish || username;
                    document.getElementById('profileUsername').textContent = '@' + username;
                    document.getElementById('userId').textContent = data.user.id;
                    
                    if (data.user.tel) document.getElementById('tel').value = data.user.tel;
                    if (data.user.fish) document.getElementById('fish').value = data.user.fish;
                    
                    loadProducts();
                } else {
                    showNotification('Xatolik: ' + data.error);
                }
            } catch (error) {
                console.error('Check user error:', error);
                showNotification('Serverga ulanishda xatolik');
            }
        }

        // Profilni saqlash
        async function saveProfile() {
            if (!currentUser) return;
            
            const tel = document.getElementById('tel').value;
            const fish = document.getElementById('fish').value;
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'saveProfile',
                        userId: currentUser.id,
                        tel: tel,
                        fish: fish
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification('✅ Profil saqlandi');
                    currentUser.tel = tel;
                    currentUser.fish = fish;
                    document.getElementById('profileName').textContent = fish || currentUser.username;
                } else {
                    showNotification('❌ Xatolik: ' + data.error);
                }
            } catch (error) {
                console.error('Save profile error:', error);
                showNotification('❌ Xatolik yuz berdi');
            }
        }

        // Mahsulotlarni yuklash
        async function loadProducts() {
            const productsList = document.getElementById('productsList');
            productsList.innerHTML = '<div class="loading">⏳ Yuklanmoqda...</div>';
            
            try {
                const response = await fetch(API_URL + '?action=getProducts&userId=all');
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    allProducts = data;
                } else {
                    allProducts = [];
                }
                
                filterAndDisplayProducts();
            } catch (error) {
                console.error('Load products error:', error);
                allProducts = [];
                filterAndDisplayProducts();
                showNotification('Mahsulotlar yuklanmadi');
            }
        }

        // Kategoriya bo'yicha filtrlash
        function filterByCategory(category) {
            currentCategory = category;
            document.querySelectorAll('.category-chip').forEach(chip => {
                chip.classList.remove('active');
                if (chip.dataset.category === category) chip.classList.add('active');
            });
            filterAndDisplayProducts();
        }

        // Qidirish
        function searchProducts() {
            filterAndDisplayProducts();
        }

        // Filtrlash va ko'rsatish
        function filterAndDisplayProducts() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            
            let filtered = [...allProducts];
            
            if (currentCategory !== 'all') {
                filtered = filtered.filter(p => p.turkumi === currentCategory);
            }
            
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    (p.tavsif?.toLowerCase() || '').includes(searchTerm) || 
                    (p.turkumi?.toLowerCase() || '').includes(searchTerm)
                );
            }
            
            displayProducts(filtered);
            
            // Profil sahifasidagi mahsulotlarni yangilash
            if (currentUser) {
                loadUserProducts();
            }
        }

        // Mahsulotlarni ko'rsatish
        function displayProducts(products) {
            const productsList = document.getElementById('productsList');
            
            if (!products || products.length === 0) {
                productsList.innerHTML = '<div class="empty-state">📭 Mahsulotlar yo\'q</div>';
                return;
            }
            
            productsList.innerHTML = products.map(p => {
                const title = p.tavsif?.substring(0, 30) || 'Mahsulot';
                const price = Number(p.narxi) || 0;
                const sana = p.sana || 'Bugun';
                
                return `
                    <div class="product-card" onclick='showProductDetails(${JSON.stringify(p).replace(/'/g, "\\'")})'>
                        <div class="product-title">${title}</div>
                        <div class="product-price">${price.toLocaleString()} so'm</div>
                        <div class="product-meta">
                            <span>📱 ${p.turkumi || 'Boshqa'}</span>
                            <span>⏰ ${sana}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Mahsulot qo'shish
        async function addProduct(event) {
            event.preventDefault();
            
            if (!currentUser) {
                showNotification('❌ Avval ro\'yxatdan o\'ting');
                return;
            }
            
            const newProduct = {
                action: 'addProduct',
                userId: currentUser.id,
                turkumi: document.getElementById('turkumi').value,
                nomi: document.getElementById('nomi').value,
                narxi: parseInt(document.getElementById('narxi').value) || 0,
                telefon: document.getElementById('telefon').value,
                tavsif: document.getElementById('tavsif').value
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProduct)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('✅ Mahsulot qo\'shildi!');
                    document.getElementById('productForm').reset();
                    showPage('homePage');
                    loadProducts();
                } else {
                    showNotification('❌ Xatolik: ' + result.error);
                }
            } catch (error) {
                console.error('Add product error:', error);
                showNotification('❌ Xatolik yuz berdi');
            }
        }

        // Mahsulot detallarini ko'rsatish
        function showProductDetails(product) {
            document.getElementById('modalTitle').textContent = product.tavsif?.substring(0, 30) || 'Mahsulot';
            
            const telefon = product.telefon || 'Ko\'rsatilmagan';
            const narxi = Number(product.narxi) || 0;
            const turkumi = product.turkumi || 'Boshqa';
            const sana = product.sana || 'Bugun';
            const tavsif = product.tavsif || 'Tavsif mavjud emas';
            
            document.getElementById('modalBody').innerHTML = `
                <div>
                    <div style="font-size: 28px; font-weight: 800; color: var(--primary); margin-bottom: 16px;">
                        ${narxi.toLocaleString()} so'm
                    </div>
                    <div style="background: var(--gray-100); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                        <div style="margin-bottom: 8px;"><strong>Kategoriya:</strong> ${turkumi}</div>
                        <div><strong>Vaqt:</strong> ${sana}</div>
                    </div>
                    <div>
                        <strong>Tavsif:</strong>
                        <p style="margin-top: 8px; line-height: 1.6;">${tavsif}</p>
                    </div>
                </div>
            `;
            document.getElementById('productModal').classList.add('active');
        }

        // Foydalanuvchi mahsulotlarini yuklash
        async function loadUserProducts() {
            if (!currentUser) return;
            
            const userProducts = document.getElementById('userProducts');
            
            try {
                const response = await fetch(API_URL + '?action=getProducts&userId=' + currentUser.id);
                const data = await response.json();
                
                const userProductsList = Array.isArray(data) ? data : [];
                
                document.getElementById('totalProducts').textContent = userProductsList.length;
                
                if (userProductsList.length > 0) {
                    userProducts.innerHTML = userProductsList.map(p => {
                        const title = p.tavsif?.substring(0, 30) || 'Mahsulot';
                        const narxi = Number(p.narxi) || 0;
                        
                        return `
                            <div class="product-card" onclick='showProductDetails(${JSON.stringify(p).replace(/'/g, "\\'")})'>
                                <div class="product-title">${title}</div>
                                <div class="product-price">${narxi.toLocaleString()} so'm</div>
                                <div class="product-meta">
                                    <span>📱 ${p.turkumi || 'Boshqa'}</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    userProducts.innerHTML = '<div class="empty-state">📭 Mahsulotlar yo\'q</div>';
                }
            } catch (error) {
                console.error('Load user products error:', error);
                userProducts.innerHTML = '<div class="empty-state">Xatolik yuz berdi</div>';
            }
        }

        // Sahifa almashish
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            document.querySelectorAll('.nav-item').forEach((item, index) => {
                item.classList.remove('active');
                if (pageId === 'homePage' && index === 0) item.classList.add('active');
                if (pageId === 'profilePage' && index === 1) item.classList.add('active');
            });

            if (pageId === 'profilePage' && currentUser) {
                loadUserProducts();
            }
        }

        // Modalni yopish
        function closeModal() {
            document.getElementById('productModal').classList.remove('active');
        }

        // Bildirishnoma
        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    </script>
</body>
</html>
