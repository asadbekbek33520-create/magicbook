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
        let dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
        week.push({ full: dateStr, display: `${names[i]}, ${d.getDate()}.${d.getMonth()+1}` });
    }
    return week;
}

function initTable() {
    const thead = document.querySelector('thead tr');
    const tbody = document.getElementById('tableBody');
    const week = getWeekDates();
    
    thead.innerHTML = '<th>Локации</th>';
    week.forEach(day => {
        thead.innerHTML += `<th class="date-th" onclick="openNewBooking('${day.full}')">${day.display}<br><small>+ Добавить</small></th>`;
    });

    tbody.innerHTML = '';
    const objects = currentPark === 'Magic City' ? cityObjects : safariObjects;
    
    objects.forEach(obj => {
        let row = `<tr><td class="obj-name"><b>${obj}</b></td>`;
        week.forEach(day => {
            row += `<td class="slot-container" data-day="${day.full}" data-loc="${obj}"></td>`;
        });
        row += `</tr>`;
        tbody.innerHTML += row;
    });
}

async function loadBookings() {
    const res = await fetch('/get_bookings');
    const data = await res.json();
    initTable();
    data.forEach(b => {
        if (b.park === currentPark) {
            const cell = document.querySelector(`.slot-container[data-day="${b.day}"][data-loc="${b.location}"]`);
            if (cell) {
                const div = document.createElement('div');
                div.className = `card ${b.status === 'Ожидает' ? 'wait' : 'confirm'}`;
                div.innerHTML = `<b>${b.time}</b><br>${b.company}`;
                div.onclick = (e) => { e.stopPropagation(); openEditModal(b); };
                cell.appendChild(div);
            }
        }
    });
}

function openNewBooking(date) {
    editingId = null;
    selectedDate = date;
    resetModal();
    document.getElementById('modalTitle').innerText = `Новая заявка: ${date}`;
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('bookingModal').style.display = 'block';
    fillObjectSelect();
}

function openEditModal(b) {
    editingId = b.id;
    selectedDate = b.day;
    resetModal();
    document.getElementById('modalTitle').innerText = `Бронь №${b.id} (${b.status})`;
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
    toggleExtraFields();

    if(document.getElementById('feed')) document.getElementById('feed').value = b.feed;
    if(document.getElementById('movie')) document.getElementById('movie').value = b.movie;
    if(document.getElementById('menu')) document.getElementById('menu').value = b.menu;
    if(document.getElementById('capybara')) document.getElementById('capybara').checked = (b.capybara === 'Да');

    if (b.status === 'Ожидает') {
        const btn = document.createElement('button');
        btn.className = 'btn-save btn-confirm';
        btn.innerText = 'ПОДТВЕРДИТЬ';
        btn.onclick = async () => { await fetch(`/confirm/${b.id}`, {method:'POST'}); closeModal(); loadBookings(); };
        document.getElementById('modalButtons').prepend(btn);
    }
}

function toggleExtraFields() {
    const obj = document.getElementById('objSelect').value;
    const extra = document.getElementById('extraFields');
    extra.innerHTML = '';
    if (obj === 'Magic Acvarium') {
        extra.innerHTML = `<input type="text" id="feed" placeholder="🐠 Корм">
        <label><input type="checkbox" id="capybara"> 🐹 Капибара</label>`;
    } else if (obj === 'Cinema') {
        extra.innerHTML = `<input type="text" id="movie" placeholder="🎬 Фильм">`;
    } else if (obj === 'Restoran') {
        extra.innerHTML = `<input type="text" id="menu" placeholder="🍴 Меню">`;
    }
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
        comment: document.getElementById('comment').value,
        feed: document.getElementById('feed')?.value || "",
        movie: document.getElementById('movie')?.value || "",
        menu: document.getElementById('menu')?.value || "",
        capybara: document.getElementById('capybara')?.checked ? "Да" : "Нет"
    };

    const res = await fetch('/book', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    
    if (res.ok) { closeModal(); loadBookings(); } 
    else { const err = await res.json(); alert(err.message); }
}

function fillObjectSelect() {
    const s = document.getElementById('objSelect');
    s.innerHTML = '';
    const list = currentPark === 'Magic City' ? cityObjects : safariObjects;
    list.forEach(o => s.innerHTML += `<option value="${o}">${o}</option>`);
    toggleExtraFields();
}

function resetModal() {
    document.getElementById('modalButtons').innerHTML = '<button class="btn-save" onclick="saveBooking()">Сохранить</button>';
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