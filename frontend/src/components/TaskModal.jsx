import { useState, useEffect } from 'react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'];
const STATUSES = ['Pendiente', 'En progreso', 'Completada'];

export default function TaskModal({ isOpen, onClose, onSave, onDelete, initialData }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    progress: 0,
    status: 'Pendiente',
    color: '#3b82f6'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_time: formatDateTime(initialData.start_time),
        end_time: formatDateTime(initialData.end_time)
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_time: formatDateTime(new Date()),
        end_time: formatDateTime(new Date(new Date().getTime() + 60 * 60 * 1000)), // +1 hour
        progress: 0,
        status: 'Pendiente',
        color: '#3b82f6'
      });
    }
  }, [initialData, isOpen]);

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      start_time: new Date(formData.start_time),
      end_time: new Date(formData.end_time)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData?.id ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input 
              type="text" 
              name="title" 
              value={formData.title} 
              onChange={handleChange} 
              className="input-field" 
              placeholder="¿Qué tienes que hacer?"
              required 
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              className="input-field" 
              rows="3"
              placeholder="Detalles de la tarea..."
            />
          </div>

          <div className="flex-row">
            <div className="form-group">
              <label>Inicio</label>
              <input 
                type="datetime-local" 
                name="start_time" 
                value={formData.start_time} 
                onChange={handleChange} 
                className="input-field" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Fin</label>
              <input 
                type="datetime-local" 
                name="end_time" 
                value={formData.end_time} 
                onChange={handleChange} 
                className="input-field" 
                required 
              />
            </div>
          </div>

          <div className="flex-row">
            <div className="form-group">
              <label>Estado</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Progreso: {formData.progress}%</label>
              <input 
                type="range" 
                name="progress" 
                min="0" 
                max="100" 
                value={formData.progress} 
                onChange={handleChange} 
                className="input-field" 
                style={{padding: '0'}}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-btn ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            {initialData?.id && (
              <button type="button" className="btn btn-danger" onClick={() => onDelete(initialData.id)}>
                Eliminar
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
