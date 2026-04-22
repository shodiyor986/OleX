// API endpoint (Python backend sizning servernizda ishlaydi)
// GitHub Pages dan foydalansangiz, backend alohida hostingda (Render, Railway, PythonAnywhere) bo‘lishi kerak
const API_BASE = "https://your-python-backend.onrender.com"; // ← O‘z backend URLingizni qo‘ying

let products = [];

// Mahsulotlarni yuklash
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/get_products`);
        const data = await res.json();
        products = data.products || [];
        renderProducts(products);
    } catch (err) {
        console.error("Yuklashda xato:", err);
        document.getElementById("productsList").innerHTML = `<div class="loading">❌ Server bilan bog‘lanishda xatolik</div>`;
    }
}

// Mahsulotlarni ko‘rsatish
function renderProducts(items) {
    const container = document.getElementById("productsList");
    if (!items.length) {
        container.innerHTML = `<div class="loading">📭 Hech qanday mahsulot topilmadi</div>`;
        return;
    }

    container.innerHTML = items.map(p => `
        <div class="product-card">
            <div class="product-image">${getCategoryIcon(p.category)}</div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <div class="product-name">${escapeHtml(p.name)}</div>
                <div class="product-desc">${escapeHtml(p.description)}</div>
                <div class="product-price">${formatPrice(p.price)} so‘m</div>
                <div class="product-contact">📞 ${escapeHtml(p.contact)}</div>
            </div>
        </div>
    `).join("");
}

function getCategoryIcon(cat) {
    const icons = {
        "elektronika": "📱", "kiyim-kechak": "👕", "uy-joy": "🏠",
        "transport": "🚗", "boshqa": "📦"
    };
    return icons[cat] || "📦";
}

function formatPrice(price) {
    return new Intl.NumberFormat("uz-UZ").format(price);
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Yangi mahsulot qo‘shish
async function addProduct() {
    const name = document.getElementById("productName").value.trim();
    const desc = document.getElementById("productDesc").value.trim();
    const price = document.getElementById("productPrice").value;
    const category = document.getElementById("productCategory").value;
    const contact = document.getElementById("productContact").value.trim();

    if (!name || !desc || !price || !contact) {
        alert("Iltimos, barcha maydonlarni to‘ldiring!");
        return;
    }

    const newProduct = { name, description: desc, price, category, contact };

    try {
        const res = await fetch(`${API_BASE}/add_product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newProduct)
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ Mahsulot qo‘shildi!");
            document.getElementById("productName").value = "";
            document.getElementById("productDesc").value = "";
            document.getElementById("productPrice").value = "";
            document.getElementById("productContact").value = "";
            loadProducts(); // ro‘yxatni yangilash
        } else {
            alert("❌ Xatolik: " + result.error);
        }
    } catch (err) {
        alert("Server xatosi: " + err.message);
    }
}

// Filter va qidiruv
function filterProducts() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const category = document.getElementById("categoryFilter").value;

    let filtered = products;

    if (category !== "all") {
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

// Event listenerlar
document.getElementById("refreshBtn").addEventListener("click", loadProducts);
document.getElementById("addProductBtn").addEventListener("click", addProduct);
document.getElementById("searchInput").addEventListener("input", filterProducts);
document.getElementById("categoryFilter").addEventListener("change", filterProducts);

// Dastlabki yuklash
loadProducts();
