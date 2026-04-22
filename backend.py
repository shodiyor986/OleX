import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Frontend so‘rovlariga ruxsat

# ---------- Google Sheets ulanish ----------
# SIZNING Google Sheets maʼlumotlaringiz
SHEET_ID = "17kp71tr4Ac0fY-pW-r_zwj0gXoeQ8Ax_ZHXoFrN-at4"
SHEET_NAME = "Olex"  # Sheet nomi (agar boshqacha bo‘lsa o‘zgartiring)

# 1. Google Cloud console dan olingan JSON kalit faylini yuklang
#    (Service Account yaratib, kalitni json faylga saqlang va uni environment orqali yoki to‘g‘ridan-to‘g‘ri yuklang)
#    Yoki Render / Railway ga environment variable sifatida qo‘ying.
#    Quyidagi qatorda siz o‘z kalitingizni yuklash usulini tanlang.

# 2. Kalitni environment variable dan olish (tavsiya etiladi)
creds_json = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
if creds_json:
    creds_dict = json.loads(creds_json)
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
else:
    # Agar local ishlatilsa, fayldan yuklash
    creds = ServiceAccountCredentials.from_json_keyfile_name("olex-credentials.json", scope)

client = gspread.authorize(creds)
sheet = client.open_by_key(SHEET_ID).worksheet(SHEET_NAME)

# ---------- Yordamchi funksiyalar ----------
def get_all_products():
    """Google Sheets dan barcha mahsulotlarni o‘qish"""
    records = sheet.get_all_records()
    products = []
    for idx, row in enumerate(records, start=2):  # 2-qator (sarlavhadan keyin)
        if row.get("name") and row.get("status") != "deleted":
            products.append({
                "id": idx,
                "name": row.get("name"),
                "description": row.get("description", ""),
                "price": float(row.get("price", 0)),
                "category": row.get("category", "boshqa"),
                "contact": row.get("contact", ""),
                "date_added": row.get("date_added", "")
            })
    return products

def add_product_to_sheet(product):
    """Yangi mahsulotni sheetga qo‘shish"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_row = [
        product["name"],
        product["description"],
        product["price"],
        product["category"],
        product["contact"],
        now,
        "active"  # status
    ]
    sheet.append_row(new_row)
    return True

# ---------- API endpointlar ----------
@app.route("/get_products", methods=["GET"])
def get_products():
    try:
        products = get_all_products()
        return jsonify({"success": True, "products": products})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/add_product", methods=["POST"])
def add_product():
    try:
        data = request.json
        required = ["name", "description", "price", "category", "contact"]
        if not all(k in data for k in required):
            return jsonify({"success": False, "error": "Ma'lumotlar to‘liq emas"}), 400

        add_product_to_sheet(data)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
