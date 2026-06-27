import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
BASE_URL = BASE_URL.replace(/\/tasks\/?$/, '');

const STATUSES = ['PENDIENTE', 'EN CURSO', 'COMPLETADA'];
const PRIORITIES = ['Baja', 'Normal', 'Alta', 'Urgente'];

export default function TaskModal({ isOpen, onClose, onSave, onDelete, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    status: 'PENDIENTE',
    priority: 'Normal',
    assignee: ''
  });

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          start_time: initialData.start_time ? formatDateTime(initialData.start_time) : formatDateTime(new Date()),
          end_time: initialData.end_time ? formatDateTime(initialData.end_time) : formatDateTime(new Date(new Date().getTime() + 60 * 60 * 1000)),
          status: initialData.status ? initialData.status.toUpperCase() : 'PENDIENTE',
          color: initialData.color || '#3b82f6',
          progress: initialData.progress || 0,
          priority: initialData.priority || 'Normal',
          assignee: initialData.assignee || ''
        });
        
        if (initialData.id) {
          fetchSubtasks(initialData.id);
          fetchAttachments(initialData.id);
        }
      } else {
        setFormData({
          title: '',
          description: '',
          start_time: formatDateTime(new Date()),
          end_time: formatDateTime(new Date(new Date().getTime() + 60 * 60 * 1000)),
          status: 'PENDIENTE',
          color: '#3b82f6',
          progress: 0,
          priority: 'Normal',
          assignee: ''
        });
        setSubtasks([]);
        setAttachments([]);
      }
      setShowAttachmentInput(false);
    }
  }, [initialData, isOpen]);

  const fetchSubtasks = async (taskId) => {
    try {
      const res = await axios.get(`${BASE_URL}/tasks/${taskId}/subtasks`);
      setSubtasks(res.data);
    } catch (e) { console.error('Error fetching subtasks', e); }
  };

  const fetchAttachments = async (taskId) => {
    try {
      const res = await axios.get(`${BASE_URL}/tasks/${taskId}/attachments`);
      setAttachments(res.data);
    } catch (e) { console.error('Error fetching attachments', e); }
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      start_time: new Date(formData.start_time),
      end_time: new Date(formData.end_time)
    });
  };

  // --- SUBTASKS ---
  const handleAddSubtask = async (e) => {
    if (e.key === 'Enter' && newSubtask.trim() && initialData?.id) {
      e.preventDefault();
      try {
        const res = await axios.post(`${BASE_URL}/tasks/${initialData.id}/subtasks`, { title: newSubtask });
        setSubtasks([...subtasks, res.data]);
        setNewSubtask('');
      } catch (e) { console.error(e); }
    } else if (e.key === 'Enter' && !initialData?.id) {
      e.preventDefault();
      alert("Primero guarda la tarea principal para agregar subtareas.");
    }
  };

  const toggleSubtask = async (subtaskId, completed) => {
    try {
      await axios.put(`${BASE_URL}/subtasks/${subtaskId}`, { completed: !completed });
      setSubtasks(subtasks.map(st => st.id === subtaskId ? { ...st, completed: !completed } : st));
    } catch (e) { console.error(e); }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      await axios.delete(`${BASE_URL}/subtasks/${subtaskId}`);
      setSubtasks(subtasks.filter(st => st.id !== subtaskId));
    } catch (e) { console.error(e); }
  };

  // --- ATTACHMENTS ---
  const handleAddAttachment = async () => {
    if (newAttachmentUrl.trim() && initialData?.id) {
      try {
        const res = await axios.post(`${BASE_URL}/tasks/${initialData.id}/attachments`, {
          name: newAttachmentName || 'Enlace adjunto',
          url: newAttachmentUrl
        });
        setAttachments([...attachments, res.data]);
        setNewAttachmentUrl('');
        setNewAttachmentName('');
        setShowAttachmentInput(false);
      } catch (e) { console.error(e); }
    } else if (!initialData?.id) {
      alert("Primero guarda la tarea principal para agregar adjuntos.");
    }
  };

  const deleteAttachment = async (attachmentId) => {
    try {
      await axios.delete(`${BASE_URL}/attachments/${attachmentId}`);
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (e) { console.error(e); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay clickup-modal" onClick={onClose}>
      <div className="modal-content glass-panel animate-fade-in clickup-modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            className="clickup-title-input" 
            placeholder="Nombre de la tarea..."
          />
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="clickup-grid">
          {/* Columna Izquierda */}
          <div className="clickup-col">
            
            <div className="clickup-prop-row">
              <span className="prop-label">Estado</span>
              <select name="status" value={formData.status} onChange={handleChange} className="clickup-select badge" style={{backgroundColor: formData.status === 'COMPLETADA' ? '#10b981' : formData.status === 'EN CURSO' ? '#8b5cf6' : '#475569'}}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="clickup-prop-row">
              <span className="prop-label">Fechas</span>
              <div className="date-group">
                <input type="datetime-local" name="start_time" value={formData.start_time} onChange={handleChange} className="clickup-date" />
                <span>→</span>
                <input type="datetime-local" name="end_time" value={formData.end_time} onChange={handleChange} className="clickup-date" />
              </div>
            </div>

            <div className="clickup-summary">
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Añade una descripción o resumen..."
                className="clickup-textarea"
              />
            </div>

            {/* Subtareas */}
            <div className="clickup-section">
              <h4 className="section-title">Subtareas</h4>
              <div className="subtasks-list">
                {subtasks.map(st => (
                  <div key={st.id} className="subtask-item">
                    <button className="subtask-check" onClick={() => toggleSubtask(st.id, st.completed)}>
                      {st.completed ? <CheckCircle2 size={16} color="#10b981" /> : <Circle size={16} color="#a3a6aa" />}
                    </button>
                    <span style={{textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? '#a3a6aa' : '#fff', flex: 1}}>
                      {st.title}
                    </span>
                    <button className="subtask-delete" onClick={() => deleteSubtask(st.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <input 
                  type="text" 
                  value={newSubtask} 
                  onChange={(e) => setNewSubtask(e.target.value)} 
                  onKeyDown={handleAddSubtask}
                  placeholder="+ Agregar subtarea y presionar Enter" 
                  className="subtask-input"
                />
              </div>
            </div>

          </div>

          {/* Columna Derecha */}
          <div className="clickup-col">
            
            <div className="clickup-prop-row">
              <span className="prop-label">Persona asignada</span>
              <input type="text" name="assignee" value={formData.assignee} onChange={handleChange} className="clickup-input-sm" placeholder="Vacío" />
            </div>

            <div className="clickup-prop-row">
              <span className="prop-label">Prioridad</span>
              <select name="priority" value={formData.priority} onChange={handleChange} className="clickup-select-sm">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Adjuntos */}
            <div className="clickup-section" style={{marginTop: '2rem'}}>
              <h4 className="section-title">Enlaces Adjuntos</h4>
              <div className="attachments-list">
                {attachments.map(att => (
                  <div key={att.id} className="attachment-item">
                    <Link size={14} color="#a3a6aa" />
                    <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                    <button className="subtask-delete" onClick={() => deleteAttachment(att.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              {!showAttachmentInput ? (
                <button className="btn-add-attachment" onClick={() => setShowAttachmentInput(true)}>
                  <Plus size={14} /> Agregar enlace
                </button>
              ) : (
                <div className="attachment-form">
                  <input type="text" placeholder="Nombre (Ej: Doc Diseño)" value={newAttachmentName} onChange={e => setNewAttachmentName(e.target.value)} className="clickup-input-sm mb-2" />
                  <input type="url" placeholder="https://..." value={newAttachmentUrl} onChange={e => setNewAttachmentUrl(e.target.value)} className="clickup-input-sm mb-2" />
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button type="button" className="btn btn-primary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem'}} onClick={handleAddAttachment}>Guardar</button>
                    <button type="button" className="btn btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem'}} onClick={() => setShowAttachmentInput(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="modal-actions" style={{borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '2rem', paddingTop: '1rem'}}>
          {initialData?.id && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(initialData.id)}>
              Eliminar Tarea
            </button>
          )}
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Guardar Todo</button>
          </div>
        </div>

      </div>
    </div>
  );
}
