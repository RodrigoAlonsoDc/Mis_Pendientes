import { Home, CheckSquare, Plus, Search, ChevronRight, CircleDot } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="workspace-logo">R</div>
        <span className="workspace-name">Rodrigo's Workspace</span>
      </div>
      
      <div className="sidebar-search">
        <Search size={14} className="search-icon" />
        <input type="text" placeholder="Buscar..." />
      </div>

      <div className="sidebar-menu">
        <div className="menu-item active">
          <Home size={16} />
          <span>Inicio</span>
        </div>
        <div className="menu-item">
          <CheckSquare size={16} />
          <span>Mis tareas</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <span>ESPACIOS</span>
          <Plus size={14} className="add-btn" />
        </div>
        
        <div className="space-item">
          <div className="space-title">
            <ChevronRight size={14} className="chevron" />
            <span className="color-dot" style={{backgroundColor: '#8b5cf6'}}></span>
            Espacio del equipo
          </div>
          <div className="project-list">
            <div className="project-item active">
              <CircleDot size={12} className="project-icon" />
              Proyecto 1
              <span className="task-count">3</span>
            </div>
            <div className="project-item">
              <CircleDot size={12} className="project-icon" />
              Proyecto 2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
