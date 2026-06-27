import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import axios from 'axios';
import TaskModal from './components/TaskModal';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      const formattedTasks = response.data.map(task => ({
        ...task,
        start: new Date(task.start_time),
        end: new Date(task.end_time)
      }));
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedTask({
      start_time: start,
      end_time: end,
    });
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedTask(event);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        // Update
        await axios.put(`${API_URL}/${taskData.id}`, taskData);
      } else {
        // Create
        await axios.post(API_URL, taskData);
      }
      fetchTasks();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error al guardar la tarea. ¿Está el backend encendido y la BD conectada?');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarea?')) {
      try {
        await axios.delete(`${API_URL}/${taskId}`);
        fetchTasks();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || '#3b82f6',
        borderRadius: '6px',
        opacity: 0.9,
        color: '#fff',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="app-container">
      <header className="header animate-fade-in">
        <h1>Mis Pendientes</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Gestiona tu tiempo y progreso</p>
      </header>

      <div className="glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}>
            + Nueva Tarea
          </button>
        </div>

        <Calendar
          localizer={localizer}
          events={tasks}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '70vh' }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          culture="es"
          messages={{
            next: "Siguiente",
            previous: "Anterior",
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            date: "Fecha",
            time: "Hora",
            event: "Evento",
            noEventsInRange: "No hay tareas en este periodo."
          }}
        />
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialData={selectedTask}
      />
    </div>
  );
}

export default App;
