import { LayoutList, Calendar as CalendarIcon, KanbanSquare, Table2, Plus } from 'lucide-react';

export default function TopBar({ currentView, setCurrentView }) {
  const views = [
    { id: 'list', label: 'Lista', icon: LayoutList },
    { id: 'board', label: 'Tablero', icon: KanbanSquare },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'table', label: 'Tabla', icon: Table2 },
  ];

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="breadcrumbs">
          <span className="path-parent">Espacio del equipo</span>
          <span className="separator">/</span>
          <span className="path-current">Proyecto 1</span>
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
        <button className="btn-filter">Filtro</button>
        <button className="btn-personalize">Personalizar</button>
      </div>
    </div>
  );
}
