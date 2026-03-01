<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OLX Mini | Telegram Web App</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --text-primary: #1a1d1f;
            --text-secondary: #6b7b7a;
            --accent: #27ae60;
            --accent-light: #e8f5e9;
            --border: #eef2f4;
            --radius: 16px;
        }

        body {
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            min-height: 100vh;
            padding-bottom: 70px;
        }

        header {
            background: var(--bg-primary);
            padding: 12px 16px;
            position: sticky;
            top: 0;
            z-index: 100;
            border-bottom: 1px solid var(--border);
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--accent);
            text-align: center;
        }

        .search-wrapper {
            padding: 12px 16px;
        }

        .search-box {
            background: var(--bg-primary);
            border-radius: 24px;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid var(--border);
        }

        .search-box input {
            flex: 1;
            border: none;
            outline: none;
            font-size: 15px;
            padding: 8px 0;
            background: transparent;
        }

        .search-box button {
            background: var(--accent);
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
        }

        .categories {
            padding: 8px 16px;
            display: flex;
            gap: 12px;
            overflow-x: auto;
            scrollbar-width: none;
            margin-bottom: 8px;
        }

        .categories::-webkit-scrollbar {
            display: none;
        }

        .cat-item {
            background: var(--bg-primary);
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            cursor: pointer;
        }

        .cat-item.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        .ads-container {
            padding: 8px 16px;
        }

        .ad-card {
            background: var(--bg-primary);
            border-radius: var(--radius);
            margin-bottom: 12px;
            padding: 12px;
            display: flex;
            gap: 12px;
            border: 1px solid var(--border);
            cursor: pointer;
        }

        .ad-image {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            flex-shrink: 0;
        }

        .ad-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .ad-title {
            font-weight: 600;
            font-size: 16px;
        }

        .ad-price {
            font-weight: 700;
            font-size: 18px;
            color: var(--accent);
        }

        .ad-time {
            font-size: 12px;
            color: var(--text-secondary);
        }

        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--bg-primary);
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 8px 16px 20px;
            border-top: 1px solid var(--border);
            z-index: 1000;
        }

        .nav-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: var(--text-secondary);
            font-size: 11px;
            gap: 4px;
            padding: 8px 16px;
            border-radius: 30px;
            cursor: pointer;
        }

        .nav-btn.active {
            color: var(--accent);
            background: var(--accent-light);
        }

        .nav-icon {
            font-size: 24px;
        }

        .fab {
            position: fixed;
            bottom: 80px;
            right: 16px;
            background: var(--accent);
            color: white;
            width: 56px;
            height: 56px;
            border-radius: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
            border: none;
            cursor: pointer;
            z-index: 99;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            align-items: flex-end;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: var(--bg-primary);
            width: 100%;
            border-radius: 24px 24px 0 0;
            padding: 24px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 6px;
            color: var(--text-secondary);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 14px;
            border: 1px solid var(--border);
            border-radius: 12px;
            font-size: 15px;
            outline: none;
            background: var(--bg-secondary);
        }

        .btn-submit {
            background: var(--accent);
            color: white;
            border: none;
            padding: 16px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            width: 100%;
            cursor: pointer;
        }

        .btn-close {
            background: var(--bg-secondary);
            color: var(--text-primary);
            border: none;
            padding: 16px;
            border-radius: 12px;
            font-weight: 500;
            font-size: 16px;
            width: 100%;
            margin-top: 8px;
            cursor: pointer;
        }

        .profile-header {
            background: linear-gradient(135deg, var(--accent), #2ecc71);
            color: white;
            padding: 32px 16px;
            text-align: center;
        }

        .profile-avatar {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 40px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
        }

        .profile-stats {
            display: flex;
            justify-content: center;
            gap: 32px;
            padding: 20px 16px;
            background: var(--bg-primary);
            margin: 16px;
            border-radius: var(--radius);
            border: 1px solid var(--border);
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: var(--accent);
        }

        .page {
            display: none;
        }

        .page.active {
            display: block;
        }

        .text-center { text-align: center; }
        .p-4 { padding: 16px; }
        .loading { text-align: center; padding: 20px; color: var(--text-secondary); }
    </style>
</head>
<body>
    <!-- HOME PAGE -->
    <div id="homePage" class="page active">
        <header>
            <div class="logo">OLX.uz</div>
        </header>

        <div class="search-wrapper">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Qidirish...">
                <button onclick="searchAds()">Qidirish</button>
            </div>
        </div>

        <div class="categories" id="categories">
            <div class="cat-item active" data-category="all" onclick="filterByCategory('all')">Hammasi</div>
            <div class="cat-item" data-category="mashinalar" onclick="filterByCategory('mashinalar')">Mashinalar</div>
            <div class="cat-item" data-category="uy-joy" onclick="filterByCategory('uy-joy')">Uy-joy</div>
            <div class="cat-item" data-category="telefonlar" onclick="filterByCategory('telefonlar')">Telefonlar</div>
            <div class="cat-item" data-category="elektronika" onclick="filterByCategory('elektronika')">Elekronika</div>
        </div>

        <div class="ads-container" id="adsList"></div>
    </div>

    <!-- POST AD PAGE -->
    <div id="postPage" class="page">
        <header>
            <div class="logo" style="display: flex; align-items: center; gap: 10px;">
                <span onclick="showPage('homePage')" style="font-size: 24px; cursor: pointer;">←</span>
                <span>Yangi e'lon</span>
            </div>
        </header>

        <div class="p-4">
            <form id="adForm">
                <div class="form-group">
                    <label>Kategoriya</label>
                    <select id="category" required>
                        <option value="">Tanlang</option>
                        <option value="mashinalar">Mashinalar</option>
                        <option value="uy-joy">Uy-joy</option>
                        <option value="telefonlar">Telefonlar</option>
                        <option value="elektronika">Elekronika</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Sarlavha</label>
                    <input type="text" id="title" placeholder="Misol: Samsung Galaxy S23" required>
                </div>

                <div class="form-group">
                    <label>Narx (so'm)</label>
                    <input type="number" id="price" placeholder="Masalan: 5000000" required>
                </div>

                <div class="form-group">
                    <label>Telefon raqam</label>
                    <input type="tel" id="phone" placeholder="+998901234567" required>
                </div>

                <div class="form-group">
                    <label>Tavsif</label>
                    <textarea id="description" rows="4" placeholder="Batafsil ma'lumot..."></textarea>
                </div>

                <button type="submit" class="btn-submit">E'lonni joylash</button>
                <button type="button" class="btn-close" onclick="showPage('homePage')">Bekor qilish</button>
            </form>
        </div>
    </div>

    <!-- PROFILE PAGE -->
    <div id="profilePage" class="page">
        <div class="profile-header">
            <div class="profile-avatar">👤</div>
            <div class="profile-name" id="profileName">Foydalanuvchi</div>
            <div class="profile-phone" id="profilePhone"></div>
        </div>

        <div class="profile-stats">
            <div class="stat-item">
                <div class="stat-value" id="totalAds">0</div>
                <div class="stat-label">E'lonlar</div>
            </div>
        </div>

        <div class="p-4">
            <h3 style="margin-bottom: 12px;">Mening e'lonlarim</h3>
            <div id="userAds"></div>
        </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
        <div class="nav-btn active" onclick="showPage('homePage')">
            <span class="nav-icon">🏠</span>
            <span>Home</span>
        </div>
        <div class="nav-btn" onclick="showPage('postPage')">
            <span class="nav-icon">📝</span>
            <span>E'lon</span>
        </div>
        <div class="nav-btn" onclick="showPage('profilePage')">
            <span class="nav-icon">👤</span>
            <span>Profil</span>
        </div>
    </nav>

    <!-- Modal -->
    <div class="modal" id="adModal">
        <div class="modal-content">
            <h3 style="margin-bottom: 16px;" id="modalTitle"></h3>
            <div id="modalBody"></div>
            <button class="btn-close" onclick="closeModal()">Yopish</button>
        </div>
    </div>

    <script>
        // ============= GOOGLE SHEETS URL =============
        // BU YERGA O'ZINGIZNING GOOGLE SHEETS URL INGIZNI QO'YING
        const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

        // ============= GLOBAL O'ZGARUVCHILAR =============
        let allAds = [];
        let currentCategory = 'all';
        let currentUser = {
            id: 'user_' + Date.now(),
            name: 'Mehmon',
            phone: ''
        };

        // Telegram Web App
        let tg = window.Telegram?.WebApp;
        if (tg) {
            tg.expand();
            tg.ready();
            const user = tg.initDataUnsafe?.user;
            if (user) {
                currentUser = {
                    id: user.id.toString(),
                    name: user.first_name + ' ' + (user.last_name || ''),
                    username: user.username
                };
                document.getElementById('profileName').textContent = currentUser.name;
                document.getElementById('profilePhone').textContent = '@' + (user.username || 'foydalanuvchi');
            }
        }

        // ============= SAHIFA ALMASHTIRISH =============
        function showPage(pageId) {
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            
            document.querySelectorAll('.nav-btn').forEach((btn, index) => {
                btn.classList.remove('active');
                if ((pageId === 'homePage' && index === 0) ||
                    (pageId === 'postPage' && index === 1) ||
                    (pageId === 'profilePage' && index === 2)) {
                    btn.classList.add('active');
                }
            });

            if (pageId === 'profilePage') loadUserAds();
        }

        // ============= GOOGLE SHEETS DAN MA'LUMOT OLISH =============
        async function loadAds() {
            const adsList = document.getElementById('adsList');
            adsList.innerHTML = '<div class="loading">⏳ Yuklanmoqda...</div>';
            
            try {
                const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAds`);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    allAds = data;
                } else {
                    allAds = [
                        {id: 1, title: 'iPhone 15 Pro Max', price: 14999000, category: 'telefonlar', description: 'Yangi', time: 'Bugun 14:30', phone: '+998901234567'},
                        {id: 2, title: 'Chevrolet Malibu', price: 320000000, category: 'mashinalar', description: '2023-yil', time: 'Kecha', phone: '+998901234568'},
                        {id: 3, title: '3 xonalik kvartira', price: 450000000, category: 'uy-joy', description: 'Markazda', time: '2 kun oldin', phone: '+998901234569'},
                        {id: 4, title: 'MacBook Pro M3', price: 22500000, category: 'elektronika', description: '16/512', time: 'Bugun 09:15', phone: '+998901234570'}
                    ];
                }
                
                filterAndDisplayAds();
            } catch (error) {
                console.error('Xatolik:', error);
                adsList.innerHTML = '<div class="loading">❌ Xatolik yuz berdi</div>';
            }
        }

        function filterByCategory(category) {
            currentCategory = category;
            document.querySelectorAll('.cat-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.category === category) item.classList.add('active');
            });
            filterAndDisplayAds();
        }

        function searchAds() {
            filterAndDisplayAds();
        }

        function filterAndDisplayAds() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            let filteredAds = allAds;
            
            if (currentCategory !== 'all') {
                filteredAds = filteredAds.filter(ad => ad.category === currentCategory);
            }
            
            if (searchTerm) {
                filteredAds = filteredAds.filter(ad => 
                    ad.title.toLowerCase().includes(searchTerm) || 
                    (ad.description && ad.description.toLowerCase().includes(searchTerm))
                );
            }
            
            displayAds(filteredAds);
        }

        function displayAds(ads) {
            const adsList = document.getElementById('adsList');
            
            if (ads && ads.length > 0) {
                adsList.innerHTML = ads.map(ad => `
                    <div class="ad-card" onclick='showAdDetails(${JSON.stringify(ad).replace(/'/g, "\\'")})'>
                        <div class="ad-image">📷</div>
                        <div class="ad-info">
                            <div class="ad-title">${ad.title}</div>
                            <div class="ad-price">${Number(ad.price).toLocaleString()} so'm</div>
                            <div class="ad-time">⏰ ${ad.time || 'Bugun'}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                adsList.innerHTML = '<div class="text-center p-4">📭 Hozircha e\'lonlar yo\'q</div>';
            }
        }

        document.getElementById('adForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const newAd = {
                id: Date.now(),
                title: document.getElementById('title').value,
                price: parseInt(document.getElementById('price').value),
                category: document.getElementById('category').value,
                phone: document.getElementById('phone').value,
                description: document.getElementById('description').value,
                time: new Date().toLocaleString('uz-UZ'),
                userId: currentUser.id
            };

            try {
                const response = await fetch(`${GOOGLE_SHEETS_URL}?action=addAd`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(newAd)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ E\'lon muvaffaqiyatli qo\'shildi!');
                    allAds.unshift(newAd);
                    showPage('homePage');
                    filterAndDisplayAds();
                    document.getElementById('adForm').reset();
                } else {
                    alert('❌ Xatolik yuz berdi');
                }
            } catch (error) {
                console.error('Xatolik:', error);
                alert('❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
            }
        });

        function showAdDetails(ad) {
            document.getElementById('modalTitle').textContent = ad.title;
            document.getElementById('modalBody').innerHTML = `
                <div>
                    <div style="font-size: 24px; font-weight: 700; color: var(--accent); margin-bottom: 10px;">
                        ${Number(ad.price).toLocaleString()} so'm
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div><strong>Kategoriya:</strong> ${ad.category}</div>
                        <div><strong>Telefon:</strong> <a href="tel:${ad.phone}">${ad.phone || "Ko'rsatilmagan"}</a></div>
                        <div><strong>Vaqt:</strong> ${ad.time}</div>
                    </div>
                    <div>
                        <strong>Tavsif:</strong><br>
                        <p style="margin-top: 5px;">${ad.description || 'Tavsif mavjud emas'}</p>
                    </div>
                </div>
            `;
            document.getElementById('adModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('adModal').classList.remove('active');
        }

        function loadUserAds() {
            const userAds = document.getElementById('userAds');
            const userAdsList = allAds.filter(ad => ad.userId === currentUser.id);
            
            document.getElementById('totalAds').textContent = userAdsList.length;
            
            if (userAdsList.length > 0) {
                userAds.innerHTML = userAdsList.map(ad => `
                    <div class="ad-card" onclick='showAdDetails(${JSON.stringify(ad).replace(/'/g, "\\'")})'>
                        <div class="ad-image">📷</div>
                        <div class="ad-info">
                            <div class="ad-title">${ad.title}</div>
                            <div class="ad-price">${Number(ad.price).toLocaleString()} so'm</div>
                        </div>
                    </div>
                `).join('');
            } else {
                userAds.innerHTML = '<div class="text-center p-4">📭 Sizning e\'lonlaringiz yo\'q</div>';
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadAds();
        });
    </script>
</body>
</html>
