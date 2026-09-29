const navButtons = document.querySelectorAll('.nav-btn');
const panels = document.querySelectorAll('.panel');
const themeToggle = document.getElementById('themeToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileNavBackdrop = document.querySelector('.mobile-nav-backdrop');

function showPanel(target) {
    navButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.target === target));
    panels.forEach((panel) => panel.classList.toggle('active', panel.id === target));
}

function closeMobileNav() {
    document.body.classList.remove('nav-open');
    mobileMenuToggle?.setAttribute('aria-expanded', 'false');
    if (mobileMenuToggle) mobileMenuToggle.textContent = '☰';
}

navButtons.forEach((button) => {
    button.addEventListener('click', () => {
        showPanel(button.dataset.target);
        closeMobileNav();
    });
});

mobileMenuToggle?.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
    mobileMenuToggle.textContent = isOpen ? '×' : '☰';
});

mobileNavBackdrop?.addEventListener('click', closeMobileNav);

window.addEventListener('resize', () => {
    if (window.innerWidth > 640) closeMobileNav();
});

const savedTheme = localStorage.getItem('student-theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('student-theme', isDark ? 'dark' : 'light');
});

function readStorage(key, fallback = []) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value ?? fallback);
    } catch {
        return fallback;
    }
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createElement(tag, text, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(`${dateString}T00:00:00`);
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function daysUntil(dateString) {
    const target = new Date(`${dateString}T23:59:59`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / 86400000);
    return diff;
}

// -------------------- To-do --------------------
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
let todos = readStorage('student-todos');

function saveTodos() {
    saveStorage('student-todos', todos);
}

function renderTodos() {
    todoList.replaceChildren();

    if (!todos.length) {
        todoList.appendChild(createElement('li', 'No tasks yet. Add your first task above.', 'empty-state'));
        return;
    }

    todos.forEach((todo) => {
        const item = createElement('li', undefined, `todo-item ${todo.completed ? 'completed' : ''}`);
        const textWrap = createElement('div', undefined, 'text');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(todo.completed);
        checkbox.setAttribute('aria-label', `Mark ${todo.text} complete`);
        const text = createElement('span', todo.text);
        const deleteBtn = createElement('button', 'Delete');
        deleteBtn.type = 'button';

        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            saveTodos();
            renderTodos();
            updateDashboard();
        });

        deleteBtn.addEventListener('click', () => {
            todos = todos.filter((task) => task.id !== todo.id);
            saveTodos();
            renderTodos();
            updateDashboard();
        });

        textWrap.append(checkbox, text);
        item.append(textWrap, deleteBtn);
        todoList.appendChild(item);
    });
}

todoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    todos.push({ id: Date.now(), text, completed: false });
    saveTodos();
    renderTodos();
    todoForm.reset();
    todoInput.focus();
    updateDashboard();
});

// -------------------- Assignments --------------------
const assignmentForm = document.getElementById('assignmentForm');
const assignmentList = document.getElementById('assignmentList');
let assignments = readStorage('student-assignments');

function saveAssignments() {
    saveStorage('student-assignments', assignments);
}

function renderAssignments() {
    assignmentList.replaceChildren();

    if (!assignments.length) {
        assignmentList.appendChild(createElement('li', 'No assignments yet. Add one to start tracking deadlines.', 'empty-state'));
        return;
    }

    [...assignments].sort((a, b) => a.date.localeCompare(b.date)).forEach((assignment) => {
        const item = createElement('li', undefined, 'assignment-item');
        const left = createElement('div', undefined, 'meta');
        const details = createElement('div');
        const title = createElement('strong', assignment.title);
        const meta = createElement('small', `${assignment.subject} · ${formatDate(assignment.date)}`);
        const right = createElement('div', undefined, 'meta');
        const status = createElement('span', assignment.priority, 'status');
        const deleteBtn = createElement('button', 'Delete');
        deleteBtn.type = 'button';

        const due = daysUntil(assignment.date);
        if (due < 0) status.title = 'Past due';
        else if (due === 0) status.title = 'Due today';
        else status.title = `${due} day${due === 1 ? '' : 's'} remaining`;

        deleteBtn.addEventListener('click', () => {
            assignments = assignments.filter((entry) => entry.id !== assignment.id);
            saveAssignments();
            renderAssignments();
            updateDashboard();
        });

        details.append(title, document.createElement('br'), meta);
        left.appendChild(details);
        right.append(status, deleteBtn);
        item.append(left, right);
        assignmentList.appendChild(item);
    });
}

assignmentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('assignmentTitle').value.trim();
    const subject = document.getElementById('assignmentSubject').value.trim();
    const date = document.getElementById('assignmentDate').value;
    const priority = document.getElementById('assignmentPriority').value;
    if (!title || !subject || !date) return;

    assignments.push({ id: Date.now(), title, subject, date, priority });
    saveAssignments();
    assignmentForm.reset();
    renderAssignments();
    updateDashboard();
});

// -------------------- Pomodoro --------------------
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');
const modeButtons = document.querySelectorAll('.mode-btn');
const pomodoroTotal = document.getElementById('pomodoroTotal');

let totalSeconds = 25 * 60;
let timerId = null;
let isRunning = false;
let currentModeMinutes = 25;
let studySeconds = Number(localStorage.getItem('student-study-seconds') || 0);

function formatDuration(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(totalSeconds);
    pomodoroTotal.textContent = formatDuration(studySeconds);
}

function setTimerMode(minutes) {
    totalSeconds = minutes * 60;
    currentModeMinutes = minutes;
    updateTimerDisplay();
}

function saveStudyTime() {
    localStorage.setItem('student-study-seconds', String(studySeconds));
}

function startTimer() {
    if (isRunning || totalSeconds <= 0) return;
    isRunning = true;

    timerId = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds -= 1;
            if (currentModeMinutes === 25) {
                studySeconds += 1;
                saveStudyTime();
            }
            updateTimerDisplay();
            updateDashboard();
        }

        if (totalSeconds === 0) {
            clearInterval(timerId);
            isRunning = false;
            if (currentModeMinutes === 25) {
                alert('Focus session complete! Great work.');
            }
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    isRunning = false;
}

function resetTimer() {
    clearInterval(timerId);
    isRunning = false;
    setTimerMode(currentModeMinutes);
}

startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);

modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        modeButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
        clearInterval(timerId);
        isRunning = false;
        setTimerMode(Number(button.dataset.mode));
    });
});

// -------------------- Grades --------------------
const calculateBtn = document.getElementById('calculateGrade');
const gradeResult = document.getElementById('gradeResult');
const gradeRing = document.getElementById('gradeRing');
const gradeMessage = document.getElementById('gradeMessage');
const gradeList = document.getElementById('gradeList');
let grades = readStorage('student-grades');

function saveGrades() {
    saveStorage('student-grades', grades);
}

function averageGrade() {
    if (!grades.length) return null;
    return grades.reduce((sum, grade) => sum + grade.percent, 0) / grades.length;
}

function renderGrades() {
    gradeList.replaceChildren();
    if (!grades.length) {
        gradeList.appendChild(createElement('li', 'No saved grades yet.', 'empty-state'));
        return;
    }

    grades.forEach((grade) => {
        const item = createElement('li', undefined, 'grade-item');
        const title = createElement('strong', grade.subject || 'Untitled grade');
        const detail = createElement('span', `${grade.obtained}/${grade.total}`);
        const percent = createElement('strong', `${Math.round(grade.percent)}%`, 'grade-percent');
        const deleteBtn = createElement('button', 'Delete');
        deleteBtn.type = 'button';

        deleteBtn.addEventListener('click', () => {
            grades = grades.filter((entry) => entry.id !== grade.id);
            saveGrades();
            renderGrades();
            updateDashboard();
        });

        const info = createElement('div', undefined, 'grade-info');
        info.append(title, detail);
        item.append(info, percent, deleteBtn);
        gradeList.appendChild(item);
    });
}

calculateBtn.addEventListener('click', () => {
    const obtainedInput = document.getElementById('marksObtained');
    const totalInput = document.getElementById('totalMarks');
    const subjectInput = document.getElementById('gradeSubject');
    const obtained = Number(obtainedInput.value);
    const total = Number(totalInput.value);

    gradeMessage.textContent = '';
    gradeMessage.className = 'form-message';

    if (obtained < 0 || total <= 0 || !Number.isFinite(obtained) || !Number.isFinite(total)) {
        gradeMessage.textContent = 'Enter valid marks. Total marks must be greater than 0.';
        gradeMessage.classList.add('error');
        return;
    }

    if (obtained > total) {
        gradeMessage.textContent = 'Obtained marks cannot be greater than total marks.';
        gradeMessage.classList.add('error');
        return;
    }

    const percent = (obtained / total) * 100;
    gradeResult.textContent = `${Math.round(percent)}%`;
    gradeRing.style.setProperty('--grade-percent', `${percent}%`);

    grades.push({
        id: Date.now(),
        subject: subjectInput.value.trim() || 'Untitled grade',
        obtained,
        total,
        percent
    });
    saveGrades();
    renderGrades();
    updateDashboard();
    gradeMessage.textContent = 'Grade calculated and saved.';
    gradeMessage.classList.add('success-message');
    document.getElementById('gradeSubject').value = '';
    obtainedInput.value = '';
    totalInput.value = '';
});

// -------------------- Timetable --------------------
const timetableForm = document.getElementById('timetableForm');
const scheduleBody = document.getElementById('scheduleBody');
const timetableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const defaultTimetable = [
    { id: 1, time: '09:00', day: 'Monday', subject: 'Java', room: '' },
    { id: 2, time: '09:00', day: 'Tuesday', subject: 'Math', room: '' },
    { id: 3, time: '09:00', day: 'Wednesday', subject: 'Design', room: '' },
    { id: 4, time: '09:00', day: 'Thursday', subject: 'DBMS', room: '' },
    { id: 5, time: '09:00', day: 'Friday', subject: 'Java', room: '' },
    { id: 6, time: '11:00', day: 'Monday', subject: 'English', room: '' },
    { id: 7, time: '11:00', day: 'Tuesday', subject: 'Java', room: '' },
    { id: 8, time: '11:00', day: 'Wednesday', subject: 'Math', room: '' },
    { id: 9, time: '11:00', day: 'Thursday', subject: 'Writing', room: '' },
    { id: 10, time: '11:00', day: 'Friday', subject: 'Project', room: '' },
    { id: 11, time: '14:00', day: 'Monday', subject: 'Database', room: '' },
    { id: 12, time: '14:00', day: 'Tuesday', subject: 'Physics', room: '' },
    { id: 13, time: '14:00', day: 'Wednesday', subject: 'Lab', room: '' },
    { id: 14, time: '14:00', day: 'Thursday', subject: 'Revision', room: '' },
    { id: 15, time: '14:00', day: 'Friday', subject: 'Workshop', room: '' }
];
let timetable = readStorage('student-timetable', defaultTimetable);
if (!timetable.length) timetable = defaultTimetable;

function saveTimetable() {
    saveStorage('student-timetable', timetable);
}

function renderTimetable() {
    scheduleBody.replaceChildren();
    const times = [...new Set(timetable.map((entry) => entry.time))].sort();
    if (!times.length) {
        const row = document.createElement('tr');
        const cell = createElement('td', 'No classes scheduled. Add one above.');
        cell.colSpan = 6;
        row.appendChild(cell);
        scheduleBody.appendChild(row);
        return;
    }

    times.forEach((time) => {
        const row = document.createElement('tr');
        row.appendChild(createElement('td', time));
        timetableDays.forEach((day) => {
            const cell = document.createElement('td');
            const entries = timetable.filter((entry) => entry.time === time && entry.day === day);
            entries.forEach((entry) => {
                const block = createElement('div', undefined, 'class-block');
                const subject = createElement('strong', entry.subject);
                const room = entry.room ? createElement('small', entry.room) : null;
                const deleteBtn = createElement('button', '×');
                deleteBtn.type = 'button';
                deleteBtn.title = 'Delete class';
                deleteBtn.addEventListener('click', () => {
                    timetable = timetable.filter((item) => item.id !== entry.id);
                    saveTimetable();
                    renderTimetable();
                });
                const top = createElement('div', undefined, 'class-block-top');
                top.append(subject, deleteBtn);
                block.appendChild(top);
                if (room) block.appendChild(room);
                cell.appendChild(block);
            });
            if (!entries.length) cell.appendChild(createElement('span', '—', 'empty-slot'));
            row.appendChild(cell);
        });
        scheduleBody.appendChild(row);
    });
}

timetableForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const time = document.getElementById('classTime').value;
    const day = document.getElementById('classDay').value;
    const subject = document.getElementById('classSubject').value.trim();
    const room = document.getElementById('classRoom').value.trim();
    if (!time || !day || !subject) return;

    timetable.push({ id: Date.now(), time, day, subject, room });
    saveTimetable();
    timetableForm.reset();
    renderTimetable();
});

// -------------------- Notes --------------------
const notesForm = document.getElementById('notesForm');
const notesList = document.getElementById('notesList');
let notes = readStorage('student-notes');

function saveNotes() {
    saveStorage('student-notes', notes);
}

function renderNotes() {
    notesList.replaceChildren();
    if (!notes.length) {
        notesList.appendChild(createElement('div', 'No notes yet. Save an idea above.', 'empty-state'));
        return;
    }

    notes.forEach((note) => {
        const item = createElement('div', undefined, 'note-item');
        const details = createElement('div', undefined, 'note-details');
        details.append(createElement('strong', note.title), createElement('span', note.text));
        const deleteBtn = createElement('button', 'Delete');
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', () => {
            notes = notes.filter((entry) => entry.id !== note.id);
            saveNotes();
            renderNotes();
        });
        item.append(details, deleteBtn);
        notesList.appendChild(item);
    });
}

notesForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('noteTitle').value.trim();
    const text = document.getElementById('noteText').value.trim();
    if (!title || !text) return;

    notes.push({ id: Date.now(), title, text });
    saveNotes();
    notesForm.reset();
    renderNotes();
});

// -------------------- Dashboard + Statistics --------------------
function updateProgress(id, value) {
    const safeValue = Math.max(0, Math.min(100, value));
    document.getElementById(`${id}Value`).textContent = `${Math.round(safeValue)}%`;
    document.getElementById(`${id}Bar`).style.width = `${safeValue}%`;
}

function updateDashboard() {
    const completedTasks = todos.filter((todo) => todo.completed).length;
    const upcoming = assignments.filter((assignment) => daysUntil(assignment.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
    const dueSoon = upcoming.filter((assignment) => daysUntil(assignment.date) <= 7).length;
    const avg = averageGrade();
    const taskProgress = todos.length ? (completedTasks / todos.length) * 100 : 0;
    const studyTarget = Math.min(100, (studySeconds / (5 * 60 * 60)) * 100);
    const assignmentTracking = assignments.length ? Math.min(100, (upcoming.length / assignments.length) * 100) : 0;

    document.getElementById('dashboardTasks').textContent = String(todos.length);
    document.getElementById('dashboardTasksMeta').textContent = `${completedTasks} completed`;
    document.getElementById('dashboardTasksMeta').className = completedTasks ? 'positive' : '';

    document.getElementById('dashboardAssignments').textContent = String(assignments.length);
    document.getElementById('dashboardAssignmentsMeta').textContent = `${dueSoon} due within 7 days`;
    document.getElementById('dashboardAssignmentsMeta').className = dueSoon ? 'negative' : 'positive';

    document.getElementById('dashboardStudyTime').textContent = formatDuration(studySeconds);
    document.getElementById('dashboardStudyMeta').textContent = 'Tracked focus time';

    document.getElementById('dashboardGrade').textContent = avg === null ? '—' : `${Math.round(avg)}%`;
    document.getElementById('dashboardGradeMeta').textContent = avg === null ? 'Add grades to track' : `${grades.length} grade${grades.length === 1 ? '' : 's'} saved`;

    const taskList = document.getElementById('dashboardTaskList');
    taskList.replaceChildren();
    const dashboardTasks = todos.slice(0, 4);
    if (!dashboardTasks.length) taskList.appendChild(createElement('li', 'No tasks yet. Add tasks from To-Do.', 'empty-state'));
    dashboardTasks.forEach((todo) => {
        const li = createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => {
            todo.completed = checkbox.checked;
            saveTodos();
            renderTodos();
            updateDashboard();
        });
        li.append(checkbox, createElement('span', todo.text));
        taskList.appendChild(li);
    });

    const assignmentListDashboard = document.getElementById('dashboardAssignmentList');
    assignmentListDashboard.replaceChildren();
    const dashboardAssignments = upcoming.slice(0, 4);
    if (!dashboardAssignments.length) assignmentListDashboard.appendChild(createElement('li', 'No upcoming assignments.', 'empty-state'));
    dashboardAssignments.forEach((assignment) => {
        const li = createElement('li');
        li.append(createElement('span', assignment.title), createElement('span', formatDate(assignment.date), `pill ${assignment.priority.toLowerCase()}`));
        assignmentListDashboard.appendChild(li);
    });

    updateProgress('taskProgress', taskProgress);
    updateProgress('studyProgress', studyTarget);
    updateProgress('gradeProgress', avg === null ? 0 : avg);
    updateProgress('assignmentProgress', assignmentTracking);

    const statsSummary = document.getElementById('statsSummary');
    statsSummary.replaceChildren();
    [
        ['Tasks completed', `${completedTasks}/${todos.length || 0}`],
        ['Upcoming assignments', String(upcoming.length)],
        ['Focus time', formatDuration(studySeconds)],
        ['Saved grades', String(grades.length)]
    ].forEach(([label, value]) => {
        const card = createElement('div', undefined, 'summary-chip');
        card.append(createElement('span', label), createElement('strong', value));
        statsSummary.appendChild(card);
    });
}

// -------------------- Search --------------------
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

function getSearchItems() {
    return [
        ...todos.map((item) => ({ type: 'Task', title: item.text, target: 'todo' })),
        ...assignments.map((item) => ({ type: 'Assignment', title: `${item.title} · ${item.subject}`, target: 'assignments' })),
        ...notes.map((item) => ({ type: 'Note', title: `${item.title} · ${item.text}`, target: 'notes' })),
        ...grades.map((item) => ({ type: 'Grade', title: `${item.subject} · ${Math.round(item.percent)}%`, target: 'grades' })),
        ...timetable.map((item) => ({ type: 'Class', title: `${item.subject} · ${item.day} ${item.time}`, target: 'timetable' }))
    ];
}

searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    searchResults.replaceChildren();
    if (!query) {
        searchResults.hidden = true;
        return;
    }

    const matches = getSearchItems().filter((item) => item.title.toLowerCase().includes(query)).slice(0, 8);
    if (!matches.length) {
        searchResults.appendChild(createElement('div', 'No matches found.', 'search-empty'));
    } else {
        matches.forEach((match) => {
            const button = createElement('button', undefined, 'search-result');
            button.type = 'button';
            button.append(createElement('strong', match.type), createElement('span', match.title));
            button.addEventListener('click', () => {
                showPanel(match.target);
                searchInput.value = '';
                searchResults.hidden = true;
            });
            searchResults.appendChild(button);
        });
    }
    searchResults.hidden = false;
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-wrap')) searchResults.hidden = true;
});

// -------------------- Goal plan --------------------
const goalModal = document.getElementById('goalModal');
const viewPlanBtn = document.getElementById('viewPlanBtn');
const closeGoalModal = document.getElementById('closeGoalModal');
const goalForm = document.getElementById('goalForm');
const goalText = document.getElementById('goalText');
const goalSummary = document.getElementById('goalSummary');
const goalPlanList = document.getElementById('goalPlanList');

let goal = localStorage.getItem('student-goal') || 'Finish 3 modules and revise before Friday.';

goalSummary.textContent = goal;
goalText.value = goal;

goalPlanList.appendChild(createElement('p', 'Your current plan is saved in this browser. Update it anytime.'));

viewPlanBtn.addEventListener('click', () => {
    goalModal.hidden = false;
    goalText.focus();
});

function closeGoal() {
    goalModal.hidden = true;
}

closeGoalModal.addEventListener('click', closeGoal);
goalModal.addEventListener('click', (event) => {
    if (event.target === goalModal) closeGoal();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeGoal();
});

goalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = goalText.value.trim();
    if (!value) return;
    goal = value;
    localStorage.setItem('student-goal', goal);
    goalSummary.textContent = goal;
    closeGoal();
});

// Initial render
renderTodos();
renderAssignments();
renderGrades();
renderTimetable();
renderNotes();
updateTimerDisplay();
updateDashboard();
