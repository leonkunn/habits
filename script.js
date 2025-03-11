let habits = JSON.parse(localStorage.getItem('habits')) || [];
let user = localStorage.getItem('user');
let currentView = 'week';
const today = new Date();

// Initial setup
if (user) {
    showHabits();
} else {
    document.getElementById('login-screen').style.display = 'block';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username && password) {
        localStorage.setItem('user', username);
        user = username;
        showHabits();
    } else {
        alert('Please enter username and password');
    }
}

function logout() {
    localStorage.removeItem('user');
    user = null;
    document.getElementById('habit-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
}

function showHabits() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('habit-screen').style.display = 'block';
    document.getElementById('frequency').addEventListener('change', (e) => {
        document.getElementById('custom-days').style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    renderHabits();
    renderCalendar();
}

function renderHabits() {
    const habitList = document.getElementById('habit-list');
    habitList.innerHTML = '';
    let streak = calculateStreak();

    habits.forEach((habit, index) => {
        const div = document.createElement('div');
        div.className = 'habit-item';
        const todayKey = today.toDateString();
        div.innerHTML = `${habit.name} (${habit.frequency}) - ${
            habit.completed[todayKey] ? '✅' : '⬜'
        }`;
        
        div.addEventListener('touchstart', handleTouchStart, false);
        div.addEventListener('touchmove', handleTouchMove, false);
        div.addEventListener('touchend', (e) => handleTouchEnd(e, index), false);

        habitList.appendChild(div);
    });

    document.getElementById('streak').textContent = streak;
}

function addHabit() {
    const name = document.getElementById('new-habit').value;
    const frequency = document.getElementById('frequency').value;
    let customDays = [];
    if (frequency === 'custom') {
        customDays = Array.from(document.querySelectorAll('#custom-days input:checked')).map(input => parseInt(input.value));
    }
    if (name) {
        habits.push({ name, frequency, customDays, completed: {} });
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits();
        renderCalendar();
        document.getElementById('new-habit').value = '';
    }
}

// Swipe gesture handling
let xStart = null;
function handleTouchStart(evt) {
    xStart = evt.touches[0].clientX;
}

function handleTouchMove(evt) {
    if (!xStart) return;
}

function handleTouchEnd(evt, index) {
    const xEnd = evt.changedTouches[0].clientX;
    if (xStart && Math.abs(xStart - xEnd) > 50) {
        const todayKey = today.toDateString();
        habits[index].completed[todayKey] = !habits[index].completed[todayKey];
        localStorage.setItem('habits', JSON.stringify(habits));
        renderHabits();
        renderCalendar();
    }
    xStart = null;
}

// Calendar Logic
function showView(view) {
    currentView = view;
    renderCalendar();
}

function renderCalendar() {
    const calendarView = document.getElementById('calendar-view');
    calendarView.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    if (currentView === 'week') {
        grid.className += ' week-grid';
        renderWeek(grid);
    } else if (currentView === 'month') {
        grid.className += ' month-grid';
        renderMonth(grid);
    } else if (currentView === 'year') {
        grid.className += ' year-grid';
        renderYear(grid);
    }

    calendarView.appendChild(grid);
}

function renderWeek(grid) {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start on Sunday
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.textContent = day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        styleDay(dayDiv, day);
        grid.appendChild(dayDiv);
    }
}

function renderMonth(grid) {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstDay = startOfMonth.getDay();

    // Add day labels
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
        const label = document.createElement('div');
        label.textContent = days[i];
        label.style.fontWeight = 'bold';
        grid.appendChild(label);
    }

    // Fill in empty days before the 1st
    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    // Fill in the month
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        const day = new Date(today.getFullYear(), today.getMonth(), i);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        dayDiv.textContent = i;
        styleDay(dayDiv, day);
        grid.appendChild(dayDiv);
    }
}

function renderYear(grid) {
    for (let i = 0; i < 12; i++) {
        const month = new Date(today.getFullYear(), i, 1);
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';
        monthDiv.textContent = month.toLocaleDateString('en-US', { month: 'short' });
        styleMonth(monthDiv, month);
        grid.appendChild(monthDiv);
    }
}

function styleDay(dayDiv, date) {
    const dateKey = date.toDateString();
    const shouldBeDone = habits.some(habit => 
        habit.frequency === 'daily' ||
        (habit.frequency === 'weekly' && date.getDay() === 0) || // Assuming weekly is Sunday
        (habit.frequency === 'custom' && habit.customDays.includes(date.getDay()))
    );
    const allDone = habits.every(habit => 
        !shouldBeDone || (habit.completed[dateKey] && (
            habit.frequency === 'daily' ||
            (habit.frequency === 'weekly' && date.getDay() === 0) ||
            (habit.frequency === 'custom' && habit.customDays.includes(date.getDay()))
        ))
    );

    if (date > today) return; // Future days are neutral
    if (shouldBeDone && allDone) dayDiv.className += ' completed';
    else if (shouldBeDone) dayDiv.className += ' missed';
}

function styleMonth(monthDiv, month) {
    const daysInMonth = new Date(today.getFullYear(), month.getMonth() + 1, 0).getDate();
    let completedDays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(today.getFullYear(), month.getMonth(), i);
        const dateKey = day.toDateString();
        const shouldBeDone = habits.some(habit => 
            habit.frequency === 'daily' ||
            (habit.frequency === 'weekly' && day.getDay() === 0) ||
            (habit.frequency === 'custom' && habit.customDays.includes(day.getDay()))
        );
        if (shouldBeDone && habits.every(h => !h.completed[dateKey] || h.completed[dateKey])) {
            completedDays++;
        }
    }
    if (completedDays === daysInMonth && completedDays > 0) monthDiv.className += ' completed';
    else if (completedDays < daysInMonth && completedDays > 0) monthDiv.style.background = '#ffc107'; // Partial
}

function calculateStreak() {
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
        const dateKey = checkDate.toDateString();
        const shouldBeDone = habits.some(habit => 
            habit.frequency === 'daily' ||
            (habit.frequency === 'weekly' && checkDate.getDay() === 0) ||
            (habit.frequency === 'custom' && habit.customDays.includes(checkDate.getDay()))
        );
        if (!shouldBeDone || habits.every(habit => habit.completed[dateKey])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak - 1; // Exclude today if not completed yet
}

// Refresh on new day
setInterval(() => {
    if (new Date().toDateString() !== today.toDateString()) window.location.reload();
}, 60000);