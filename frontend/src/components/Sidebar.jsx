import { Home, CheckSquare, Plus, Search, ChevronRight, CircleDot } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, workspaces = [], projects = [], selectedProjectId, setSelectedProjectId, isSidebarOpen, setIsSidebarOpen, setSelectedWorkspaceId }) {
  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="workspace-logo">R</div>
        <span className="workspace-name">Rodrigo's Workspace</span>
      </div>

      <div className="sidebar-search">
        <Search size={14} className="search-icon" />
        <input type="text" placeholder="Buscar..." />
      </div>

      <div className="sidebar-menu">
        <div className={`menu-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setCurrentView('home'); setIsSidebarOpen(false); }}>
          <Home size={16} />
          <span>Inicio</span>
        </div>
        <div className={`menu-item ${currentView === 'list' || currentView === 'board' || currentView === 'calendar' ? 'active' : ''}`} onClick={() => { setCurrentView('list'); setIsSidebarOpen(false); }}>
          <CheckSquare size={16} />
          <span>Mis tareas</span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs" style={{ marginLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <button className={`nav-item ${currentView === 'topology' ? 'active' : ''}`} onClick={() => setCurrentView('topology')} style={{ background: 'none', border: 'none', color: currentView === 'topology' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CircleDot size={14} />
            Topología
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-header">
          <span>ESPACIOS</span>
          <Plus size={14} className="add-btn" onClick={() => setCurrentView('home')} title="Crear Espacio" />
        </div>
        
        <div className="spaces-container">
          {workspaces.map(ws => (
            <div key={ws.id} className="space-item">
              <div className="space-title">
                <ChevronRight size={14} className="chevron" onClick={() => {/* Aquí se podría añadir toggle de expansión en el futuro */}} />
                <div 
                  style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.5rem', cursor: 'pointer' }}
                  onClick={() => { setSelectedWorkspaceId(ws.id); setCurrentView('workspace'); setIsSidebarOpen(false); }}
                >
                  <span className="color-dot" style={{ backgroundColor: ws.color }}></span>
                  <span style={{ flex: 1 }}>{ws.name}</span>
                </div>
              </div>
              <div className="project-list">
                {projects.filter(p => p.workspace_id === ws.id).map(proj => (
                  <div 
                    key={proj.id} 
                    className={`project-item ${selectedProjectId === proj.id && currentView !== 'home' ? 'active' : ''}`} 
                    onClick={() => { setSelectedProjectId(proj.id); setCurrentView('list'); setIsSidebarOpen(false); }} 
                    title="Ver tareas de este proyecto"
                  >
                    <CircleDot size={12} className="project-icon" style={{ color: proj.color }} />
                    {proj.name}
                  </div>
                ))}
                {projects.filter(p => p.workspace_id === ws.id).length === 0 && (
                  <div className="project-item" style={{opacity: 0.5}}>Sin proyectos...</div>
                )}
              </div>
            </div>
          ))}
          {(!workspaces || workspaces.length === 0) && (
            <div style={{ padding: '0.5rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay espacios.</div>
          )}
        </div>
      </div>
    </div>
  );
}
