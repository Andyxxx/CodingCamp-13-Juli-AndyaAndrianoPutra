/* ============================================================
   PERSONAL DASHBOARD — app.js
   Features: Greeting, Focus Timer, To-Do List, Quick Links
   Challenges: Dark/Light Mode, Custom Name, Prevent Duplicate Tasks, Sort Tasks, Change Pomodoro Time
   ============================================================ */

// ─── STORAGE HELPERS ─────────────────────────────────────────
const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

// ─── THEME ───────────────────────────────────────────────────
const themeToggleBtn = document.getElementById('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggleBtn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function initTheme() {
  const saved = Storage.get('theme', 'light');
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  Storage.set('theme', next);
});

// ─── DATETIME & GREETING ─────────────────────────────────────
const greetingTextEl = document.getElementById('greeting-text');
const datetimeEl = document.getElementById('datetime');

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function updateDatetime() {
  const now = new Date();
  const name = Storage.get('userName', '');
  const greeting = getGreeting(now.getHours());
  greetingTextEl.textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
  datetimeEl.textContent = `${formatDate(now)} · ${formatTime(now)}`;
}

// ─── CUSTOM NAME ─────────────────────────────────────────────
const greetingNameEl = document.getElementById('greeting-name');
const editNameBtn = document.getElementById('edit-name-btn');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');

function renderGreetingName() {
  const name = Storage.get('userName', '');
  greetingNameEl.textContent = name ? `Hello, ${name}!` : 'Hello, Friend!';
}

editNameBtn.addEventListener('click', () => {
  const name = Storage.get('userName', '');
  nameInput.value = name;
  nameForm.classList.toggle('hidden');
  if (!nameForm.classList.contains('hidden')) nameInput.focus();
});

saveNameBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  Storage.set('userName', name);
  renderGreetingName();
  nameForm.classList.add('hidden');
  updateDatetime();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
  if (e.key === 'Escape') nameForm.classList.add('hidden');
});

// ─── FOCUS TIMER ─────────────────────────────────────────────
const timerDisplay = document.getElementById('timer-display');
const timerStartBtn = document.getElementById('timer-start');
const timerStopBtn = document.getElementById('timer-stop');
const timerResetBtn = document.getElementById('timer-reset');
const timerStatus = document.getElementById('timer-status');
const timerDurationInput = document.getElementById('timer-duration');
const applyDurationBtn = document.getElementById('apply-duration-btn');

let timerDuration = Storage.get('timerDuration', 25); // minutes
let timerSeconds = timerDuration * 60;
let timerInterval = null;
let timerRunning = false;

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimer(timerSeconds);
  timerDurationInput.value = timerDuration;
}

function setTimerState(state) {
  // state: 'idle' | 'running' | 'paused' | 'finished'
  timerDisplay.classList.remove('running', 'finished');
  if (state === 'running') timerDisplay.classList.add('running');
  if (state === 'finished') timerDisplay.classList.add('finished');

  timerStartBtn.disabled = state === 'running' || state === 'finished';
  timerStopBtn.disabled = state === 'idle' || state === 'paused' || state === 'finished';

  const statusMap = {
    idle: '',
    running: '▶ Timer is running...',
    paused: '⏸ Timer paused.',
    finished: '🎉 Focus session complete! Take a break.',
  };
  timerStatus.textContent = statusMap[state] ?? '';
}

function startTimer() {
  if (timerRunning || timerSeconds <= 0) return;
  timerRunning = true;
  setTimerState('running');
  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      setTimerState('finished');
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  setTimerState('paused');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = timerDuration * 60;
  renderTimer();
  setTimerState('idle');
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', stopTimer);
timerResetBtn.addEventListener('click', resetTimer);

applyDurationBtn.addEventListener('click', () => {
  const val = parseInt(timerDurationInput.value, 10);
  if (isNaN(val) || val < 1 || val > 120) return;
  timerDuration = val;
  Storage.set('timerDuration', timerDuration);
  resetTimer();
});

timerDurationInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyDurationBtn.click();
});

// ─── TO-DO LIST ───────────────────────────────────────────────
const todoInput = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const todoList = document.getElementById('todo-list');
const todoError = document.getElementById('todo-error');
const sortSelect = document.getElementById('sort-select');

let todos = Storage.get('todos', []);

function showTodoError(msg) {
  todoError.textContent = msg;
  todoError.classList.remove('hidden');
  setTimeout(() => todoError.classList.add('hidden'), 3000);
}

function saveTodos() {
  Storage.set('todos', todos);
}

function getSortedTodos() {
  const sort = sortSelect.value;
  const copy = [...todos];
  if (sort === 'asc') return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'desc') return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (sort === 'done') return copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy; // default: insertion order
}

function renderTodos() {
  const sorted = getSortedTodos();
  todoList.innerHTML = '';

  if (sorted.length === 0) {
    todoList.innerHTML = '<li class="empty-state">No tasks yet. Add one above!</li>';
    return;
  }

  sorted.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.done ? 'checked' : ''} aria-label="Mark done" />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn-icon todo-edit-btn" title="Edit task">✏️</button>
        <button class="btn-icon todo-delete-btn" title="Delete task">🗑️</button>
      </div>
    `;

    // Toggle done
    li.querySelector('.todo-checkbox').addEventListener('change', (e) => {
      const t = todos.find((x) => x.id === todo.id);
      if (t) { t.done = e.target.checked; saveTodos(); renderTodos(); }
    });

    // Edit
    li.querySelector('.todo-edit-btn').addEventListener('click', () => {
      startEditTodo(li, todo);
    });

    // Delete
    li.querySelector('.todo-delete-btn').addEventListener('click', () => {
      todos = todos.filter((x) => x.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(li);
  });
}

function startEditTodo(li, todo) {
  const textSpan = li.querySelector('.todo-text');
  const actions = li.querySelector('.todo-actions');

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value = todo.text;
  editInput.maxLength = 100;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.style.padding = '4px 10px';
  saveBtn.style.fontSize = '0.8rem';
  saveBtn.textContent = 'Save';

  textSpan.replaceWith(editInput);
  actions.innerHTML = '';
  actions.appendChild(saveBtn);
  editInput.focus();
  editInput.select();

  function commitEdit() {
    const newText = editInput.value.trim();
    if (!newText) return;

    // Prevent duplicate on edit (case-insensitive, skip self)
    const duplicate = todos.find(
      (x) => x.id !== todo.id && x.text.toLowerCase() === newText.toLowerCase()
    );
    if (duplicate) {
      showTodoError('A task with that name already exists.');
      return;
    }

    const t = todos.find((x) => x.id === todo.id);
    if (t) { t.text = newText; saveTodos(); renderTodos(); }
  }

  saveBtn.addEventListener('click', commitEdit);
  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') renderTodos();
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) { showTodoError('Please enter a task.'); return; }

  // Prevent duplicate (challenge)
  const duplicate = todos.find((x) => x.text.toLowerCase() === text.toLowerCase());
  if (duplicate) { showTodoError('This task already exists!'); return; }

  todos.push({ id: Date.now().toString(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
sortSelect.addEventListener('change', renderTodos);

// ─── QUICK LINKS ─────────────────────────────────────────────
const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const linkAddBtn = document.getElementById('link-add-btn');
const linksGrid = document.getElementById('links-grid');
const linksError = document.getElementById('links-error');

let links = Storage.get('quickLinks', []);

function showLinksError(msg) {
  linksError.textContent = msg;
  linksError.classList.remove('hidden');
  setTimeout(() => linksError.classList.add('hidden'), 3000);
}

function saveLinks() {
  Storage.set('quickLinks', links);
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksGrid.innerHTML = '<p class="empty-state">No links yet. Add your favorites above!</p>';
    return;
  }

  links.forEach((link) => {
    const item = document.createElement('div');
    item.className = 'link-item';

    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.title = 'Remove link';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      links = links.filter((x) => x.id !== link.id);
      saveLinks();
      renderLinks();
    });

    item.appendChild(a);
    item.appendChild(delBtn);
    linksGrid.appendChild(item);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  const url = linkUrlInput.value.trim();

  if (!name) { showLinksError('Please enter a label for the link.'); return; }
  if (!url) { showLinksError('Please enter a URL.'); return; }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    showLinksError('Please enter a valid URL (e.g. https://example.com).');
    return;
  }

  links.push({ id: Date.now().toString(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value = '';
  linkNameInput.focus();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkUrlInput.focus(); });

// ─── UTILITY ─────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── INIT ─────────────────────────────────────────────────────
function init() {
  initTheme();
  renderGreetingName();
  updateDatetime();
  setInterval(updateDatetime, 1000);

  timerDuration = Storage.get('timerDuration', 25);
  timerSeconds = timerDuration * 60;
  renderTimer();
  setTimerState('idle');

  renderTodos();
  renderLinks();
}

init();
