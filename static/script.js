// Основные настройки объектов
let currentPark = 'Magic City';
let editingId = null;
let selectedDate = "";

const cityObjects = ["Magic Acvarium", "Magic Muzey", "AYA", "Cinema", "Restoran", "FEC"];
const safariObjects = ["Magic Safari Tour", "Safari Photo"];

// Генерация дат текущей недели (Пн-Вс)
function getWeekDates() {
    let now = new Date();
    let dayOfWeek = now.getDay();
    // Находим понедельник текущей недели
    let diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    let startOfWeek = new Date(now.setDate(diff));
    
    let week = [];
    const names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    
    for (let i = 0; i < 7; i++) {
        let d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        
        // Формат DD.MM.YYYY для базы данных
        let day = d.getDate().toString().padStart(2, '0');
        let month = (d.getMonth() + 1).toString().padStart(2, '0');
        let year = d.getFullYear();
        
        let dateStr = `${day}.${month}.${year}`;
        week.push({ 
            full: dateStr, 
            display: `${names[i]}<br>${day}.${month}` 
        });
    }
    return week;
}

// Инициализация таблицы (сетки)
function initTable() {
    const theadRow = document.querySelector('thead tr');
    const tbody = document.getElementById('tableBody');
    const week = getWeekDates();
    
    // Заголовок: Локации + Даты
    theadRow.innerHTML = '<th>Локации</th>';
    week.forEach(day => {
        theadRow.innerHTML += `
            <th class="date-th" onclick="openNewBooking('${day.full}')">
                ${day.display}
                <div class="add-hint">+ Добавить</div>
            </th>`;
    });

    // Строки: Объекты
    tbody.innerHTML = '';
    const objects = currentPark === 'Magic City' ? cityObjects : safariObjects;
    
    objects.forEach(obj => {
        let row = `<tr><td class="obj-name"><span>${obj}</span></td>`;
        week.forEach(day => {
            row += `<td class="slot-container" data-day="${day.full}" data-loc="${obj}"></td>`;
        });
        row += `</tr>`;
        tbody.innerHTML += row;
    });
}

// Загрузка данных с сервера
async function loadBookings() {
    try {
        const res = await fetch('/get_bookings');
        const data = await res.json();
        
        initTable(); // Сначала рисуем пустую сетку

        // Раскладываем карточки броней по ячейкам
        if (data && data.length > 0) {
            data.forEach(b => {
                if (b.park === currentPark) {
                    const cell = document.querySelector(`.slot-container[data-day="${b.day}"][data-loc="${b.location}"]`);
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = `card ${b.status === 'Ожидает' ? 'wait' : 'confirm'}`;
                        div.innerHTML = `<strong>${b.time}</strong><br>${b.company}`;
                        div.onclick = (e) => { 
                            e.stopPropagation(); 
                            openEditModal(b); 
                        };
                        cell.appendChild(div);
                    }
                }
            });
        }
    } catch (err) {
        console.error("Ошибка загрузки:", err);
    }
}

// Открытие модалки для новой записи
function openNewBooking(date) {
    editingId = null;
    selectedDate = date;
    resetForm();
    document.getElementById('modalTitle').innerText = `Новая бронь: ${date}`;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('bookingModal').style.display = 'block';
    fillObjectSelect();
}

// Открытие модалки для редактирования/просмотра
function openEditModal(b) {
    editingId = b.id;
    selectedDate = b.day;
    document.getElementById('modalTitle').innerText = `Бронь №${b.id} (${b.status})`;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('bookingModal').style.display = 'block';
    
    document.getElementById('time').value = b.time;
    document.getElementById('company').value = b.company;
    document.getElementById('visitors').value = b.visitors;
    document
