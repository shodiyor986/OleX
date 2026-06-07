<!DOCTYPE html>
<html lang="uz">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lenta</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: #f0f2f7;
            --card: #ffffff;
            --accent: #4361ee;
            --accent2: #7209b7;
            --text: #1a1a2e;
            --muted: #8a8fa8;
            --border: #e8eaf2;
            --success: #06d6a0;
            --danger: #ef233c;
        }

        body {
            font-family: 'Nunito', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 20px 15px 60px;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 28px;
        }
        .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 2.4rem;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
        }
        .header p {
            color: var(--muted);
            font-size: 0.95rem;
            margin-top: 5px;
        }

        /* Card base */
        .card {
            background: var(--card);
            border-radius: 18px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(67,97,238,0.07);
            border: 1px solid var(--border);
            max-width: 580px;
            margin: 0 auto 22px;
        }

        .card h2 {
            font-size: 1.15rem;
            font-weight: 800;
            margin-bottom: 18px;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Form */
        .field { margin-bottom: 13px; }
        .field label {
            display: block;
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 6px;
        }
        .field input,
        .field textarea {
            width: 100%;
            padding: 12px 15px;
            border: 1.5px solid var(--border);
            border-radius: 12px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.97rem;
            color: var(--text);
            background: #f8f9fe;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }
        .field input:focus,
        .field textarea:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(67,97,238,0.12);
            background: #fff;
        }
        .field textarea {
            resize: vertical;
            min-height: 100px;
        }

        /* Upload zone */
        .upload-zone {
            border: 2px dashed var(--accent);
            border-radius: 12px;
            padding: 22px;
            text-align: center;
            background: linear-gradient(135deg, #f0f4ff, #f8f0ff);
            cursor: pointer;
            transition: all 0.2s;
        }
        .upload-zone:hover {
            background: linear-gradient(135deg, #e0e8ff, #eedeff);
            border-color: var(--accent2);
        }
        .upload-zone .icon { font-size: 2rem; display: block; margin-bottom: 6px; }
        .upload-zone span {
            font-size: 0.92rem;
            font-weight: 700;
            color: var(--accent);
        }
        #rasmInput { display: none; }

        /* Preview */
        .preview-box {
            display: none;
            margin-top: 12px;
            border-radius: 12px;
            overflow: hidden;
            border: 1.5px solid var(--border);
            position: relative;
        }
        .preview-box img {
            width: 100%;
            max-height: 200px;
            object-fit: cover;
            display: block;
        }
        .preview-remove {
            position: absolute;
            top: 8px; right: 8px;
            background: rgba(239,35,60,0.85);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px; height: 28px;
            font-size: 1rem;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold;
            line-height: 1;
        }

        /* Submit button */
        .btn-submit {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            color: white;
            border: none;
            border-radius: 12px;
            font-family: 'Nunito', sans-serif;
            font-size: 1rem;
            font-weight: 800;
            cursor: pointer;
            transition: opacity 0.2s, transform 0.1s;
            margin-top: 6px;
            letter-spacing: 0.02em;
        }
        .btn-submit:hover { opacity: 0.92; transform: translateY(-1px); }
        .btn-submit:active { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* Status message */
        .status-msg {
            text-align: center;
            font-size: 0.9rem;
            font-weight: 700;
            padding: 10px;
            border-radius: 10px;
            margin-top: 12px;
            display: none;
        }
        .status-msg.success { background: #d4f7ef; color: #047a5e; display: block; }
        .status-msg.error   { background: #fde8ec; color: #b0001e; display: block; }

        /* Divider */
        .divider {
            max-width: 580px;
            margin: 0 auto 22px;
            border: none;
            border-top: 1px solid var(--border);
        }

        /* Feed header */
        .feed-header {
            max-width: 580px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .feed-header h3 {
            font-size: 1.1rem;
            font-weight: 800;
            color: var(--text);
        }
        .btn-refresh {
            background: white;
            border: 1.5px solid var(--border);
            color: var(--muted);
            border-radius: 10px;
            padding: 7px 14px;
            font-family: 'Nunito', sans-serif;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex; align-items: center; gap: 5px;
        }
        .btn-refresh:hover {
            border-color: var(--accent);
            color: var(--accent);
            background: #f0f4ff;
        }

        /* Loading skeleton */
        .skeleton {
            background: linear-gradient(90deg, #e8eaf2 25%, #f0f2f7 50%, #e8eaf2 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite;
            border-radius: 10px;
        }
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .skel-name  { height: 16px; width: 40%; margin-bottom: 8px; }
        .skel-time  { height: 11px; width: 25%; margin-bottom: 12px; }
        .skel-text  { height: 13px; width: 90%; margin-bottom: 6px; }
        .skel-text2 { height: 13px; width: 65%; }

        /* Post card */
        .post {
            background: var(--card);
            border-radius: 18px;
            border: 1px solid var(--border);
            padding: 20px;
            box-shadow: 0 3px 14px rgba(67,97,238,0.05);
            max-width: 580px;
            margin: 0 auto 16px;
            animation: fadeIn 0.35s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .post-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .post-avatar {
            width: 40px; height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            display: flex; align-items: center; justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 1rem;
            flex-shrink: 0;
        }
        .post-meta-info {}
        .post-name { font-weight: 800; font-size: 1rem; color: var(--text); }
        .post-time { font-size: 0.78rem; color: var(--muted); margin-top: 1px; }
        .post-body { font-size: 0.97rem; line-height: 1.65; color: var(--text); white-space: pre-wrap; word-break: break-word; }
        .post-img {
            width: 100%;
            border-radius: 12px;
            margin-top: 14px;
            display: block;
            max-height: 400px;
            object-fit: cover;
            border: 1px solid var(--border);
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--muted);
        }
        .empty-state .icon { font-size: 2.5rem; display: block; margin-bottom: 10px; }
        .empty-state p { font-size: 0.95rem; }

        .error-state {
            text-align: center;
            padding: 30px 20px;
            color: var(--danger);
            background: #fde8ec;
            border-radius: 12px;
            max-width: 580px;
            margin: 0 auto;
            font-weight: 700;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>

<div class="header">
    <h1>📰 Lenta</h1>
    <p>Fikringizni baham ko'ring</p>
</div>

<!-- POST YARATISH -->
<div class="card">
    <h2>✏️ Yangi post</h2>
    <div class="field">
        <label>Ismingiz</label>
        <input type="text" id="ism" placeholder="Masalan: Ali Valiyev" maxlength="60">
    </div>
    <div class="field">
        <label>Xabar</label>
        <textarea id="xabar" placeholder="Fikringizni yozing..." maxlength="1000"></textarea>
    </div>
    <div class="field">
        <label>Rasm (ixtiyoriy)</label>
        <div class="upload-zone" onclick="document.getElementById('rasmInput').click()">
            <span class="icon">🖼️</span>
            <span>Rasm tanlash uchun bosing</span>
        </div>
        <input type="file" id="rasmInput" accept="image/*">
        <div class="preview-box" id="previewBox">
            <img id="imagePreview" src="" alt="Ko'rinish">
            <button class="preview-remove" onclick="rasmniOchirish()" title="O'chirish">×</button>
        </div>
    </div>
    <button class="btn-submit" id="yuborishBtn" onclick="postYuborish()">Yuborish 🚀</button>
    <div class="status-msg" id="statusMsg"></div>
</div>

<hr class="divider">

<!-- LENTA -->
<div class="feed-header">
    <h3>🕐 Yangiliklar lentasi</h3>
    <button class="btn-refresh" onclick="yuklashLenta(true)">🔄 Yangilash</button>
</div>
<div id="lenta"></div>

<script>
    // === SOZLAMALAR ===
    const SHEETDB_URL   = 'https://sheetdb.io/api/v1/ismqzmra83a4l';
    const IMGBB_API_KEY = '786b6ed20a17f40a8a6d037aef43fdc7';

    // === RASM TANLASH ===
    document.getElementById('rasmInput').addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('previewBox').style.display = 'block';
        };
        reader.readAsDataURL(file);
    });

    function rasmniOchirish() {
        document.getElementById('rasmInput').value = '';
        document.getElementById('imagePreview').src = '';
        document.getElementById('previewBox').style.display = 'none';
    }

    // === STATUS XABAR ===
    function showStatus(msg, type) {
        const el = document.getElementById('statusMsg');
        el.textContent = msg;
        el.className = 'status-msg ' + type;
        setTimeout(() => { el.className = 'status-msg'; }, 4000);
    }

    // === POST YUBORISH ===
    async function postYuborish() {
        const ism   = document.getElementById('ism').value.trim();
        const xabar = document.getElementById('xabar').value.trim();
        const file  = document.getElementById('rasmInput').files[0];
        const btn   = document.getElementById('yuborishBtn');

        if (!ism)   { showStatus('❗ Ismingizni kiriting!', 'error'); return; }
        if (!xabar) { showStatus('❗ Xabar matnini kiriting!', 'error'); return; }

        btn.disabled  = true;
        btn.textContent = 'Yuklanmoqda...';

        let rasmLink = '';

        try {
            // 1. Agar rasm bo'lsa, ImgBB-ga BASE64 orqali yuklash
            if (file) {
                btn.textContent = 'Rasm yuklanmoqda...';

                // Faylni base64-ga o'girish
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload  = () => {
                        // "data:image/png;base64,XXXX" dan faqat XXXX qismini olish
                        const result = reader.result.split(',')[1];
                        resolve(result);
                    };
                    reader.onerror = () => reject(new Error('Faylni o\'qishda xato'));
                    reader.readAsDataURL(file);
                });

                // FormData bilan base64 string yuborish
                const fd = new FormData();
                fd.append('key',   IMGBB_API_KEY);
                fd.append('image', base64);

                const imgRes = await fetch('https://api.imgbb.com/1/upload', {
                    method: 'POST',
                    body: fd
                });

                if (!imgRes.ok) {
                    throw new Error('ImgBB server xatosi: HTTP ' + imgRes.status);
                }

                const imgData = await imgRes.json();

                if (!imgData.success) {
                    const errMsg = imgData.error?.message || JSON.stringify(imgData);
                    throw new Error('ImgBB: ' + errMsg);
                }
                rasmLink = imgData.data.url;
            }

            // 2. SheetDB-ga yozish
            btn.textContent = 'Ma\'lumot saqlanmoqda...';

            const vaqt = new Date().toLocaleString('uz-UZ', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const body = JSON.stringify({
                data: [{ ism, xabar, rasm_link: rasmLink, vaqt }]
            });

            const res    = await fetch(SHEETDB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            const result = await res.json();

            if (result.created === 1) {
                showStatus('✅ Post muvaffaqiyatli joylashtirildi!', 'success');
                document.getElementById('ism').value   = '';
                document.getElementById('xabar').value = '';
                rasmniOchirish();
                await yuklashLenta(false);
            } else {
                throw new Error('SheetDB saqlamadi. Javob: ' + JSON.stringify(result));
            }

        } catch (err) {
            console.error(err);
            showStatus('❌ Xatolik: ' + err.message, 'error');
        } finally {
            btn.disabled    = false;
            btn.textContent = 'Yuborish 🚀';
        }
    }

    // === LENTA YUKLASH ===
    async function yuklashLenta(showLoader = true) {
        const lenta = document.getElementById('lenta');

        if (showLoader) {
            lenta.innerHTML = [1,2,3].map(() => `
                <div class="post">
                    <div class="post-meta">
                        <div class="post-avatar skeleton" style="background:none;"></div>
                        <div style="flex:1">
                            <div class="skeleton skel-name"></div>
                            <div class="skeleton skel-time"></div>
                        </div>
                    </div>
                    <div class="skeleton skel-text"></div>
                    <div class="skeleton skel-text2"></div>
                </div>
            `).join('');
        }

        try {
            const res  = await fetch(SHEETDB_URL + '?limit=50');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();

            lenta.innerHTML = '';

            if (!Array.isArray(data) || data.length === 0) {
                lenta.innerHTML = `
                    <div class="empty-state">
                        <span class="icon">💬</span>
                        <p>Hozircha xabarlar yo'q. Birinchi bo'ling!</p>
                    </div>`;
                return;
            }

            // Eng yangi postlar yuqorida
            [...data].reverse().forEach(item => {
                const initials = (item.ism || '?').charAt(0).toUpperCase();
                const rasmHTML = item.rasm_link
                    ? `<img class="post-img" src="${escHtml(item.rasm_link)}" alt="Rasm" loading="lazy" onerror="this.style.display='none'">`
                    : '';

                lenta.innerHTML += `
                    <div class="post">
                        <div class="post-meta">
                            <div class="post-avatar">${escHtml(initials)}</div>
                            <div class="post-meta-info">
                                <div class="post-name">${escHtml(item.ism || 'Noma\'lum')}</div>
                                <div class="post-time">🕒 ${escHtml(item.vaqt || '')}</div>
                            </div>
                        </div>
                        <div class="post-body">${escHtml(item.xabar || '')}</div>
                        ${rasmHTML}
                    </div>`;
            });

        } catch (err) {
            console.error(err);
            lenta.innerHTML = `
                <div class="error-state">
                    ⚠️ Lentani yuklashda xatolik yuz berdi.<br>
                    <small>${escHtml(err.message)}</small>
                </div>`;
        }
    }

    // XSS himoya
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Sahifa ochilganda lentani yukla
    window.onload = () => yuklashLenta(true);
</script>
</body>
</html>
