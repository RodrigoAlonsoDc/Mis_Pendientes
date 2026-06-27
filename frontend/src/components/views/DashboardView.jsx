import { useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, CheckCircle2, Clock, Circle, Plus, Folder, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
BASE_URL = BASE_URL.replace(/\/tasks\/?$/, '');

export default function DashboardView({ tasks, workspaces, projects, onWorkspaceCreated }) {
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceColor, setNewSpaceColor] = useState('#8b5cf6');
  const [isCreating, setIsCreating] = useState(false);
  
  // Calcular métricas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.progress === 100).length;
  const inProgressTasks = tasks.filter(t => t.progress > 0 && t.progress < 100).length;
  const pendingTasks = tasks.filter(t => t.progress === 0).length;
  
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tareas urgentes (próximas a vencer o pendientes)
  const urgentTasks = [...tasks]
    .filter(t => t.progress < 100 && t.end_time)
    .sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
    .slice(0, 5);

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await axios.post(`${BASE_URL}/workspaces`, {
        name: newSpaceName,
        color: newSpaceColor
      });
      onWorkspaceCreated(res.data);
      setNewSpaceName('');
      setNewSpaceColor('#8b5cf6');
    } catch (err) {
      alert("Error al crear el espacio");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <h1><LayoutDashboard size={24} /> Inicio</h1>
        <p>Resumen de actividad y productividad</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'var(--border-color)' }}>
            <LayoutDashboard size={20} color="var(--text-main)" />
          </div>
          <div className="metric-info">
            <h3>Total Tareas</h3>
            <span className="metric-value">{totalTasks}</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div className="metric-info">
            <h3>Completadas</h3>
            <span className="metric-value">{completedTasks}</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <Clock size={20} color="#8b5cf6" />
          </div>
          <div className="metric-info">
            <h3>En Curso</h3>
            <span className="metric-value">{inProgressTasks}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(71, 85, 105, 0.1)' }}>
            <Circle size={20} color="var(--text-muted)" />
          </div>
          <div className="metric-info">
            <h3>Pendientes</h3>
            <span className="metric-value">{pendingTasks}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* COLUMNA IZQUIERDA: FORMULARIOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-card">
            <h2><Folder size={18} /> Crear Espacio</h2>
            <form className="create-space-form" onSubmit={handleCreateSpace}>
              <input 
                type="text" 
                placeholder="Nombre del espacio..."
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                required
              />
              <input 
                type="color" 
                value={newSpaceColor}
                onChange={(e) => setNewSpaceColor(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Espacio'}
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: WIDGETS Y RESÚMENES */}
        <div className="dashboard-column right-column">
          
          {/* Widget de Productividad */}
          <div className="dashboard-card" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <h2><CheckCircle2 size={18} color="#3b82f6" /> Productividad General</h2>
            <p className="card-desc">Así va tu progreso en todas tus tareas.</p>
            
            <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Completadas vs Total</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#3b82f6' }}>{completionPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${completionPercentage}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
            </div>
          </div>

          {/* Widget de Tareas Urgentes */}
          <div className="dashboard-card">
            <h2><Clock size={18} color="#ef4444" /> Próximas Tareas</h2>
            <p className="card-desc">Tus tareas pendientes más cercanas a su fecha de entrega.</p>
            
            <div className="urgent-tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {urgentTasks.length > 0 ? urgentTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--hover-bg)', borderRadius: '6px', borderLeft: `3px solid #ef4444` }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '500' }}>{task.title}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Vence: {new Date(task.end_time).toLocaleDateString()}</span>
                  </div>
                  <ArrowRight size={14} color="#64748b" />
                </div>
              )) : (
                <p className="empty-text" style={{ padding: '1rem 0' }}>¡Todo al día! No hay tareas urgentes.</p>
              )}
            </div>
          </div>

          {/* Accesos Rápidos */}
          <div className="dashboard-card">
            <h2><LayoutDashboard size={18} /> Accesos Rápidos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => document.querySelector('.add-btn')?.click()}>
                <Plus size={24} color="#10b981" />
                <span style={{ fontSize: '0.85rem' }}>Nueva Tarea</span>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <CalendarIcon size={24} color="#8b5cf6" />
                <span style={{ fontSize: '0.85rem' }}>Ir al Calendario</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
