import telebot

# Токен твоего бота от @BotFather
TOKEN = '8650431983:AAFFq1l10xmsqqsYAZGI5i3IoP1VvaPcZzs'
# ID твоей группы (обычно начинается с дефиса, например -100123456789)
GROUP_CHAT_ID = '-1003769308325'

bot = telebot.TeleBot(TOKEN)

def send_booking_notification(data):
    """
    Функция для формирования и отправки сообщения в группу
    """
    message_text = (
        f"✅ *Спасибо! Ваш визит успешно забронирован.*\n\n"
        f"📅 *Дата:* {data['date']}\n"
        f"🕒 *Время:* {data['time']}\n"
        f"📍 *Локация:* {data['location']}\n"
        f"👥 *Посещают:* {data['visitors']} человек и {data['staff']} сопровождающих\n"
        f"🐠 *Корм:* {data['feed']}"
    )
    
    try:
        bot.send_message(GROUP_CHAT_ID, message_text, parse_mode='Markdown')
        print("Сообщение успешно отправлено!")
    except Exception as e:
        print(f"Ошибка при отправке: {e}")

# --- ПРИМЕР ИСПОЛЬЗОВАНИЯ ---
# Эти данные придут из твоей будущей веб-формы
example_booking = {
    "date": "18.03.2026",
    "time": "10:00",
    "location": "Кинотеатр",
    "visitors": 40,
    "staff": 2,
    "feed": "1/2"
}

if __name__ == "__main__":
    send_booking_notification(example_booking)