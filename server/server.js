const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// разрешаем фронту на 4200
app.use(cors({ origin: ['http://localhost:4200'] }));
app.use(express.json());

const DB_FILE = path.join(__dirname, 'data', 'tasks.json');

async function readTasks() {
  await fs.ensureFile(DB_FILE);
  const buf = await fs.readFile(DB_FILE);               // читаем как Buffer
  const text = buf.toString('utf8').replace(/^\uFEFF/, ''); // убираем BOM если есть
  if (!text.trim()) return [];
  try {
    return JSON.parse(text);
  } catch {
    // если файл битый — лечим
    await writeTasks([]);
    return [];
  }
}

async function writeTasks(tasks) {
  await fs.outputFile(DB_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

// GET /api/tasks — список
app.get('/api/tasks', async (_req, res) => {
  const tasks = await readTasks();
  res.json(tasks);
});

// POST /api/tasks — создать { title, completed? }
app.post('/api/tasks', async (req, res) => {
  let { title, completed } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ message: 'Field "title" is required and must be a non-empty string' });
  }
  if (typeof completed !== 'boolean') completed = false;

  const tasks = await readTasks();
  const task = { id: uuidv4(), title: title.trim(), completed };
  tasks.push(task);
  await writeTasks(tasks);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id — частичное обновление
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });

  if ('title' in patch) {
    if (typeof patch.title !== 'string' || !patch.title.trim()) {
      return res.status(400).json({ message: 'If provided, "title" must be a non-empty string' });
    }
    tasks[idx].title = patch.title.trim();
  }
  if ('completed' in patch) {
    if (typeof patch.completed !== 'boolean') {
      return res.status(400).json({ message: '"completed" must be boolean' });
    }
    tasks[idx].completed = patch.completed;
  }

  await writeTasks(tasks);
  res.json(tasks[idx]);
});

// DELETE /api/tasks/:id — удалить
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const tasks = await readTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });

  const [removed] = tasks.splice(idx, 1);
  await writeTasks(tasks);
  res.json(removed);
});

// 404 на прочие пути
app.use((_, res) => res.status(404).json({ message: 'Not found' }));

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});
