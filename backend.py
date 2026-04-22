import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ============================================
# KONFIGURATSIYA
# ============================================
SHEET_ID = '17kp71tr4Ac0fY-pW-r_zwj0gXoeQ8Ax_ZHXoFrN-at4'
SHEET_NAME = 'Sheet1'

# ============================================
# GOOGLE SHEETS ULASH
# ============================================
def get_sheet():
    try:
        creds_json = os.environ.get('GOOGLE_CREDENTIALS')
        
        if creds_json:
            creds_dict = json.loads(creds_json)
            scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
        else:
            scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
            creds = ServiceAccountCredentials.from_json_keyfile_name('olex-credentials.json', scope)
        
        client = gspread.authorize(creds)
        sheet = client.open_by_key(SHEET_ID).worksheet(SHEET_NAME)
        return sheet
    except Exception as e:
        print(f"Xato: {e}")
        return None

# ============================================
# MAHSULOTLARNI O'QISH
# ============================================
def get_all_products():
    sheet = get_sheet()
    if not sheet:
        return []
    
    try:
        records = sheet.get_all_records()
        products = []
        
        for idx, row in enumerate(records, start=2):
            if row.get('name') and row.get('status') != 'deleted':
                products.append({
                    'id': idx,
                    'name': str(row.get('name', '')).strip(),
                    'description': str(row.get('description', '')).strip(),
                    'price': float(row.get('price', 0)),
                    'category': str(row.get('category', 'boshqa')).strip().lower(),
                    'contact': str(row.get('contact', '')).strip(),
                    'date_added': str(row.get('date_added', '')),
                    'status': str(row.get('status', 'active'))
                })
        return products
    except Exception as e:
        print(f"O'qish xatosi: {e}")
        return []

# ============================================
# YANGI MAHSULOT QO'SHISH
# ============================================
def add_product_to_sheet(product):
    sheet = get_sheet()
    if not sheet:
        return False
    
    try:
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        new_row = [
            product.get('name', ''),
            product.get('description', ''),
            product.get('price', 0),
            product.get('category', 'boshqa'),
            product.get('contact', ''),
            now,
            'active'
        ]
        sheet.append_row(new_row)
        return True
    except Exception as e:
        print(f"Qo'shish xatosi: {e}")
        return False

# ============================================
# API ENDPOINTLAR
# ============================================
@app.route('/get_products', methods=['GET'])
def get_products():
    try:
        products = get_all_products()
        return jsonify({
            'success': True,
            'products': products,
            'count': len(products)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        data = request.json
        
        required = ['name', 'description', 'price', 'category', 'contact']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'error': f"{field} maydoni to'ldirilishi shart"}), 400
        
        if add_product_to_sheet(data):
            return jsonify({'success': True, 'message': "Mahsulot qo'shildi"})
        else:
            return jsonify({'success': False, 'error': "Google Sheets ga yozishda xatolik"}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    sheet = get_sheet()
    return jsonify({
        'status': 'ok',
        'sheets_connected': sheet is not None,
        'sheet_id': SHEET_ID
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
