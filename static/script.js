let currentPark = 'Magic City';
let editingId = null;
let selectedDate = "";

const cityObjects = ["Magic Acvarium", "Magic Muzey", "AYA", "Cinema", "Restoran", "FEC"];
const safariObjects = ["Magic Safari Tour", "Safari Photo"];

function getWeekDates() {
    let now = new Date();
    let dayOfWeek = now.getDay();
    let diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    let startOfWeek = new Date(now.setDate(diff));
    let week = [];
    const names = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    for (let i = 0; i < 7; i++) {
        let d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        let day = d.getDate().toString().padStart(2, '0');
        let month = (d.getMonth() + 1).toString().padStart(2, '0');
        let year = d.getFullYear();
        let dateStr = `${day}.${month}.${year}`;
        week.push({ full: dateStr, display: `${names[i]}<br>${day}.${month}` });
    }
    return week;
}

function initTable() {
    const theadRow = document.querySelector('thead tr');
    const tbody = document.getElementById('tableBody');
    if (!theadRow || !tbody) return;
    const week = getWeekDates();
    theadRow.innerHTML = '<th>Локации</th>';
    week.forEach(day => {
        theadRow.innerHTML += `<th class="date-th" onclick="openNewBooking('${day.full}')">${day.display}<div class="add-hint">+ Добавить</div></th>`;
    });
    tbody.innerHTML = '';
    const objects = currentPark === 'Magic City' ? cityObjects : safariObjects;
    objects.forEach(obj => {
        let row = `<tr><td class="obj-name"><span>${obj}</span></td>`;
        week.forEach(day => { row += `<td class="slot-container" data-day="${day.full}" data-loc="${obj}"></td>`; });
        row += `</tr>`;
        tbody.innerHTML += row;
    });
}

async function loadBookings() {
    try {
        const res = await fetch('/get_bookings');
        const data = await res.json();
        initTable();
        if (data && data.length > 0) {
            data.forEach(b => {
                if (b.park === currentPark) {
                    const cell = document.querySelector(`.slot-container[data-day="${b.day}"][data-loc="${b.location}"]`);
                    if (cell) {
                        const div = document.createElement('div');
                        div.className = `card ${b.status === 'Ожидает' ? 'wait' : 'confirm'}`;
                        div.innerHTML = `<strong>${b.time}</strong><br>${b.company}`;
                        div.onclick = (e) => { e.stopPropagation(); openEditModal(b); };
                        cell.appendChild(div);
                    }
                }
            });
        }
    } catch (err) { console.error("Ошибка загрузки:", err); }
}

function openNewBooking(date) {
    editingId = null;
    selectedDate = date;
    resetForm();
    document.getElementById('modalTitle').innerText = `Новая бронь: ${date}`;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('bookingModal').style.display = 'block';
    fillObjectSelect();
}

function openEditModal(b) {
    editingId = b.id;
    selectedDate = b.day;
    document.getElementById('modalTitle').innerText = `Бронь №${b.id}`;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('time').value = b.time;
    document.getElementById('company').value = b.company;
    document.getElementById('visitors').value = b.visitors;
    document.getElementById('guides').value = b.guides;
    document.getElementById('contact').value = b.contact;
    document.getElementById('payment').value = b.payment;
    document.getElementById('comment').value = b.comment;
    fillObjectSelect();
    document.getElementById('objSelect').value = b.location;
    const footer = document.getElementById('modalButtons');
    footer.innerHTML = `<button class="btn-save" onclick="saveBooking()">Сохранить изменения</button>`;
}

async function saveBooking() {
    const data = {
        park: currentPark, date: selectedDate,
        time: document.getElementById('time').value,
        location: document.getElementById('objSelect').value,
        company: document.getElementById('company').value,
        visitors: document.getElementById('visitors').value,
        guides: document.getElementById('guides').value,
        contact: document.getElementById('contact').value,
        payment: document.getElementById('payment').value,
        comment: document.getElementById('comment').value
    };
    await fetch('/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    closeModal();
    loadBookings();
}

function fillObjectSelect() {
    const s = document.getElementById('objSelect');
    s.innerHTML = '';
    const list = currentPark === 'Magic City' ? cityObjects : safariObjects;
    list.forEach(o => {
        let opt = document.createElement('option');
        opt.value = o; opt.innerText = o;
        s.appendChild(opt);
    });
}

function resetForm() {
    document.querySelectorAll('.modern-input').forEach(i => i.value = "");
    document.getElementById('modalButtons').innerHTML = '<button class="btn-save" onclick="saveBooking()">Забронировать</button>';
}

function closeModal() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('bookingModal').style.display = 'none';
}

function changePark(park, btn) {
    currentPark = park;
    document.querySelectorAll('.park-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadBookings();
}

window.onload = loadBookings;
