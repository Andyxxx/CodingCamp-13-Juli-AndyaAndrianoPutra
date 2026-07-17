/* ============================================================
   New Tab Dashboard — app.js
   ============================================================ */

// ------------------------------------------------------------
// localStorage key constants (all ndt_ prefixed)
// ------------------------------------------------------------
const KEY_THEME             = 'ndt_theme';
const KEY_USER_NAME         = 'ndt_user_name';
const KEY_POMODORO_DURATION = 'ndt_pomodoro_duration';
const KEY_TASKS             = 'ndt_tasks';
const KEY_SORT_MODE         = 'ndt_sort_mode';
const KEY_LINKS             = 'ndt_links';

// ------------------------------------------------------------
// StorageService — safe localStorage wrapper
// ------------------------------------------------------------
const StorageService = (() => {
  let available = true;
  let warnShown = false;
  function checkAvailability() {
    try {
      localStorage.setItem('_ndt_test', '1');
      localStorage.removeItem('_ndt_test');
      available = true;
    } catch (e) {
      available = false;
    }
  }
  function showWarning() {
    if (warnShown) return;
    warnShown = true;
    const el = document.getElementById('storage-warning');
    if (el) el.hidden = false;
  }
  return {
    init() { checkAvailability(); },
    isAvailable() { return available; },
    get(key) {
      try { const v = localStorage.getItem(key); return v === null ? null : JSON.parse(v); }
      catch (e) { return null; }
    },
    set(key, value) {
      if (!available) return;
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (e) { available = false; showWarning(); }
    },
    remove(key) {
      if (!available) return;
      try { localStorage.removeItem(key); } catch (e) {}
    }
  };
})();

// ------------------------------------------------------------
// ThemeController — theme read / write / toggle
// ------------------------------------------------------------
const ThemeController = {
  getCurrent() {
    const t = StorageService.get(KEY_THEME);
    return t === 'dark' ? 'dark' : 'light';
  },
  init() {
    const theme = this.getCurrent();
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(theme === 'dark'));
      btn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
      btn.addEventListener('click', () => this.toggle());
    }
  },
  toggle() {
    const next = this.getCurrent() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    StorageService.set(KEY_THEME, next);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(next === 'dark'));
      btn.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  }
};

// ------------------------------------------------------------
// GreetingWidget — clock, date, greeting, custom name
// ------------------------------------------------------------
const GreetingWidget = {
  _formatTime(h, m, s) {
    return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  },
  _formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  },
  _getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 21) return 'Good Evening';
    return 'Good Night';
  },
  _buildMessage(greeting, name) {
    const n = (name || '').trim();
    return n ? `${greeting}, ${n}` : greeting;
  },
  _tick() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    const greetingEl = document.getElementById('greeting');
    if (clockEl) clockEl.textContent = this._formatTime(now.getHours(), now.getMinutes(), now.getSeconds());
    if (dateEl) dateEl.textContent = this._formatDate(now);
    if (greetingEl) {
      const name = StorageService.get(KEY_USER_NAME);
      greetingEl.textContent = this._buildMessage(this._getGreeting(now.getHours()), name);
    }
  },
  setName(name) {
    const trimmed = (name || '').trim();
    if (trimmed) StorageService.set(KEY_USER_NAME, trimmed);
    else StorageService.remove(KEY_USER_NAME);
    this._tick();
  },
  init() {
    const nameInput = document.getElementById('name-input');
    const savedName = StorageService.get(KEY_USER_NAME);
    if (nameInput && savedName) nameInput.value = savedName;
    const saveBtn = document.getElementById('name-save');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      this.setName(nameInput ? nameInput.value : '');
    });
    if (nameInput) nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.setName(nameInput.value);
    });
    this._tick();
    setInterval(() => this._tick(), 1000);
  }
};

// ------------------------------------------------------------
// TimerModule — Pomodoro state machine
// ------------------------------------------------------------
const TimerModule = (() => {
  const STATE = { STOPPED: 'STOPPED', RUNNING: 'RUNNING', FINISHED: 'FINISHED' };
  let state = STATE.STOPPED;
  let duration = 25;
  let remaining = 25 * 60;
  let intervalId = null;
  let startTime = null;
  let startRemaining = 0;

  function formatTimer(secs) {
    const m = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function render() {
    const display = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const alertEl = document.getElementById('timer-alert');
    if (display) display.textContent = formatTimer(Math.max(0, remaining));
    if (startBtn) startBtn.disabled = state === STATE.RUNNING;
    if (stopBtn) stopBtn.disabled = state !== STATE.RUNNING;
    if (alertEl) alertEl.hidden = state !== STATE.FINISHED;
  }

  function tick() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    remaining = startRemaining - elapsed;
    if (remaining <= 0) {
      remaining = 0;
      state = STATE.FINISHED;
      clearInterval(intervalId);
      intervalId = null;
    }
    render();
  }

  return {
    init() {
      const stored = StorageService.get(KEY_POMODORO_DURATION);
      if (stored !== null && Number.isInteger(stored) && stored >= 1 && stored <= 120) duration = stored;
      remaining = duration * 60;
      state = STATE.STOPPED;
      render();
      document.getElementById('start-btn')?.addEventListener('click', () => this.start());
      document.getElementById('stop-btn')?.addEventListener('click', () => this.stop());
      document.getElementById('reset-btn')?.addEventListener('click', () => this.reset());
      document.getElementById('duration-save')?.addEventListener('click', () => {
        const inp = document.getElementById('duration-input');
        this.setDuration(inp ? inp.value : '');
      });
    },
    start() {
      if (state === STATE.RUNNING) return;
      if (state === STATE.FINISHED) { remaining = duration * 60; }
      startTime = Date.now();
      startRemaining = remaining;
      state = STATE.RUNNING;
      intervalId = setInterval(tick, 1000);
      render();
    },
    stop() {
      if (state !== STATE.RUNNING) return;
      clearInterval(intervalId); intervalId = null;
      state = STATE.STOPPED;
      render();
    },
    reset() {
      clearInterval(intervalId); intervalId = null;
      remaining = duration * 60;
      state = STATE.STOPPED;
      render();
    },
    setDuration(val) {
      const errEl = document.getElementById('duration-error');
      const n = parseInt(val, 10);
      if (!Number.isInteger(n) || n < 1 || n > 120) {
        if (errEl) errEl.textContent = 'Enter a value between 1 and 120 minutes.';
        return;
      }
      if (errEl) errEl.textContent = '';
      duration = n;
      StorageService.set(KEY_POMODORO_DURATION, n);
      const inp = document.getElementById('duration-input');
      if (inp) inp.value = '';
      this.reset();
    }
  };
})();

// ------------------------------------------------------------
// TaskManager — task CRUD, duplicate detection, sorting
// ------------------------------------------------------------
const TaskManager = (() => {
  let tasks = [];
  let sortMode = 'default';

  function normalize(text) { return text.trim().toLowerCase(); }

  function isDuplicate(text, excludeId) {
    const n = normalize(text);
    return tasks.some(t => !t.done && t.id !== excludeId && normalize(t.text) === n);
  }

  function sortTasks(arr, mode) {
    const copy = [...arr];
    if (mode === 'az') return copy.sort((a, b) => a.text.localeCompare(b.text));
    if (mode === 'za') return copy.sort((a, b) => b.text.localeCompare(a.text));
    if (mode === 'completed_last') return copy.sort((a, b) => (a.done - b.done) || (a.createdAt - b.createdAt));
    return copy.sort((a, b) => a.createdAt - b.createdAt);
  }

  function save() { StorageService.set(KEY_TASKS, tasks); }

  function renderList() {
    const ul = document.getElementById('task-list');
    if (!ul) return;
    ul.innerHTML = '';
    sortTasks(tasks, sortMode).forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = task.done;
      cb.setAttribute('aria-label', 'Mark task done');
      cb.addEventListener('change', () => module.toggleComplete(task.id));

      const span = document.createElement('span');
      span.className = 'task-text'; span.textContent = task.text;

      const editInput = document.createElement('input');
      editInput.type = 'text'; editInput.className = 'task-edit-input hidden';
      editInput.value = task.text;

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️'; editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.className = 'btn-icon';
      editBtn.addEventListener('click', () => {
        span.classList.add('hidden'); editInput.classList.remove('hidden');
        editBtn.classList.add('hidden'); confirmBtn.classList.remove('hidden'); cancelBtn.classList.remove('hidden');
        editInput.focus(); editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      });

      const confirmBtn = document.createElement('button');
      confirmBtn.textContent = '✓'; confirmBtn.setAttribute('aria-label', 'Confirm edit');
      confirmBtn.className = 'btn-icon hidden';
      confirmBtn.addEventListener('click', () => module.editTask(task.id, editInput.value));

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '✕'; cancelBtn.setAttribute('aria-label', 'Cancel edit');
      cancelBtn.className = 'btn-icon hidden';
      cancelBtn.addEventListener('click', () => renderList());

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️'; delBtn.setAttribute('aria-label', 'Delete task');
      delBtn.className = 'btn-icon btn-danger';
      delBtn.addEventListener('click', () => module.deleteTask(task.id));

      editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') module.editTask(task.id, editInput.value);
        if (e.key === 'Escape') renderList();
      });

      li.append(cb, span, editInput, editBtn, confirmBtn, cancelBtn, delBtn);
      ul.appendChild(li);
    });
  }

  const module = {
    init() {
      const storedTasks = StorageService.get(KEY_TASKS);
      if (Array.isArray(storedTasks)) {
        tasks = storedTasks.filter(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean' && typeof t.createdAt === 'number');
      }
      const storedMode = StorageService.get(KEY_SORT_MODE);
      if (['default','az','za','completed_last'].includes(storedMode)) sortMode = storedMode;

      document.getElementById('task-submit')?.addEventListener('click', () => {
        const inp = document.getElementById('task-input');
        this.addTask(inp ? inp.value : '');
      });
      document.getElementById('task-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { const inp = document.getElementById('task-input'); this.addTask(inp.value); }
      });
      document.getElementById('sort-select')?.addEventListener('change', e => this.setSortMode(e.target.value));
      const sel = document.getElementById('sort-select');
      if (sel) sel.value = sortMode;
      renderList();
    },
    addTask(text) {
      const errEl = document.getElementById('task-error');
      const trimmed = (text || '').trim();
      if (!trimmed) { if (errEl) errEl.textContent = 'Task text cannot be empty.'; return; }
      if (isDuplicate(trimmed)) { if (errEl) errEl.textContent = 'A task with this name already exists.'; return; }
      if (errEl) errEl.textContent = '';
      tasks.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,9)}`, text: trimmed, done: false, createdAt: Date.now() });
      save(); renderList();
      const inp = document.getElementById('task-input'); if (inp) inp.value = '';
    },
    editTask(id, text) {
      const errEl = document.getElementById('task-error');
      const trimmed = (text || '').trim();
      if (!trimmed) { if (errEl) errEl.textContent = 'Task text cannot be empty.'; return; }
      if (isDuplicate(trimmed, id)) { if (errEl) errEl.textContent = 'A task with this name already exists.'; return; }
      if (errEl) errEl.textContent = '';
      const t = tasks.find(x => x.id === id); if (t) { t.text = trimmed; save(); renderList(); }
    },
    deleteTask(id) { tasks = tasks.filter(t => t.id !== id); save(); renderList(); },
    toggleComplete(id) { const t = tasks.find(x => x.id === id); if (t) { t.done = !t.done; save(); renderList(); } },
    setSortMode(mode) {
      if (!['default','az','za','completed_last'].includes(mode)) return;
      sortMode = mode; StorageService.set(KEY_SORT_MODE, mode); renderList();
    }
  };
  return module;
})();

// ------------------------------------------------------------
// LinkManager — quick-link CRUD, URL validation
// ------------------------------------------------------------
const LinkManager = (() => {
  let links = [];

  function validateURL(url) {
    try { const u = new URL(url.trim()); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch (e) { return false; }
  }

  function save() { StorageService.set(KEY_LINKS, links); }

  function renderLinks() {
    const container = document.getElementById('link-list');
    if (!container) return;
    container.innerHTML = '';
    links.forEach(link => {
      const card = document.createElement('div');
      card.className = 'link-card';
      const a = document.createElement('a');
      a.href = link.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = link.label;
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕'; delBtn.className = 'btn-icon btn-danger';
      delBtn.setAttribute('aria-label', `Remove ${link.label}`);
      delBtn.addEventListener('click', () => module.deleteLink(link.id));
      card.append(a, delBtn);
      container.appendChild(card);
    });
  }

  const module = {
    init() {
      const stored = StorageService.get(KEY_LINKS);
      if (Array.isArray(stored)) {
        links = stored.filter(l => l && typeof l.id === 'string' && typeof l.label === 'string' && typeof l.url === 'string');
      }
      document.getElementById('link-submit')?.addEventListener('click', () => {
        const label = document.getElementById('link-label-input')?.value || '';
        const url = document.getElementById('link-url-input')?.value || '';
        this.addLink(label, url);
      });
      renderLinks();
    },
    addLink(label, url) {
      const labelErr = document.getElementById('link-label-error');
      const urlErr = document.getElementById('link-url-error');
      let valid = true;
      if (!(label || '').trim()) { if (labelErr) labelErr.textContent = 'Label is required.'; valid = false; } else { if (labelErr) labelErr.textContent = ''; }
      if (!validateURL(url)) { if (urlErr) urlErr.textContent = 'Enter a valid http/https URL.'; valid = false; } else { if (urlErr) urlErr.textContent = ''; }
      if (!valid) return;
      links.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,9)}`, label: label.trim(), url: url.trim() });
      save(); renderLinks();
      const li = document.getElementById('link-label-input'); if (li) li.value = '';
      const ui = document.getElementById('link-url-input'); if (ui) ui.value = '';
    },
    deleteLink(id) { links = links.filter(l => l.id !== id); save(); renderLinks(); }
  };
  return module;
})();

// ------------------------------------------------------------
// DashboardApp — orchestrator
// ------------------------------------------------------------
const DashboardApp = {
  init() {
    StorageService.init();
    ThemeController.init();
    GreetingWidget.init();
    TimerModule.init();
    TaskManager.init();
    LinkManager.init();
  }
};

// ------------------------------------------------------------
// Bootstrap
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => DashboardApp.init());
