export default function ListView({ tasks, onTaskClick, onAddTask }) {
  
  const groupedTasks = [
    {
      id: 'EN CURSO',
      name: 'EN CURSO',
      color: '#8b5cf6',
      tasks: tasks.filter(t => t.status?.toUpperCase() === 'EN CURSO')
    },
    {
      id: 'PENDIENTE',
      name: 'PENDIENTE',
      color: '#475569',
      tasks: tasks.filter(t => !t.status || t.status?.toUpperCase() === 'PENDIENTE')
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

  return (
    <div className="list-view-container animate-fade-in">
      {groupedTasks.map(group => (
        <div key={group.id} className="list-group">
          <div className="list-group-header">
            <div className="status-indicator" style={{backgroundColor: group.color}}></div>
            <span className="status-name">{group.name}</span>
            <span className="task-count">{group.tasks.length}</span>
          </div>
          
          <table className="task-table">
            <thead>
              <tr>
                <th style={{width: '40%'}}>Nombre</th>
                <th>Persona asignada</th>
                <th>Fecha límite</th>
                <th>Prioridad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {group.tasks.map(task => (
                <tr key={task.id} className="task-row" onClick={() => onTaskClick(task)} style={{cursor: 'pointer'}}>
                  <td>
                    <div className="task-name-cell">
                      <div className="circle-check"></div>
                      <span style={{color: task.color || '#fff'}}>{task.title}</span>
                    </div>
                  </td>
                  <td>
                    {task.assignee ? (
                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <div className="avatar-placeholder" style={{backgroundColor: '#0ea5e9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}>
                          {task.assignee.charAt(0).toUpperCase()}
                        </div>
                        <span style={{fontSize: '0.85rem'}}>{task.assignee}</span>
                      </div>
                    ) : (
                      <div className="avatar-placeholder"></div>
                    )}
                  </td>
                  <td style={{fontSize: '0.85rem'}}>{formatDate(task.end_time || task.end)}</td>
                  <td>
                    <span style={{fontSize: '0.85rem', color: task.priority === 'Alta' || task.priority === 'Urgente' ? '#ef4444' : '#a3a6aa'}}>
                      {task.priority || 'Normal'}
                    </span>
                  </td>
                  <td><span className="badge" style={{backgroundColor: group.color}}>{group.name}</span></td>
                </tr>
              ))}
              {group.tasks.length === 0 && (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', color: '#475569', padding: '1rem'}}>
                    No hay tareas en este estado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="add-task-inline" onClick={() => onAddTask(group.id)}>
            <span className="plus">+</span> Agregar tarea a {group.name.toLowerCase()}
          </div>
        </div>
      ))}
    </div>
  );
}
