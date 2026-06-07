# 🛍️ BozorUZ - Telegram Mini App

BozorUZ - bu Telegram orqali ishlaydigan onlayn bozor ilovasi. Foydalanuvchilar mahsulotlarni sotishi va sotib olishi mumkin.

## 📱 Xususiyatlar

- ✅ Mahsulot qo'shish (rasm bilan)
- 🔍 Mahsulot qidirish va filtrlash
- 👤 Profil yaratish va tahrirlash
- 📞 Sotuvchi bilan bog'lanish (Telefon/Telegram)
- ⏰ 7 kunlik muddat (mahsulotlar avtomatik o'chadi)
- 🎨 Chiroyli va mobil uchun optimallashtirilgan dizayn

## 🛠 Texnologiyalar

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **API:** SheetDB.io, ImgBB
- **Platforma:** Telegram Mini App
- **Ma'lumotlar bazasi:** Google Sheets

## 📋 O'rnatish

### 1. Google Sheets sozlamalari

Google Sheets'da 2 ta varaq yarating:

#### Varaq 1: **Mahsulotlar**
| Ustun nomi | Turi | Izoh |
|------------|------|------|
| id | text | Unikal ID (P + timestamp) |
| user_id | text | Telegram user ID |
| title | text | Mahsulot nomi |
| price | number | Narxi |
| category | text | Kategoriya (electronics, clothes, home, cars, food, other) |
| location | text | Joylashuv |
| description | text | Tavsif |
| phone | text | Telefon raqam |
| img_url | text | Rasm URL (ImgBB) |
| for_sale | text | "true" yoki "false" |
| created_at | text | Yaratilgan vaqt (ISO) |

#### Varaq 2: **Profillar**
| Ustun nomi | Turi | Izoh |
|------------|------|------|
| user_id | text | Telegram user ID |
| username | text | Telegram username |
| ism | text | Ism |
| familya | text | Familiya |
| telefon | text | Telefon |
| shahar | text | Shahar |
| emoji | text | Avatar emoji |
| updated_at | text | Yangilangan vaqt |

### 2. SheetDB API sozlamasi

1. [SheetDB.io](https://sheetdb.io) saytida ro'yxatdan o'ting
2. Google Sheets jadvalingizni ulang
3. API endpoint oling: `https://sheetdb.io/api/v1/YOUR_API_KEY`

### 3. ImgBB API sozlamasi

1. [ImgBB](https://imgbb.com) saytida API kalit oling
2. Saytga kirib, API key ni oling

### 4. Konfiguratsiya

`bek.js` faylidagi quyidagi o'zgaruvchilarni yangilang:

```javascript
const CFG = {
  SHEETDB: 'https://sheetdb.io/api/v1/SIZING_API_KALITINGIZ',
  IMGBB_KEY: 'SIZING_IMGBB_KALITINGIZ',
  EXPIRE_DAYS: 7
};
