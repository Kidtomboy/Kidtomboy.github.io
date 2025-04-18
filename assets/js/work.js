// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentTaskId = null;
        this.easyMDE = new EasyMDE({
            element: document.getElementById('task-notes'),
            placeholder: 'Chọn một công việc để thêm ghi chú...',
            autoDownloadFontAwesome: false,
            spellChecker: false,
            status: false,
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side', 'fullscreen', '|',
                'guide'
            ]
        });
        this.init();
    }

    init() {
        this.renderTasks();
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        this.setupMenu();
    }

    setupEventListeners() {
        // Add task button
        document.getElementById('add-task').addEventListener('click', () => {
            this.showTaskInput();
        });

        // Save task button
        document.getElementById('save-task').addEventListener('click', () => {
            this.saveTask();
        });

        // Save note button
        document.getElementById('save-note').addEventListener('click', () => {
            this.saveNote();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderTasks(btn.dataset.filter);
            });
        });

        // Enter key in task input
        document.getElementById('new-task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveTask();
            }
        });
    }

    showTaskInput() {
        const container = document.querySelector('.task-input-container');
        container.style.display = 'flex';
        document.getElementById('new-task-input').focus();
    }

    hideTaskInput() {
        const container = document.querySelector('.task-input-container');
        container.style.display = 'none';
        document.getElementById('new-task-input').value = '';
        document.getElementById('new-task-due').value = '';
    }

    saveTask() {
        const title = document.getElementById('new-task-input').value.trim();
        const due = document.getElementById('new-task-due').value;
        
        if (!title) return;

        const task = {
            id: Date.now().toString(),
            title,
            due: due || null,
            completed: false,
            notes: '',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveToLocalStorage();
        this.renderTasks();
        this.hideTaskInput();
    }

    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveToLocalStorage();
            this.renderTasks();
            
            // If updating the current task, refresh notes
            if (this.currentTaskId === id) {
                this.loadNotes(id);
            }
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToLocalStorage();
        this.renderTasks();
        
        // If deleting the current task, clear notes
        if (this.currentTaskId === id) {
            this.currentTaskId = null;
            this.easyMDE.value('');
        }
    }

    saveNote() {
        if (!this.currentTaskId) return;
        
        const notes = this.easyMDE.value();
        this.updateTask(this.currentTaskId, { notes });
    }

    loadNotes(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.easyMDE.value(task.notes || '');
        }
    }

    renderTasks(filter = 'all') {
        const tasksList = document.getElementById('tasks-list');
        tasksList.innerHTML = '';

        let filteredTasks = [...this.tasks];
        
        // Sort by completion status and due date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            if (a.due && b.due) {
                return new Date(a.due) - new Date(b.due);
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Apply filter
        if (filter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (filter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '<div class="no-tasks">Không có công việc nào</div>';
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : 'pending'}`;
            
            // Check if task is overdue
            if (!task.completed && task.due && new Date(task.due) < new Date()) {
                taskElement.classList.add('overdue');
            }
            
            taskElement.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    ${task.due ? `<div class="task-due"><i class="far fa-clock"></i> ${this.formatDueDate(task.due)}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                    <button class="task-btn delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => {
                this.updateTask(task.id, { completed: checkbox.checked });
            });
            
            const editBtn = taskElement.querySelector('.edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editTask(task);
            });
            
            const deleteBtn = taskElement.querySelector('.delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            });
            
            taskElement.addEventListener('click', () => {
                this.currentTaskId = task.id;
                this.loadNotes(task.id);
                document.querySelectorAll('.task-item').forEach(item => {
                    item.classList.remove('active');
                });
                taskElement.classList.add('active');
            });
            
            tasksList.appendChild(taskElement);
        });
    }

    editTask(task) {
        document.getElementById('new-task-input').value = task.title;
        document.getElementById('new-task-due').value = task.due ? task.due.slice(0, 16) : '';
        this.showTaskInput();
        
        // Remove the task being edited
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.saveToLocalStorage();
    }

    formatDueDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');
        
        timeElement.textContent = now.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        dateElement.textContent = now.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
        
        document.getElementById('year').textContent = now.getFullYear();
    }

    setupMenu() {
        const menuToggle = document.getElementById('menu-toggle');
        const menu = document.getElementById('menu');
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);

        menuToggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            menu.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});