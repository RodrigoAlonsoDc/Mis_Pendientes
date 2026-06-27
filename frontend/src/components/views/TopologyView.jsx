import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Save, RotateCcw, CircleDot } from 'lucide-react';

let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
BASE_URL = BASE_URL.replace(/\/tasks\/?$/, '');

const defaultNodes = [
  { id: 'goal', position: { x: 400, y: 50 }, data: { label: 'GOAL' }, style: { backgroundColor: '#064e3b', color: 'white', border: '1px solid #10b981', padding: '10px 40px', borderRadius: '4px', fontWeight: 'bold' } },
  { id: 'push', position: { x: 350, y: 150 }, data: { label: '¿Qué me impulsa a hacerlo?' }, style: { backgroundColor: '#831843', color: 'white', border: '1px solid #f43f5e', padding: '10px', borderRadius: '4px' } },
  { id: 'how', position: { x: 370, y: 250 }, data: { label: '¿Cómo llego allí?' }, style: { backgroundColor: '#4c1d95', color: 'white', border: '1px solid #8b5cf6', padding: '10px', borderRadius: '4px' } },
  { id: 'outcome', position: { x: 370, y: 500 }, data: { label: '¿Cuál es el resultado ideal?' }, style: { backgroundColor: '#713f12', color: 'white', border: '1px solid #eab308', padding: '10px', borderRadius: '4px' } },
];

const defaultEdges = [
  { id: 'e1', source: 'goal', target: 'push', style: { stroke: 'var(--text-main)' } },
  { id: 'e2', source: 'push', target: 'how', style: { stroke: 'var(--text-main)' } },
];

export default function TopologyView({ tasks, workspaces = [], selectedWorkspaceId, setSelectedWorkspaceId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, nodeId: null, label: '', color: '#1e3a8a' });

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchTopology(selectedWorkspaceId);
    } else {
      setLoading(false);
      setNodes([]);
      setEdges([]);
    }
  }, [selectedWorkspaceId]);

  const fetchTopology = async (wsId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/topology/${wsId}`);
      if (res.data && res.data.nodes && res.data.nodes.length > 0) {
        setNodes(res.data.nodes);
        setEdges(res.data.edges);
      } else {
        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
    } catch (e) {
      console.error(e);
      setNodes(defaultNodes);
      setEdges(defaultEdges);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedWorkspaceId) return;
    setSaving(true);
    try {
      await axios.put(`${BASE_URL}/topology/${selectedWorkspaceId}`, { nodes, edges });
      alert('Pizarra guardada correctamente');
    } catch (e) {
      console.error(e);
      alert(`Error al guardar la topología: ${e.message}`);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, style: { stroke: 'var(--text-main)' } }, eds)),
    [setEdges],
  );

  const addActionNode = () => {
    const newNode = {
      id: `action_${Date.now()}`,
      position: { x: 400, y: 350 },
      data: { label: 'Nuevo Plan de Acción' },
      style: { backgroundColor: '#1e3a8a', color: 'white', border: '1px solid #3b82f6', padding: '10px', borderRadius: '4px' }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const syncTasksToBoard = () => {
    const newNodes = [];
    let startX = 50;

    tasks.forEach(task => {
      // Check if task already exists as a node
      if (!nodes.find(n => n.id === `task_${task.id}`)) {
        newNodes.push({
          id: `task_${task.id}`,
          position: { x: startX, y: 350 },
          data: { label: `Tarea: ${task.title}` },
          style: { backgroundColor: 'var(--bg-panel)', color: 'white', border: '1px solid #475569', padding: '10px', borderRadius: '4px', fontSize: '12px' }
        });
        startX += 150;
      }
    });

    if (newNodes.length > 0) {
      setNodes((nds) => [...nds, ...newNodes]);
    } else {
      alert("Todas las tareas ya están en el tablero.");
    }
  };

  const onNodeDoubleClick = (event, node) => {
    // Extract background color from style or use a default
    const bgColor = node.style?.backgroundColor || '#1e3a8a';
    setEditModal({ isOpen: true, nodeId: node.id, label: node.data.label, color: bgColor });
  };

  const handleSaveNodeEdit = () => {
    if (!editModal.label.trim()) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === editModal.nodeId) {
          return {
            ...n,
            data: { ...n.data, label: editModal.label },
            style: { ...n.style, backgroundColor: editModal.color }
          };
        }
        return n;
      })
    );
    setEditModal({ ...editModal, isOpen: false });
  };

  const handleDeleteNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== editModal.nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== editModal.nodeId && e.target !== editModal.nodeId));
    setEditModal({ ...editModal, isOpen: false });
  };

  if (loading) return <div style={{ color: 'var(--text-main)', padding: '2rem' }}>Cargando Pizarra...</div>;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 60px)', position: 'relative', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      
      {/* Toolbar superior */}
      <div className="topology-toolbar" style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
        
        <select 
          value={selectedWorkspaceId || ''} 
          onChange={(e) => setSelectedWorkspaceId(Number(e.target.value))}
          style={{ padding: '0.5rem', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)', minWidth: '200px' }}
        >
          <option value="" disabled>-- Selecciona un Espacio --</option>
          {workspaces.map(ws => (
            <option key={ws.id} value={ws.id}>{ws.name}</option>
          ))}
        </select>

        {selectedWorkspaceId && (
          <>
            <button className="btn btn-secondary" onClick={addActionNode} title="Añadir cuadro de acción">
              <Plus size={16} /> Nodo Acción
            </button>
            <button className="btn btn-secondary" onClick={syncTasksToBoard} title="Añadir tareas faltantes al lienzo">
              <RotateCcw size={16} /> Sincronizar Tareas
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Pizarra'}
            </button>
          </>
        )}
      </div>

      {!selectedWorkspaceId ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <CircleDot size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h2>Selecciona un Espacio de Trabajo</h2>
          <p>La pizarra interactiva es única para cada espacio de trabajo.</p>
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        colorMode="dark"
        style={{ backgroundColor: 'var(--bg-panel)' }}
      >
        <Controls style={{ fill: 'var(--text-main)', color: '#000' }} />
        <MiniMap nodeColor="#475569" maskColor="rgba(0,0,0,0.5)" />
        <Background variant="dots" gap={12} size={1} color="#475569" />
      </ReactFlow>
        </div>
      )}

      {/* MODAL PARA EDITAR NODO */}
      {editModal.isOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setEditModal({ ...editModal, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Editar Nodo</h2>
              <button className="btn-close" onClick={() => setEditModal({ ...editModal, isOpen: false })}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Texto del Nodo</label>
                <input 
                  type="text" 
                  value={editModal.label}
                  onChange={(e) => setEditModal({ ...editModal, label: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNodeEdit();
                  }}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-main)' }}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Color del Nodo</label>
                <input 
                  type="color" 
                  value={editModal.color}
                  onChange={(e) => setEditModal({ ...editModal, color: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={handleDeleteNode} style={{ color: '#ef4444' }}>Eliminar Nodo</button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn" onClick={() => setEditModal({ ...editModal, isOpen: false })}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveNodeEdit}>Guardar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
