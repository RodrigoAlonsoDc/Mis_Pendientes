const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar la base de datos
const initDb = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                progress INT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Pendiente',
                color VARCHAR(20) DEFAULT '#3b82f6',
                priority VARCHAR(20) DEFAULT 'Normal',
                assignee VARCHAR(100) DEFAULT '',
                project_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de subtareas
        await db.query(`
            CREATE TABLE IF NOT EXISTS subtasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // Tabla de adjuntos (enlaces)
        await db.query(`
            CREATE TABLE IF NOT EXISTS attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `);

        // Tabla de topologia (whiteboard)
        await db.query(`
            CREATE TABLE IF NOT EXISTS topology (
                project_id INT PRIMARY KEY,
                data LONGTEXT
            )
        `);

        // Tabla de espacios (workspaces)
        await db.query(`
            CREATE TABLE IF NOT EXISTS workspaces (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                color VARCHAR(20) DEFAULT '#8b5cf6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insertar un workspace por defecto si no hay ninguno
        const [workspaces] = await db.query('SELECT * FROM workspaces');
        let defaultWorkspaceId = 1;
        if (workspaces.length === 0) {
            const [wsRes] = await db.query("INSERT INTO workspaces (name, color) VALUES ('Espacio de Equipo', '#3b82f6')");
            defaultWorkspaceId = wsRes.insertId;
        } else {
            defaultWorkspaceId = workspaces[0].id;
        }

        // Tabla de proyectos (listas)
        await db.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workspace_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                color VARCHAR(20) DEFAULT '#10b981',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )
        `);

        // Insertar un proyecto por defecto si no hay ninguno
        const [projects] = await db.query('SELECT * FROM projects');
        if (projects.length === 0) {
            await db.query("INSERT INTO projects (workspace_id, name, color) VALUES (?, 'Proyecto 1', '#10b981')", [defaultWorkspaceId]);
        }

        console.log('Database initialized - Tables ready (Phase 7)');
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
};

// --- RUTAS DE TAREAS ---
app.get('/api/tasks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tasks ORDER BY start_time ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks', async (req, res) => {
    const { title, description, start_time, end_time, progress, status, color, priority, assignee, project_id } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO tasks (title, description, start_time, end_time, progress, status, color, priority, assignee, project_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [title, description || '', new Date(start_time), new Date(end_time), progress || 0, status || 'Pendiente', color || '#3b82f6', priority || 'Normal', assignee || '', project_id || 1]
        );
        res.status(201).json({ id: result.insertId, title, description, start_time, end_time, progress, status, color, priority, assignee, project_id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, start_time, end_time, progress, status, color, priority, assignee, project_id } = req.body;
    try {
        await db.query(
            'UPDATE tasks SET title = ?, description = ?, start_time = ?, end_time = ?, progress = ?, status = ?, color = ?, priority = ?, assignee = ?, project_id = ? WHERE id = ?',
            [title, description || '', new Date(start_time), new Date(end_time), progress || 0, status || 'Pendiente', color || '#3b82f6', priority || 'Normal', assignee || '', project_id || 1, id]
        );
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE SUBTAREAS ---
app.get('/api/tasks/:taskId/subtasks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC', [req.params.taskId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks/:taskId/subtasks', async (req, res) => {
    const { title } = req.body;
    try {
        const [result] = await db.query('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', [req.params.taskId, title]);
        res.status(201).json({ id: result.insertId, task_id: req.params.taskId, title, completed: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/subtasks/:id', async (req, res) => {
    const { completed } = req.body;
    try {
        await db.query('UPDATE subtasks SET completed = ? WHERE id = ?', [completed, req.params.id]);
        res.json({ message: 'Subtask updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/subtasks/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM subtasks WHERE id = ?', [req.params.id]);
        res.json({ message: 'Subtask deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE ADJUNTOS ---
app.get('/api/tasks/:taskId/attachments', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at ASC', [req.params.taskId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/tasks/:taskId/attachments', async (req, res) => {
    const { name, url } = req.body;
    try {
        const [result] = await db.query('INSERT INTO attachments (task_id, name, url) VALUES (?, ?, ?)', [req.params.taskId, name, url]);
        res.status(201).json({ id: result.insertId, task_id: req.params.taskId, name, url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/attachments/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM attachments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Attachment deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE TOPOLOGÍA ---
app.get('/api/topology/:projectId', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT data FROM topology WHERE project_id = ?', [req.params.projectId]);
        if (rows.length > 0) {
            res.json(JSON.parse(rows[0].data));
        } else {
            res.json({ nodes: [], edges: [] });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/topology/:projectId', async (req, res) => {
    const { nodes, edges } = req.body;
    const dataString = JSON.stringify({ nodes, edges });
    try {
        await db.query(
            'INSERT INTO topology (project_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = ?',
            [req.params.projectId, dataString, dataString]
        );
        res.json({ message: 'Topology saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE WORKSPACES ---
app.get('/api/workspaces', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM workspaces ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/workspaces', async (req, res) => {
    const { name, color } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO workspaces (name, color) VALUES (?, ?)',
            [name, color || '#8b5cf6']
        );
        const [newWorkspace] = await db.query('SELECT * FROM workspaces WHERE id = ?', [result.insertId]);
        res.status(201).json(newWorkspace[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/workspaces/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM workspaces WHERE id = ?', [req.params.id]);
        res.json({ message: 'Workspace deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/workspaces/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('UPDATE workspaces SET name = ? WHERE id = ?', [name, req.params.id]);
        const [updated] = await db.query('SELECT * FROM workspaces WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- RUTAS DE PROYECTOS ---
app.get('/api/projects', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM projects ORDER BY id ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/projects', async (req, res) => {
    const { workspace_id, name, color } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO projects (workspace_id, name, color) VALUES (?, ?, ?)',
            [workspace_id, name, color || '#10b981']
        );
        const [newProject] = await db.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
        res.status(201).json(newProject[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const { name } = req.body;
    try {
        await db.query('UPDATE projects SET name = ? WHERE id = ?', [name, req.params.id]);
        const [updated] = await db.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDb();
});
