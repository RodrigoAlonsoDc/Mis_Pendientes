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
import BoardView from './components/views/BoardView';
import TopologyView from './components/views/TopologyView';
import DashboardView from './components/views/DashboardView';
import WorkspaceView from './components/views/WorkspaceView';
import './App.css';

const locales = { 'es': es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const THEMES = [
  {
    id: 'default-dark',
    name: 'Oscuro Clásico',
    colors: {
      '--bg-main': '#1e1e24',
      '--bg-panel': '#2b2d31',
      '--text-main': '#fff',
      '--text-muted': '#a3a6aa',
      '--primary-color': '#7b61ff',
      '--border-color': 'rgba(255, 255, 255, 0.05)',
      '--hover-bg': 'rgba(255, 255, 255, 0.08)'
    }
  },
  {
    id: 'ocean',
    name: 'Tema Océano',
    colors: {
      '--bg-main': '#031926',
      '--bg-panel': '#468189',
      '--text-main': '#F4E9CD',
      '--text-muted': '#9DBEBB',
      '--primary-color': '#77ACA2',
      '--border-color': 'rgba(157, 190, 187, 0.2)',
      '--hover-bg': 'rgba(157, 190, 187, 0.3)'
    }
  }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/tasks';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [tasks, setTasks] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [appTheme, setAppTheme] = useState(localStorage.getItem('appTheme') || 'default-dark');
  const [customPrimaryColor, setCustomPrimaryColor] = useState(localStorage.getItem('customPrimaryColor') || '');

  useEffect(() => {
    fetchTasks();
    fetchWorkspaces();
    fetchProjects();

    const openThemeHandler = () => setIsThemeModalOpen(true);
    document.addEventListener('openThemeModal', openThemeHandler);
    return () => document.removeEventListener('openThemeModal', openThemeHandler);
  }, []);

  useEffect(() => {
    let currentThemeId = appTheme;
    // Migración de código viejo (hex color directo en appTheme)
    if (appTheme.startsWith('#')) {
      currentThemeId = 'default-dark';
      setAppTheme(currentThemeId);
      setCustomPrimaryColor(appTheme);
    }
    
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    Object.entries(theme.colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    if (customPrimaryColor) {
      document.documentElement.style.setProperty('--primary-color', customPrimaryColor);
    }

    localStorage.setItem('appTheme', currentThemeId);
    if (customPrimaryColor) localStorage.setItem('customPrimaryColor', customPrimaryColor);
  }, [appTheme, customPrimaryColor]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL);
      const formattedTasks = res.data.map(t => ({...t, start: new Date(t.start_time), end: new Date(t.end_time)}));
      setTasks(formattedTasks);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      BASE_URL = BASE_URL.replace(/\/tasks\/?$/, '');
      const res = await axios.get(`${BASE_URL}/workspaces`);
      setWorkspaces(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjects = async () => {
    try {
      let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      BASE_URL = BASE_URL.replace(/\/tasks\/?$/, '');
      const res = await axios.get(`${BASE_URL}/projects`);
      setProjects(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSlot = ({ start, end }) => { setSelectedTask({ start_time: start, end_time: end, project_id: selectedProjectId }); setIsModalOpen(true); };
  const handleSelectEvent = (event) => { setSelectedTask(event); setIsModalOpen(true); };

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        await axios.put(`${API_URL}/${taskData.id}`, taskData);
      } else {
        await axios.post(API_URL, { ...taskData, project_id: selectedProjectId || 1 });
      }
      fetchTasks();
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
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

  const handleDropTask = async (taskId, newStatus) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    // Optimizacion visual inmediata
    const taskToUpdate = { ...tasks[taskIndex], status: newStatus };
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = taskToUpdate;
    setTasks(updatedTasks);

    try {
      await axios.put(`${API_URL}/${taskId}`, taskToUpdate);
    } catch (e) {
      console.error(e);
      alert('Error al mover la tarea: ' + (e.response?.data?.error || e.message));
      fetchTasks(); // revertir si falla
    }
  };

  const eventStyleGetter = (event) => ({ style: { backgroundColor: event.color || '#3b82f6', borderRadius: '6px', color: 'var(--text-main)', border: '0px', display: 'block' } });

  const projectTasks = tasks.filter(t => t.project_id === selectedProjectId);
  const activeProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="layout-container">
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        workspaces={workspaces} 
        projects={projects} 
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        setSelectedWorkspaceId={setSelectedWorkspaceId}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <div className="main-content">
        <TopBar 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          activeProject={activeProject} 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="view-content">
          {currentView === 'home' && (
            <DashboardView 
              tasks={tasks} 
              workspaces={workspaces} 
              projects={projects}
              onWorkspaceCreated={(newWs) => setWorkspaces([...workspaces, newWs])} 
              onWorkspaceUpdated={(updatedWs) => setWorkspaces(workspaces.map(w => w.id === updatedWs.id ? updatedWs : w))}
              onWorkspaceDeleted={(id) => {
                setWorkspaces(workspaces.filter(w => w.id !== id));
                if (activeProject && workspaces.find(w => w.id === id)) setSelectedProjectId(null);
              }}
              onProjectCreated={(newProj) => setProjects([...projects, newProj])}
              onProjectUpdated={(updatedProj) => setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p))}
              onProjectDeleted={(id) => {
                setProjects(projects.filter(p => p.id !== id));
                if (selectedProjectId === id) setSelectedProjectId(null);
              }}
            />
          )}

          {currentView === 'workspace' && selectedWorkspaceId && (
            <WorkspaceView 
              workspace={workspaces.find(w => w.id === selectedWorkspaceId)}
              projects={projects.filter(p => p.workspace_id === selectedWorkspaceId)}
              onNavigateToProject={(projId) => {
                setSelectedProjectId(projId);
                setCurrentView('list');
              }}
              onWorkspaceUpdated={(updatedWs) => setWorkspaces(workspaces.map(w => w.id === updatedWs.id ? updatedWs : w))}
              onWorkspaceDeleted={(id) => {
                setWorkspaces(workspaces.filter(w => w.id !== id));
                if (selectedWorkspaceId === id) {
                  setCurrentView('home');
                  setSelectedWorkspaceId(null);
                }
              }}
              onProjectCreated={(newProj) => setProjects([...projects, newProj])}
              onProjectUpdated={(updatedProj) => setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p))}
              onProjectDeleted={(id) => setProjects(projects.filter(p => p.id !== id))}
            />
          )}

          {currentView !== 'home' && currentView !== 'workspace' && !selectedProjectId && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
              <h2>Selecciona un Proyecto</h2>
              <p>Elige un proyecto en el menú lateral izquierdo para ver y gestionar sus tareas.</p>
            </div>
          )}

          {currentView === 'calendar' && selectedProjectId && (
            <div style={{ height: 'calc(100vh - 120px)' }} className="animate-fade-in clickup-calendar">
              <Calendar
                localizer={localizer}
                events={projectTasks}
                startAccessor="start"
                endAccessor="end"
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                style={{ height: '100%', color: 'white' }}
                eventPropGetter={eventStyleGetter}
                messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
              />
            </div>
          )}

          {currentView === 'list' && selectedProjectId && (
            <ListView 
              tasks={projectTasks} 
              onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
              onAddTask={(status) => { setSelectedTask({ status: status }); setIsModalOpen(true); }}
            />
          )}

          {currentView === 'board' && selectedProjectId && (
            <BoardView 
              tasks={projectTasks}
              onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
              onAddTask={(status) => { setSelectedTask({ status: status }); setIsModalOpen(true); }}
              onDropTask={handleDropTask}
            />
          )}

          {currentView === 'topology' && (
            <TopologyView 
              tasks={selectedProjectId ? tasks.filter(t => t.project_id === selectedProjectId) : tasks} 
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
            />
          )}

          {currentView === 'table' && (
            <div className="placeholder-view animate-fade-in">
              <h2>Esta vista está en construcción 🚧</h2>
              <p>Pronto podrás ver tus tareas en formato {currentView}.</p>
            </div>
          )}
        </div>
        <TaskModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          initialData={selectedTask}
        />

        {/* MODAL DE TEMAS */}
        {isThemeModalOpen && (
          <div className="modal-overlay animate-fade-in" onClick={() => setIsThemeModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2>Configuración de Tema</h2>
                <button className="btn-close" onClick={() => setIsThemeModalOpen(false)}>×</button>
              </div>
              <div className="modal-body" style={{ marginTop: '1rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Elige un tema completo para la aplicación.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {THEMES.map(theme => (
                    <div 
                      key={theme.id}
                      onClick={() => { setAppTheme(theme.id); setCustomPrimaryColor(''); }}
                      style={{ 
                        backgroundColor: theme.colors['--bg-panel'], 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        border: appTheme === theme.id ? `2px solid ${theme.colors['--primary-color']}` : '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, color: theme.colors['--text-main'] }}>{theme.name}</h4>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.colors['--bg-main'], border: '1px solid var(--border-color)' }}></span>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.colors['--primary-color'], border: '1px solid var(--border-color)' }}></span>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: theme.colors['--text-main'], border: '1px solid var(--border-color)' }}></span>
                        </div>
                      </div>
                      {appTheme === theme.id && <span style={{ color: theme.colors['--primary-color'], fontWeight: 'bold' }}>Activo</span>}
                    </div>
                  ))}
                </div>

                <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <label>O personaliza el color de acento principal:</label>
                  <input 
                    type="color" 
                    value={customPrimaryColor || THEMES.find(t => t.id === appTheme)?.colors['--primary-color']}
                    onChange={(e) => setCustomPrimaryColor(e.target.value)}
                    style={{ width: '100%', height: '40px', marginTop: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
