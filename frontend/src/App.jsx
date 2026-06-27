import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import axios from 'axios';
import TaskModal from './components/TaskModal';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ListView from './components/views/ListView';
import './App.css';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/tasks';

function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentView, setCurrentView] = useState('list');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(API_URL);
      const formattedTasks = response.data.map(t => ({...t, start: new Date(t.start_time), end: new Date(t.end_time)}));
      setTasks(formattedTasks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSlot = ({ start, end }) => { setSelectedTask({ start_time: start, end_time: end }); setIsModalOpen(true); };
  const handleSelectEvent = (event) => { setSelectedTask(event); setIsModalOpen(true); };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) await axios.put(`${API_URL}/${taskData.id}`, taskData);
      else await axios.post(API_URL, taskData);
      fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Error al guardar: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Seguro?')) {
      try {
        await axios.delete(`${API_URL}/${taskId}`);
        fetchTasks();
        setIsModalOpen(false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const eventStyleGetter = (event) => ({ style: { backgroundColor: event.color || '#3b82f6', borderRadius: '6px', color: '#fff', border: '0px', display: 'block' } });

  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-content">
        <TopBar currentView={currentView} setCurrentView={setCurrentView} />
        
        <div className="view-container animate-fade-in">
          {currentView === 'calendar' && (
            <div className="glass-panel" style={{ height: '100%', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}>+ Nueva Tarea</button>
              </div>
              <Calendar
                localizer={localizer}
                events={tasks}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100vh - 120px)' }}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                culture="es"
              />
            </div>
          )}

          {currentView === 'list' && (
            <ListView 
              tasks={tasks} 
              onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
              onAddTask={(status) => { setSelectedTask({ status: status }); setIsModalOpen(true); }}
            />
          )}

          {(currentView === 'board' || currentView === 'table') && (
            <div className="placeholder-view animate-fade-in">
              <h2>Esta vista está en construcción 🚧</h2>
              <p>Pronto podrás ver tus tareas en formato {currentView}.</p>
            </div>
          )}
        </div>
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
