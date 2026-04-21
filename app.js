// ============================================
// SUPABASE KONFIGURATSIYASI
// ============================================
// ⚠️ O'ZINGIZNING SUPABASE URL VA ANON KEY NI QO'YING!
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Telegram WebApp
const tg = window.Telegram.WebApp;
let currentUser = null;
let allProducts = [];
let currentFilter = 'all';
let searchQuery = '';
let mediaRecorder = null;
let audioChunks = [];

// ============================================
// FOYDALANUVCHI FUNKSIYALARI
// ============================================

async function getTelegramUser() {
    tg.ready();
    tg.expand();
    
    const user = tg.initDataUnsafe?.user;
    if (user) {
        currentUser = {
            id: String(user.id),
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            username: user.username || '',
            languageCode: user.language_code || 'uz',
            displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User_${user.id}`
        };
        
        // Update UI
        document.getElementById('userName').textContent = currentUser.displayName;
        document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
        
        // Save to Supabase
        await supabase.from('profiles').upsert({
            user_id: currentUser.id,
            full_name: currentUser.displayName,
            updated_at: new Date()
        });
        
        return currentUser;
    }
    return null;
}

// ============================================
// MAHSULOTLAR FUNKSIYALARI
// ============================================

async function loadProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    
    allProducts = data;
    renderProducts();
}

function renderProducts() {
    let filtered = allProducts;
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.category === currentFilter);
    }
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
    
    const container = document.getElementById('productsContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Mahsulot topilmadi</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="product-grid">
            ${filtered.map(product => `
                <div class="product-card" onclick="showProductDetail('${product.id}')">
                    <div class="product-image">
                        ${product.image ? `<img src="${product.image}" alt="${product.name}">` : (product.icon || '📦')}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${escapeHtml(product.category)}</div>
                        <div class="product-name">${escapeHtml(product.name)}</div>
                        <div class="product-price">${formatPrice(product.price)} so'm</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function submitProduct() {
    if (!currentUser) {
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
        'Telefonlar': '📱', 'Mashinalar': '🚗', 'Uy-joy': '🏠',
        'Kiyimlar': '👕', 'Elektronika': '💻', 'Maishiy texnika': '🔧',
        'Hayvonlar': '🐕', 'Boshqa': '📦'
    };
    
    const { data, error } = await supabase.from('products').insert([{
        id: Date.now().toString(),
        user_id: currentUser.id,
        category: category,
        name: name,
        price: parseInt(price),
        description: desc,
        phone: phone,
        image: image,
        icon: categoryIcons[category] || '📦',
        created_at: new Date()
    }]);
    
    if (error) {
        showToast('❌ Xatolik yuz berdi: ' + error.message, 'error');
        return;
    }
    
    showToast('✅ E\'lon muvaffaqiyatli joylandi!', 'success');
    closeAddModal();
    
    // Clear form
    document.getElementById('productCategory').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('productPhone').value = '';
    document.getElementById('productImage').value = '';
    
    await loadProducts();
}

async function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const isOwner = currentUser && product.user_id === currentUser.id;
    
    const modalBody = document.getElementById('detailBody');
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 80px; margin-bottom: 16px;">${product.icon || '📦'}</div>
            <div style="font-size: 28px; font-weight: 700; color: var(--success);">${formatPrice(product.price)} so'm</div>
        </div>
        <div class="info-row"><span class="info-label">📌 Kategoriya</span><span class="info-value">${escapeHtml(product.category)}</span></div>
        <div class="info-row"><span class="info-label">📝 Nomi</span><span class="info-value">${escapeHtml(product.name)}</span></div>
        <div class="info-row"><span class="info-label">📖 Tavsif</span><span class="info-value">${escapeHtml(product.description || '')}</span></div>
        <div class="info-row"><span class="info-label">📅 Sana</span><span class="info-value">${new Date(product.created_at).toLocaleDateString('uz-UZ')}</span></div>
        ${product.phone ? `
            <div class="info-row"><span class="info-label">📞 Telefon</span><span class="info-value">${escapeHtml(product.phone)}</span></div>
            <button class="btn-submit" style="margin-top: 16px; background: var(--success);" onclick="window.location.href='tel:${product.phone}'">📞 Qo'ng'iroq qilish</button>
        ` : ''}
        ${isOwner ? `
            <button class="btn-submit" style="margin-top: 12px; background: var(--danger);" onclick="deleteProduct('${product.id}')">🗑 E'loni o'chirish</button>
        ` : ''}
    `;
    
    document.getElementById('detailModal').style.display = 'flex';
}

async function deleteProduct(productId) {
    if (!confirm("E'lonni o'chirmoqchimisiz?")) return;
    
    const { error } = await supabase.from('products').delete().eq('id', productId);
    
    if (error) {
        showToast('❌ Xatolik: ' + error.message, 'error');
        return;
    }
    
    closeDetailModal();
    await loadProducts();
    showToast('✅ E\'lon o\'chirildi', 'success');
    
    // Refresh my products if on profile page
    if (window.location.pathname.includes('profile.html')) {
        loadMyProducts();
    }
}

// ============================================
// CHAT FUNKSIYALARI
// ============================================

async function loadMessages() {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error loading messages:', error);
        return;
    }
    
    const container = document.getElementById('chatMessages');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>Hozircha xabarlar yo\'q</p></div>';
        return;
    }
    
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    container.innerHTML = data.map(msg => {
        const isSent = currentUser && msg.user_id === currentUser.id;
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                ${!isSent ? `<div class="message-sender">${escapeHtml(msg.sender_name)}</div>` : ''}
                <div class="message-bubble">
                    ${msg.text ? escapeHtml(msg.text) : ''}
                    ${msg.media_url ? `
                        ${msg.media_type === 'audio' ? `<audio src="${msg.media_url}" controls style="width: 200px; margin-top: 8px;"></audio>` : ''}
                        ${msg.media_type === 'video' ? `<video src="${msg.media_url}" controls style="width: 150px; border-radius: 50%; margin-top: 8px;"></video>` : ''}
                    ` : ''}
                </div>
                <div class="message-time">${new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    }).join('');
    
    if (isAtBottom) {
        container.scrollTop = container.scrollHeight;
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text || !currentUser) return;
    
    const { error } = await supabase.from('messages').insert([{
        id: Date.now().toString(),
        user_id: currentUser.id,
        sender_name: currentUser.displayName,
        text: text,
        created_at: new Date()
    }]);
    
    if (error) {
        showToast('❌ Xatolik: ' + error.message, 'error');
        return;
    }
    
    input.value = '';
    input.style.height = 'auto';
    await loadMessages();
    
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

// ============================================
// PROFIL FUNKSIYALARI
// ============================================

async function loadProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = currentUser.displayName;
    document.getElementById('profileAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
    document.getElementById('profileUsername').textContent = currentUser.username ? `@${currentUser.username}` : 'username yo\'q';
    document.getElementById('tgId').textContent = currentUser.id;
    document.getElementById('tgUsername').textContent = currentUser.username || '-';
    
    const { data } = await supabase.from('profiles').select('*').eq('user_id', currentUser.id).single();
    if (data) {
        document.getElementById('fullName').value = data.full_name || currentUser.displayName;
        document.getElementById('phoneNumber').value = data.phone || '';
    }
}

async function saveProfileInfo() {
    if (!currentUser) return;
    
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phoneNumber').value.trim();
    
    const { error } = await supabase.from('profiles').upsert({
        user_id: currentUser.id,
        full_name: fullName,
        phone: phone,
        updated_at: new Date()
    });
    
    if (error) {
        showToast('❌ Xatolik: ' + error.message, 'error');
        return;
    }
    
    currentUser.displayName = fullName;
    showToast('✅ Ma\'lumotlar saqlandi!', 'success');
}

async function loadMyProducts() {
    if (!currentUser) return;
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading my products:', error);
        return;
    }
    
    const container = document.getElementById('myProductsList');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>Sizning e\'lonlaringiz yo\'q</p></div>';
        return;
    }
    
    container.innerHTML = data.map(p => `
        <div class="product-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-input); border-radius: 12px; margin-bottom: 10px;">
            <div style="font-size: 32px;">${p.icon || '📦'}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600;">${escapeHtml(p.name)}</div>
                <div style="color: var(--success);">${formatPrice(p.price)} so'm</div>
            </div>
            <button class="delete-btn" onclick="deleteProduct('${p.id}')" style="background: none; border: none; color: var(--danger); font-size: 20px; cursor: pointer;">🗑️</button>
        </div>
    `).join('');
}

// ============================================
// OVOZLI XABAR
// ============================================

async function toggleRecording() {
    const btn = document.getElementById('recordBtn');
    
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        btn.classList.remove('recording');
        btn.textContent = '🎤';
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (currentUser) {
                await supabase.from('messages').insert([{
                    id: Date.now().toString(),
                    user_id: currentUser.id,
                    sender_name: currentUser.displayName,
                    text: '🎵 Ovozli xabar',
                    media_url: audioUrl,
                    media_type: 'audio',
                    created_at: new Date()
                }]);
                await loadMessages();
            }
            
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        btn.classList.add('recording');
        btn.textContent = '⏹️';
        
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                btn.classList.remove('recording');
                btn.textContent = '🎤';
            }
        }, 30000);
        
    } catch (error) {
        console.error('Microphone error:', error);
        showToast('❌ Mikrofonga ruxsat berilmagan', 'error');
    }
}

// ============================================
// HELPER FUNKSIYALAR
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
    setTimeout(() => toast.remove(), 3000);
}

function filterByCategory(category) {
    currentFilter = category;
    renderProducts();
}

function filterProducts(query) {
    searchQuery = query;
    renderProducts();
}

function closeAddModal() {
    document.getElementById('addModal').style.display = 'none';
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function autoResizeTextarea() {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

function subscribeToRealtime() {
    // Products realtime
    supabase.channel('products_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            loadProducts();
        })
        .subscribe();
    
    // Messages realtime
    supabase.channel('messages_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
            loadMessages();
        })
        .subscribe();
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await getTelegramUser();
    await loadProducts();
    subscribeToRealtime();
    
    // Category buttons
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterByCategory(btn.dataset.cat);
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
    }
    
    // Chat input
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('input', autoResizeTextarea);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Add product buttons
    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) addBtn.onclick = (e) => { e.preventDefault(); document.getElementById('addModal').style.display = 'flex'; };
    
    const addBtn2 = document.getElementById('addProductBtn2');
    if (addBtn2) addBtn2.onclick = (e) => { e.preventDefault(); document.getElementById('addModal').style.display = 'flex'; };
    
    const addBtn3 = document.getElementById('addProductBtn3');
    if (addBtn3) addBtn3.onclick = (e) => { e.preventDefault(); document.getElementById('addModal').style.display = 'flex'; };
    
    // Load profile data if on profile page
    if (window.location.pathname.includes('profile.html')) {
        await loadProfile();
        await loadMyProducts();
    }
    
    // Load messages if on chat page
    if (window.location.pathname.includes('chat.html')) {
        await loadMessages();
        setInterval(loadMessages, 3000);
    }
    
    // Close modals when clicking outside
    window.onclick = (event) => {
        const addModal = document.getElementById('addModal');
        const detailModal = document.getElementById('detailModal');
        if (event.target === addModal) closeAddModal();
        if (event.target === detailModal) closeDetailModal();
    };
});
