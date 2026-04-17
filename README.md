<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OLSGO - Qishloq Bozor</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; margin: 0; padding: 10px; color: #333; }
        .container { max-width: 500px; margin: 0 auto; }
        .header { text-align: center; background: #248bfe; color: white; padding: 15px; border-radius: 0 0 15px 15px; margin-bottom: 20px; }
        
        .card { background: white; border-radius: 12px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .product-img { width: 100%; height: 220px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; }
        
        .price { color: #2ecc71; font-weight: bold; font-size: 1.3em; margin: 5px 0; }
        input, textarea { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 16px; }
        
        .btn-group { display: flex; gap: 10px; margin-bottom: 20px; }
        button { flex: 1; background: #248bfe; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; }
        button:active { transform: scale(0.98); }
        .my-ads-btn { background: #e67e22; }
        
        .call-btn { display: block; text-align: center; background: #2ecc71; color: white; text-decoration: none; padding: 12px; border-radius: 8px; margin-top: 10px; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>OLSGO</h1>
        <p id="welcome">Xush kelibsiz!</p>
    </div>

    <div class="card">
        <h3>Yangi e'lon</h3>
        <input type="text" id="nomi" placeholder="Mahsulot nomi">
        <input type="number" id="narxi" placeholder="Narxi (so'm)">
        <input type="text" id="rasm" placeholder="Rasm linki (URL)">
        <textarea id="tavsif" rows="3" placeholder="Mahsulot haqida tavsif..."></textarea>
        <input type="tel" id="tel" placeholder="Tel: +998901234567">
        <button onclick="elonJoylash()" id="saveBtn">E'lonni joylash</button>
    </div>

    <div class="btn-group">
        <button onclick="yuklash(false)">Barcha e'lonlar</button>
        <button class="my-ads-btn" onclick="yuklash(true)">Mening e'lonlarim</button>
    </div>

    <div id="feed">
        <p style="text-align: center;">Yuklanmoqda...</p>
    </div>

    <div class="footer">OLSGO - Qishloq Savdo Platformasi</div>
</div>

<script>
    // 1. O'ZINGIZNING SHEETDB LINKINGIZNI SHU YERGA QO'YING
    const API_URL = "https://sheetdb.io/api/v1/du3ncea14teen";
    
    // Telegram ma'lumotlarini olish
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    
    // Foydalanuvchi ismini chiqarish
    if (user) {
        document.getElementById('welcome').innerText = `Xush kelibsiz, ${user.first_name}!`;
    }
    
    tg.expand(); // Ilovani kattalashtirish

    // 2. E'LONLARNI YUKLASH FUNKSIYASI
    async function yuklash(faqatMeniki = false) {
        const feed = document.getElementById('feed');
        feed.innerHTML = '<p style="text-align: center;">Ma\'lumotlar yangilanmoqda...</p>';
        
        try {
            let url = API_URL;
            // Agar foydalanuvchi o'z e'lonlarini ko'rmoqchi bo'lsa
            if (faqatMeniki && user) {
                url = `${API_URL}/search?user_id=${user.id}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            feed.innerHTML = '';
            
            if (data.length === 0) {
                feed.innerHTML = '<p style="text-align: center;">Hozircha hech narsa topilmadi.</p>';
                return;
            }

            // Yangi e'lonlar tepada chiqishi uchun teskari tartibda chiqaramiz
            data.reverse().forEach(item => {
                const card = `
                    <div class="card">
                        <img src="${item.rasm_url || 'https://via.placeholder.com/300?text=Rasm+yoq'}" class="product-img">
                        <div class="price">${item.narxi} so'm</div>
                        <h2 style="margin: 5px 0;">${item.nomi}</h2>
                        <p style="font-size: 14px; color: #666;">${item.tavsif || ''}</p>
                        <a href="tel:${item.tel}" class="call-btn">📞 Qo'ng'iroq qilish</a>
                        <div style="font-size: 11px; color: #aaa; margin-top: 10px;">ID: ${item.id}</div>
                    </div>
                `;
                feed.innerHTML += card;
            });
        } catch (error) {
            feed.innerHTML = '<p style="color: red; text-align: center;">Xatolik: Internetni tekshiring.</p>';
        }
    }

    // 3. E'LON JOYLAH FUNKSIYASI
    async function elonJoylash() {
        const nomi = document.getElementById('nomi').value;
        const narxi = document.getElementById('narxi').value;
        const rasm = document.getElementById('rasm').value;
        const tavsif = document.getElementById('tavsif').value;
        const tel = document.getElementById('tel').value;

        if (!nomi || !narxi || !tel) {
            tg.showAlert("Iltimos, asosiy maydonlarni to'ldiring!");
            return;
        }

        const btn = document.getElementById('saveBtn');
        btn.innerText = "Yuborilmoqda...";
        btn.disabled = true;

        const yangiElon = {
            data: [{
                id: Date.now().toString(),
                nomi: nomi,
                narxi: narxi,
                rasm_url: rasm,
                tavsif: tavsif,
                tel: tel,
                user_id: user ? user.id.toString() : "000000"
            }]
        };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(yangiElon)
            });

            if (res.ok) {
                tg.showScanQrPopup({text: "E'lon muvaffaqiyatli saqlandi!"}); // Kichik bildirishnoma
                // Formani tozalash
                document.getElementById('nomi').value = '';
                document.getElementById('narxi').value = '';
                document.getElementById('rasm').value = '';
                document.getElementById('tavsif').value = '';
                
                yuklash(); // Ro'yxatni yangilash
            }
        } catch (e) {
            alert("Xatolik yuz berdi!");
        } finally {
            btn.innerText = "E'lonni joylash";
            btn.disabled = false;
        }
    }

    // Sahifa yuklanganda e'lonlarni ko'rsatish
    window.onload = () => yuklash(false);
</script>

</body>
</html>
