import os
import sqlite3
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import telebot

base_dir = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=os.path.join(base_dir, 'static'), template_folder=os.path.join(base_dir, 'templates'))

# --- НАСТРОЙКИ TELEGRAM ---
TOKEN = '8650431983:AAFFq1l10xmsqqsYAZGI5i3IoP1VvaPcZzs'
GROUP_ID = '-1003769308325' # Обычно начинается с -100...
bot = telebot.TeleBot(TOKEN)
DB_PATH = os.path.join(base_dir, 'bookings.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            park TEXT, day TEXT, time TEXT, location TEXT, 
            company TEXT, visitors INTEGER, guides INTEGER,
            contact TEXT, payment TEXT, status TEXT,
            feed TEXT, movie TEXT, menu TEXT, capybara TEXT, comment TEXT
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index(): return render_template('index.html')

@app.route('/get_bookings')
def get_bookings():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM bookings')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/book', methods=['POST'])
def book():
    data = request.json
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Проверка интервала 30 минут на этой же локации
        cursor.execute('SELECT time FROM bookings WHERE day=? AND location=? AND park=?', 
                       (data['date'], data['location'], data['park']))
        existing_times = cursor.fetchall()
        new_t = datetime.strptime(data['time'], '%H:%M')
        
        for (t_str,) in existing_times:
            ex_t = datetime.strptime(t_str, '%H:%M')
            if abs((new_t - ex_t).total_seconds() / 60) < 30:
                return jsonify({"status": "error", "message": f"Ошибка! Разница между бронями < 30 мин. (Есть бронь на {t_str})"}), 400

        cursor.execute('''
            INSERT INTO bookings (park, day, time, location, company, visitors, guides, contact, payment, status, feed, movie, menu, capybara, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (data['park'], data['date'], data['time'], data['location'], data['company'], 
              data['visitors'], data['guides'], data['contact'], data['payment'], 'Ожидает',
              data.get('feed',''), data.get('movie',''), data.get('menu',''), data.get('capybara','Нет'), data['comment']))
        
        b_id = cursor.lastrowid
        conn.commit()
        conn.close()

        send_to_telegram(b_id, data, "⏳ НОВАЯ ЗАЯВКА (ОЖИДАЕТ)")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/confirm/<int:booking_id>', methods=['POST'])
def confirm(booking_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('UPDATE bookings SET status="Подтверждено" WHERE id=?', (booking_id,))
    cursor.execute('SELECT * FROM bookings WHERE id=?', (booking_id,))
    b = cursor.fetchone()
    conn.commit()
    conn.close()
    bot.send_message(GROUP_ID, f"✅ *БРОНЬ №{booking_id} ПОДТВЕРЖДЕНА!*\n🏢 Компания: {b[5]}", parse_mode='Markdown')
    return jsonify({"status": "success"})

@app.route('/delete_booking/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM bookings WHERE id=?', (booking_id,))
    conn.commit()
    conn.close()
    bot.send_message(GROUP_ID, f"❌ *БРОНЬ №{booking_id} УДАЛЕНА*", parse_mode='Markdown')
    return jsonify({"status": "success"})

def send_to_telegram(b_id, data, title):
    capy = "✅" if data.get('capybara') == "Да" else "❌"
    msg = (f"{title}\n"
           f"━━━━━━━━━━━━━━━━━━\n"
           f"🆔 *НОМЕР: {b_id}*\n"
           f"🏢 Компания: *{data['company']}*\n"
           f"📍 Локация: {data['location']}\n"
           f"📅 Дата: {data['date']} | ⏰ Время: {data['time']}\n"
           f"👥 Гости: {data['visitors']} + {data['guides']} сопр.\n"
           f"📞 Контакт: {data['contact']}\n"
           f"💳 Оплата: {data['payment']}\n")
    
    if data['location'] == 'Magic Acvarium':
        msg += f"🐠 Корм: {data.get('feed','-')}\n🐹 Капибара: {capy}\n"
    elif data['location'] == 'Cinema':
        msg += f"🎬 Фильм: {data.get('movie','-')}\n"
    elif data['location'] == 'Restoran':
        msg += f"🍴 Меню: {data.get('menu','-')}\n"
        
    msg += f"📝 Коммент: {data['comment']}"
    bot.send_message(GROUP_ID, msg, parse_mode='Markdown')

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)