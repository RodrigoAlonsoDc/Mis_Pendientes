import { LayoutList, Calendar as CalendarIcon, KanbanSquare, Table2, Plus, Menu, Settings } from 'lucide-react';

export default function TopBar({ currentView, setCurrentView, activeProject, onMenuToggle }) {
  const views = [
    { id: 'list', label: 'Lista', icon: LayoutList },
    { id: 'board', label: 'Tablero', icon: KanbanSquare },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'table', label: 'Tabla', icon: Table2 },
  ];

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle} title="Abrir menú">
          <Menu size={20} />
        </button>
        <div className="breadcrumbs">
          {currentView === 'workspace' ? (
            <span className="path-current" style={{color: 'var(--text-muted)'}}>Vista de Espacio</span>
          ) : activeProject ? (
            <>
              <span className="path-current" style={{color: activeProject.color}}>{activeProject.name}</span>
            </>
          ) : (
            <span className="path-parent">Ningún proyecto seleccionado</span>
          )}
        </div>
      </div>
      
      <div className="topbar-views">
        {views.map(view => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              className={`tab-btn ${currentView === view.id ? 'active' : ''}`}
              onClick={() => setCurrentView(view.id)}
            >
              <Icon size={14} />
              {view.label}
            </button>
          )
        })}
        <button className="tab-btn add-view">
          <Plus size={14} /> Vista
        </button>
      </div>
      
      <div className="topbar-right">
        <button className="icon-btn" title="Configuración de Temas" onClick={() => document.dispatchEvent(new CustomEvent('openThemeModal'))}>
          <Settings size={20} color="var(--text-muted)" />
        </button>
      </div>
    </div>
  );
}
