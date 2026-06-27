import { Calendar as CalendarIcon, User, Flag, MoreHorizontal, CheckCircle2 } from 'lucide-react';

export default function BoardView({ tasks, onTaskClick, onAddTask, onDropTask }) {
  
  const groupedTasks = [
    {
      id: 'PENDIENTE',
      name: 'PENDIENTE',
      color: '#475569',
      tasks: tasks.filter(t => !t.status || t.status?.toUpperCase() === 'PENDIENTE')
    },
    {
      id: 'EN CURSO',
      name: 'EN CURSO',
      color: '#8b5cf6',
      tasks: tasks.filter(t => t.status?.toUpperCase() === 'EN CURSO')
    },
    {
      id: 'COMPLETADA',
      name: 'COMPLETADA',
      color: '#10b981',
      tasks: tasks.filter(t => t.status?.toUpperCase() === 'COMPLETADA')
    }
  ];

  const formatDate = (dateObj) => {
    if (!dateObj) return '-';
    const date = new Date(dateObj);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onDropTask(parseInt(taskId), status);
    }
  };

  return (
    <div className="board-view-container animate-fade-in">
      {groupedTasks.map(group => (
        <div 
          key={group.id} 
          className="board-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, group.id)}
        >
          <div className="board-column-header">
            <div className="board-status-badge" style={{backgroundColor: group.color === '#475569' ? 'transparent' : group.color, border: group.color === '#475569' ? '1px solid #475569' : 'none', color: group.color === '#475569' ? '#a3a6aa' : '#fff' }}>
              {group.id === 'COMPLETADA' && <CheckCircle2 size={12} style={{marginRight: '4px'}} />}
              {group.name} 
              <span className="board-task-count">{group.tasks.length}</span>
            </div>
            <div className="board-column-actions">
              <MoreHorizontal size={16} color="#a3a6aa" />
              <button className="add-task-icon" onClick={() => onAddTask(group.id)}>+</button>
            </div>
          </div>
          
          <div className="board-cards-list">
            {group.tasks.map(task => (
              <div 
                key={task.id} 
                className="board-card" 
                onClick={() => onTaskClick(task)}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
              >
                <div className="board-card-header">
                  <div className="circle-check-board"></div>
                  <div className="board-card-title">{task.title}</div>
                </div>
                <div className="board-card-project">En Proyecto 1</div>
                
                <div className="board-card-meta">
                  <div className="meta-icon"><User size={14} /> <span>{task.assignee || '-'}</span></div>
                  <div className="meta-icon"><CalendarIcon size={14} /> <span>{formatDate(task.end_time || task.end)}</span></div>
                  <div className="meta-icon"><Flag size={14} color={task.priority === 'Alta' || task.priority === 'Urgente' ? '#ef4444' : '#a3a6aa'} /> <span>-</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="board-add-task-btn" onClick={() => onAddTask(group.id)}>
            + Agregar Tarea
          </div>
        </div>
      ))}
      
      <div className="board-add-group">
        + Agregar grupo
      </div>
    </div>
  );
}
