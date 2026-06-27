const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar la tabla si no existe
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized - Table tasks ready');
    } catch (error) {
        console.error('Error initializing database:', error.message);
    }
};

// Rutas de la API
// Obtener todas las tareas
app.get('/api/tasks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tasks ORDER BY start_time ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear una nueva tarea
app.post('/api/tasks', async (req, res) => {
    const { title, description, start_time, end_time, progress, status, color } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO tasks (title, description, start_time, end_time, progress, status, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description || '', start_time, end_time, progress || 0, status || 'Pendiente', color || '#3b82f6']
        );
        res.status(201).json({ id: result.insertId, title, description, start_time, end_time, progress, status, color });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar una tarea
app.put('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, start_time, end_time, progress, status, color } = req.body;
    try {
        await db.query(
            'UPDATE tasks SET title = ?, description = ?, start_time = ?, end_time = ?, progress = ?, status = ?, color = ? WHERE id = ?',
            [title, description, start_time, end_time, progress, status, color, id]
        );
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar una tarea
app.delete('/api/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDb();
});
