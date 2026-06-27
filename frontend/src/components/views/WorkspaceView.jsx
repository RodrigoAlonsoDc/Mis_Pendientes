import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Bookmark, Folder, FolderPlus, CircleDot, Pencil, Trash2 } from 'lucide-react';

let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
BASE_URL = BASE_URL.replace(/\/tasks\/?$/, '');

export default function WorkspaceView({ workspace, projects, onNavigateToProject, onWorkspaceUpdated, onWorkspaceDeleted, onProjectCreated, onProjectUpdated, onProjectDeleted }) {
  const [renameModal, setRenameModal] = useState({ isOpen: false, type: '', id: null, currentName: '', newName: '' });

  const handleRenameWorkspace = (e) => {
    e.stopPropagation();
    setRenameModal({ isOpen: true, type: 'workspace', id: workspace.id, currentName: workspace.name, newName: workspace.name });
  };

  const handleRenameProject = (proj, e) => {
    e.stopPropagation();
    setRenameModal({ isOpen: true, type: 'project', id: proj.id, currentName: proj.name, newName: proj.name });
  };

  const handleSaveRename = async () => {
    const { type, id, newName, currentName } = renameModal;
    if (!newName || newName.trim() === '' || newName === currentName) {
      setRenameModal({ ...renameModal, isOpen: false });
      return;
    }
    
    try {
      if (type === 'workspace') {
        const res = await axios.put(`${BASE_URL}/workspaces/${id}`, { name: newName });
        onWorkspaceUpdated(res.data);
      } else {
        const res = await axios.put(`${BASE_URL}/projects/${id}`, { name: newName });
        onProjectUpdated(res.data);
      }
    } catch (err) {
      alert("Error al renombrar");
    } finally {
      setRenameModal({ ...renameModal, isOpen: false });
    }
  };

  const handleDeleteWorkspace = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el espacio "${workspace.name}" y todos sus proyectos?`)) return;
    try {
      await axios.delete(`${BASE_URL}/workspaces/${workspace.id}`);
      onWorkspaceDeleted(workspace.id);
    } catch (err) {
      alert("Error al eliminar espacio");
    }
  };

  const handleDeleteProject = async (proj, e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar proyecto "${proj.name}" y todas sus tareas?`)) return;
    try {
      await axios.delete(`${BASE_URL}/projects/${proj.id}`);
      onProjectDeleted(proj.id);
    } catch (err) {
      alert("Error al eliminar proyecto");
    }
  };

  const handleCreateProject = async () => {
    const name = window.prompt("Nombre del nuevo proyecto:");
    if (!name || name.trim() === '') return;
    try {
      const res = await axios.post(`${BASE_URL}/projects`, {
        workspace_id: workspace.id,
        name: name,
        color: '#10b981'
      });
      onProjectCreated(res.data);
    } catch (err) {
      alert("Error al crear proyecto");
    }
  };

  if (!workspace) return null;

  return (
    <div className="workspace-view animate-fade-in">
      <div className="workspace-header">
        <div className="workspace-title-box">
          <div className="workspace-color-large" style={{ backgroundColor: workspace.color }}></div>
          <h1>{workspace.name}</h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
            <button className="icon-btn" onClick={handleRenameWorkspace} title="Renombrar Espacio">
              <Pencil size={18} color="var(--text-muted)" />
            </button>
            <button className="icon-btn danger" onClick={handleDeleteWorkspace} title="Eliminar Espacio">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-grid-top">
        {/* RECENT CARD */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <h3>Recent</h3>
          </div>
          <div className="workspace-card-content">
            <div className="recent-list">
              {projects.slice(0, 3).map(p => (
                <div key={`recent-${p.id}`} className="recent-item" onClick={() => onNavigateToProject(p.id)}>
                  <Folder size={14} color="var(--text-muted)" />
                  <span className="recent-item-title">{p.name} <span className="recent-item-subtitle">en {workspace.name}</span></span>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="empty-subtext">No hay actividad reciente.</p>
              )}
            </div>
          </div>
        </div>

        {/* DOCS CARD */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <h3>Docs</h3>
          </div>
          <div className="workspace-card-content centered-content">
            <FileText size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
            <p className="empty-subtext">Todavía no hay documentos en esta ubicación.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>Agregar un documento</button>
          </div>
        </div>

        {/* BOOKMARKS CARD */}
        <div className="workspace-card">
          <div className="workspace-card-header">
            <h3>Bookmarks</h3>
          </div>
          <div className="workspace-card-content centered-content">
            <Bookmark size={48} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
            <p className="empty-subtext" style={{ textAlign: 'center' }}>Los marcadores facilitan guardar elementos de ClickUp o cualquier URL de la Web.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>Agregar marcador</button>
          </div>
        </div>
      </div>

      <div className="workspace-grid-bottom">
        {/* FOLDERS / PROJECTS CARD */}
        <div className="workspace-card full-width">
          <div className="workspace-card-header">
            <h3>Folders (Proyectos)</h3>
          </div>
          <div className="workspace-card-content">
            <div className="workspace-projects-grid">
              {projects.map(proj => (
                <div key={proj.id} className="workspace-project-box" onClick={() => onNavigateToProject(proj.id)}>
                  <div className="wpb-icon">
                    <CircleDot size={20} color={proj.color || '#10b981'} />
                  </div>
                  <div className="wpb-info" style={{ flex: 1 }}>
                    <h4>{proj.name}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="icon-btn" onClick={(e) => handleRenameProject(proj, e)} title="Editar nombre de proyecto">
                      <Pencil size={14} color="var(--text-muted)" />
                    </button>
                    <button className="icon-btn danger" onClick={(e) => handleDeleteProject(proj, e)} title="Eliminar proyecto">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="workspace-project-box add-new" onClick={handleCreateProject}>
                <div className="wpb-icon">
                  <FolderPlus size={20} color="var(--text-muted)" />
                </div>
                <div className="wpb-info">
                  <h4>Nuevo Proyecto</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA RENOMBRAR */}
      {renameModal.isOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Renombrar {renameModal.type === 'workspace' ? 'Espacio' : 'Proyecto'}</h2>
              <button className="btn-close" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                value={renameModal.newName}
                onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                }}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveRename}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
