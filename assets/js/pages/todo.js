// ✅ Todo App - IndexedDB, Markdown, Import/Export
import { storage } from '../core/storage.js';

const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const deadlineInput = document.getElementById('deadlineInput');
const tagInput = document.getElementById('tagInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

let tasks = [];
let currentFilter = 'all';

// --- Load tasks từ IndexedDB ---
async function loadTasks() {
  try {
    tasks = await storage.getAll('todo') || [];
  } catch (e) {
    tasks = [];
  }
  renderTasks();
}

// --- Thêm task mới ---
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) return;
  const task = {
    title,
    priority: prioritySelect.value,
    deadline: deadlineInput.value,
    tags: tagInput.value.split(',').map(t => t.trim()).filter(t => t),
    completed: false,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await storage.add('todo', task);
  taskInput.value = '';
  deadlineInput.value = '';
  tagInput.value = '';
  await loadTasks();
}

// --- Render danh sách ---
function renderTasks() {
  taskList.innerHTML = '';
  let filtered = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed && !t.archived;
    if (currentFilter === 'completed') return t.completed && !t.archived;
    if (currentFilter === 'archived') return t.archived;
    return !t.archived;
  });
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(searchTerm) || t.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
  }
  filtered.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  filtered.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          ${task.deadline ? `<span>📅 ${task.deadline}</span>` : ''}
          ${task.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}
          <span>🕒 ${new Date(task.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="archive-btn">📦</button>
        <button class="delete-btn">🗑️</button>
      </div>
    `;
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', async () => {
      task.completed = checkbox.checked;
      task.updatedAt = new Date().toISOString();
      await updateTask(task);
      renderTasks();
    });
    li.querySelector('.archive-btn').addEventListener('click', async () => {
      task.archived = !task.archived;
      await updateTask(task);
      renderTasks();
    });
    li.querySelector('.delete-btn').addEventListener('click', async () => {
      await deleteTask(task);
      renderTasks();
    });
    taskList.appendChild(li);
  });
}

// --- CRUD helpers ---
async function updateTask(task) {
  const db = await storage.openDB();
  const tx = db.transaction('todo', 'readwrite');
  const store = tx.objectStore('todo');
  // Tìm key của task (cần lưu id khi lấy từ DB)
  const all = await storage.getAll('todo');
  const found = all.find(t => t.createdAt === task.createdAt);
  if (found) {
    await store.put(task, found.id);
  }
}

async function deleteTask(task) {
  const db = await storage.openDB();
  const tx = db.transaction('todo', 'readwrite');
  const store = tx.objectStore('todo');
  const all = await storage.getAll('todo');
  const found = all.find(t => t.createdAt === task.createdAt);
  if (found) {
    await store.delete(found.id);
  }
  await loadTasks();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Export / Import ---
exportBtn.addEventListener('click', () => {
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kidtomboy-todo-backup.json';
  a.click();
});

importBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const text = await file.text();
    const imported = JSON.parse(text);
    const db = await storage.openDB();
    const tx = db.transaction('todo', 'readwrite');
    const store = tx.objectStore('todo');
    await store.clear();
    for (const task of imported) {
      await store.add(task);
    }
    await loadTasks();
  });
  input.click();
});

// --- Events ---
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', renderTasks);
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Khởi động
loadTasks();