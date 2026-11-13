const STORAGE_KEY = "courseload.tasks.v1";
const LIMIT_KEY = "courseload.dailyLimit.v1";
let tasks = loadTasks();
let editingId = null;

const $ = (id) => document.getElementById(id);
const today = new Date();
const localDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const prettyDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2300);
}
function openModal(task = null) {
  editingId = task ? task.id : null;
  $("modalTitle").textContent = task ? "Edit task" : "Add a task";
  $("taskTitle").value = task?.title || "";
  $("taskCourse").value = task?.course || "";
  $("taskDate").value = task?.date || localDate(today);
  $("taskHours").value = task?.hours ?? "";
  $("taskModal").classList.add("open");
  $("taskModal").setAttribute("aria-hidden", "false");
  $("taskTitle").focus();
}
function closeModal() {
  $("taskModal").classList.remove("open");
  $("taskModal").setAttribute("aria-hidden", "true");
  $("taskForm").reset();
  editingId = null;
}

const pageCopy = {
  overview: {
    title: 'Good to see you<span class="wave"> ✦</span>',
    subtitle: 'A clearer view of what’s due, and when.',
    eyebrow: 'YOUR STUDY SPACE'
  },
  tasks: {
    title: 'My tasks',
    subtitle: 'Keep track of every assignment, quiz and project.',
    eyebrow: 'TASK MANAGEMENT'
  },
  workload: {
    title: 'Your workload',
    subtitle: 'See which deadlines are manageable and which days need attention.',
    eyebrow: 'WORKLOAD ANALYSIS'
  }
};

function setView(view, updateAddress = true) {
  if (!pageCopy[view]) view = 'overview';
  const main = document.querySelector('.main-content');
  main.classList.remove('view-overview', 'view-tasks', 'view-workload');
  main.classList.add(`view-${view}`);

  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    const active = link.dataset.view === view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  $('pageTitle').innerHTML = pageCopy[view].title;
  $('pageSubtitle').textContent = pageCopy[view].subtitle;
  $('todayLabel').textContent = pageCopy[view].eyebrow;

  if (updateAddress && location.hash !== `#${view === 'overview' ? 'dashboard' : view}`) {
    history.pushState({ view }, '', `#${view === 'overview' ? 'dashboard' : view}`);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link[data-view]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    setView(link.dataset.view);
  });
});
window.addEventListener('popstate', () => {
  const hash = location.hash.replace('#', '');
  setView(hash === 'tasks' || hash === 'workload' ? hash : 'overview', false);
});
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '');
  setView(hash === 'tasks' || hash === 'workload' ? hash : 'overview', false);
});

function render() {
  const pending = tasks.filter(t => !t.completed);
  const dueToday = pending.filter(t => t.date === localDate(today));
  $("openCount").textContent = pending.length;
  $("todayCount").textContent = dueToday.length;
  $("totalHours").textContent = pending.reduce((sum, t) => sum + Number(t.hours), 0).toFixed(1).replace(/\.0$/, "");
  $("doneCount").textContent = tasks.filter(t => t.completed).length;

  const filter = $("taskFilter").value;
  const visible = tasks.filter(t => filter === "all" || (filter === "completed" ? t.completed : !t.completed))
    .sort((a,b) => a.date.localeCompare(b.date));
  $("taskList").innerHTML = "";
  $("emptyState").style.display = visible.length ? "none" : "block";

  visible.forEach(task => {
    const item = document.createElement("div");
    item.className = `task-item ${task.completed ? "completed" : ""}`;
    const check = document.createElement("input");
    check.type = "checkbox"; check.className = "check-task"; check.checked = task.completed;
    check.setAttribute("aria-label", `Mark ${task.title} completed`);
    check.addEventListener("change", () => toggleTask(task.id));
    const info = document.createElement("div"); info.className = "task-info";
    const title = document.createElement("div"); title.className = "task-title"; title.textContent = task.title;
    const meta = document.createElement("div"); meta.className = "task-meta"; meta.textContent = task.course;
    info.append(title, meta);
    const date = document.createElement("div"); date.className = "task-date"; date.textContent = prettyDate(task.date);
    const hours = document.createElement("div"); hours.className = "task-hours"; hours.textContent = `${task.hours}h`;
    const edit = document.createElement("button"); edit.className = "delete-btn"; edit.textContent = "✎"; edit.title = "Edit task";
    edit.addEventListener("click", () => openModal(task));
    const del = document.createElement("button"); del.className = "delete-btn"; del.textContent = "×"; del.title = "Delete task";
    del.addEventListener("click", () => deleteTask(task.id));
    item.append(check, info, date, hours, edit, del);
    $("taskList").append(item);
  });
  renderWorkload(pending);
}
function renderWorkload(pending) {
  const grouped = {};
  pending.forEach(task => grouped[task.date] = (grouped[task.date] || 0) + Number(task.hours));
  const dates = Object.keys(grouped).sort();
  const limit = Number(localStorage.getItem(LIMIT_KEY) || 6);
  $("dailyLimit").value = limit;
  $("workloadList").innerHTML = "";
  if (!dates.length) {
    $("workloadList").innerHTML = '<div class="load-clear">No upcoming workload yet. Add a task to see your daily plan.</div>';
    return;
  }
  dates.forEach(date => {
    const hours = grouped[date], over = hours > limit;
    const row = document.createElement("div"); row.className = "load-row";
    const top = document.createElement("div"); top.className = "load-top";
    const dateEl = document.createElement("span"); dateEl.className = "load-date"; dateEl.textContent = prettyDate(date);
    const hoursEl = document.createElement("span"); hoursEl.className = "load-hours"; hoursEl.textContent = `${hours.toFixed(1).replace(/\.0$/,"")} / ${limit} hrs`;
    top.append(dateEl, hoursEl);
    const track = document.createElement("div"); track.className = "load-track";
    const fill = document.createElement("div"); fill.className = `load-fill ${over ? "over" : ""}`;
    fill.style.width = `${Math.min(100, hours / limit * 100)}%`; track.append(fill);
    row.append(top, track);
    if (over) { const warning = document.createElement("div"); warning.className = "load-warning"; warning.textContent = "⚠ This day is above your daily study-hour limit."; row.append(warning); }
    $("workloadList").append(row);
  });
}
function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
  saveTasks(); render();
}
function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  tasks = tasks.filter(t => t.id !== id); saveTasks(); render(); showToast("Task deleted.");
}
$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("taskTitle").value.trim(), course = $("taskCourse").value.trim();
  const date = $("taskDate").value, hours = Number($("taskHours").value);
  if (!title || !course || !date || !Number.isFinite(hours) || hours <= 0 || hours > 100) {
    showToast("Please enter valid task details."); return;
  }
  const task = { id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), title, course, date, hours, completed: false };
  if (editingId) tasks = tasks.map(t => t.id === editingId ? {...t, ...task, completed: t.completed} : t);
  else tasks.push(task);
  saveTasks(); closeModal(); render(); showToast(editingId ? "Task updated." : "Task added.");
});
$("addTaskTop").addEventListener("click", () => openModal());
$("emptyAdd").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);
$("taskModal").addEventListener("click", e => { if (e.target === $("taskModal")) closeModal(); });
$("taskFilter").addEventListener("change", render);
$("saveLimit").addEventListener("click", () => {
  const limit = Number($("dailyLimit").value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 24) { showToast("Choose a limit from 1 to 24 hours."); return; }
  localStorage.setItem(LIMIT_KEY, limit); render(); showToast("Daily limit saved.");
});
$("todayLabel").textContent = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
render();
const initialHash = location.hash.replace('#', '');
setView(initialHash === 'tasks' || initialHash === 'workload' ? initialHash : 'overview', false);
