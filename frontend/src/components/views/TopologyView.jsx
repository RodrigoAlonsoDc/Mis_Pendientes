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
import { Plus, Save, RotateCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const PROJECT_ID = 1;

const defaultNodes = [
  { id: 'goal', position: { x: 400, y: 50 }, data: { label: 'GOAL' }, style: { backgroundColor: '#064e3b', color: 'white', border: '1px solid #10b981', padding: '10px 40px', borderRadius: '4px', fontWeight: 'bold' } },
  { id: 'push', position: { x: 350, y: 150 }, data: { label: '¿Qué me impulsa a hacerlo?' }, style: { backgroundColor: '#831843', color: 'white', border: '1px solid #f43f5e', padding: '10px', borderRadius: '4px' } },
  { id: 'how', position: { x: 370, y: 250 }, data: { label: '¿Cómo llego allí?' }, style: { backgroundColor: '#4c1d95', color: 'white', border: '1px solid #8b5cf6', padding: '10px', borderRadius: '4px' } },
  { id: 'outcome', position: { x: 370, y: 500 }, data: { label: '¿Cuál es el resultado ideal?' }, style: { backgroundColor: '#713f12', color: 'white', border: '1px solid #eab308', padding: '10px', borderRadius: '4px' } },
];

const defaultEdges = [
  { id: 'e1', source: 'goal', target: 'push', style: { stroke: '#fff' } },
  { id: 'e2', source: 'push', target: 'how', style: { stroke: '#fff' } },
];

export default function TopologyView({ tasks }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTopology();
  }, []);

  const fetchTopology = async () => {
    try {
      const res = await axios.get(`${API_URL}/topology/${PROJECT_ID}`);
      if (res.data && res.data.nodes && res.data.nodes.length > 0) {
        setNodes(res.data.nodes);
        setEdges(res.data.edges);
      } else {
        // Load default template if empty
        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setNodes(defaultNodes);
      setEdges(defaultEdges);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/topology/${PROJECT_ID}`, { nodes, edges });
    } catch (e) {
      console.error(e);
      alert('Error al guardar la topología');
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, style: { stroke: '#fff' } }, eds)),
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
          style: { backgroundColor: '#2b2d31', color: 'white', border: '1px solid #475569', padding: '10px', borderRadius: '4px', fontSize: '12px' }
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
    const newLabel = prompt("Editar texto del nodo:", node.data.label);
    if (newLabel !== null && newLabel.trim() !== '') {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            n.data = { ...n.data, label: newLabel };
          }
          return n;
        })
      );
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Cargando Pizarra...</div>;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 60px)', position: 'relative' }} className="animate-fade-in">
      
      {/* Toolbar superior */}
      <div className="topology-toolbar">
        <button className="btn btn-secondary" onClick={addActionNode} title="Añadir cuadro de acción">
          <Plus size={16} /> Nodo Acción
        </button>
        <button className="btn btn-secondary" onClick={syncTasksToBoard} title="Añadir tareas faltantes al lienzo">
          <RotateCcw size={16} /> Sincronizar Tareas
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Pizarra'}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        colorMode="dark"
        style={{ backgroundColor: '#1e1e1e' }}
      >
        <Controls style={{ fill: '#fff', color: '#000' }} />
        <MiniMap nodeColor="#475569" maskColor="rgba(0,0,0,0.5)" />
        <Background variant="dots" gap={12} size={1} color="#475569" />
      </ReactFlow>

      <div className="topology-hint">
        💡 <strong>Tip:</strong> Doble clic en un nodo para editar el texto. Selecciona y presiona 'Suprimir' para borrar.
      </div>
    </div>
  );
}
