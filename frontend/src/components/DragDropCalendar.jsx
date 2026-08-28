import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from '../api/axios';
import { Clock, User } from 'lucide-react';

const DragDropCalendar = ({ onAssign }) => {
  const [data, setData] = useState({
    requests: {},
    columns: {
      'unassigned': { id: 'unassigned', title: 'Unassigned Queue', requestIds: [] },
    },
    columnOrder: ['unassigned']
  });

  const fetchData = async () => {
    try {
      const [reqRes, techRes] = await Promise.all([
        axios.get('/admin/requests?status=Pending'),
        axios.get('/admin/technicians')
      ]);

      const requests = {};
      const columns = {
        'unassigned': { id: 'unassigned', title: 'Unassigned Queue', requestIds: [] },
      };
      const columnOrder = ['unassigned'];

      // Populate Technicians as Columns
      techRes.data.forEach(tech => {
        if (tech.isAvailable) {
          columns[tech._id] = { id: tech._id, title: tech.name, requestIds: [], specialization: tech.specialization };
          columnOrder.push(tech._id);
        }
      });

      // Populate Requests
      reqRes.data.forEach(req => {
        if (!req.technician) {
          requests[req._id] = req;
          columns['unassigned'].requestIds.push(req._id);
        }
      });

      setData({ requests, columns, columnOrder });
    } catch (error) {
      console.error('Error fetching calendar data', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newRequestIds = Array.from(startColumn.requestIds);
      newRequestIds.splice(source.index, 1);
      newRequestIds.splice(destination.index, 0, draggableId);
      const newColumn = { ...startColumn, requestIds: newRequestIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    // Moving between columns
    const startRequestIds = Array.from(startColumn.requestIds);
    startRequestIds.splice(source.index, 1);
    const newStart = { ...startColumn, requestIds: startRequestIds };

    const finishRequestIds = Array.from(finishColumn.requestIds);
    finishRequestIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finishColumn, requestIds: finishRequestIds };

    setData({ ...data, columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish } });

    // Call API to assign if dropped into a technician column
    if (finishColumn.id !== 'unassigned') {
      try {
        await axios.put(`/admin/requests/${draggableId}/status`, {
          technician: finishColumn.id,
          assignedTechnician: finishColumn.title,
          status: 'Scheduled'
        });
        if (onAssign) onAssign();
        // Remove it from the board once scheduled
        setTimeout(fetchData, 1000);
      } catch (error) {
        console.error('Error assigning request via drag drop', error);
        alert('Error assigning technician');
        fetchData(); // Revert
      }
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {data.columnOrder.map(columnId => {
          const column = data.columns[columnId];
          const requests = column.requestIds.map(reqId => data.requests[reqId]);
          return (
            <div key={column.id} style={{ minWidth: '300px', background: 'var(--gray-50)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 600, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{color: columnId === 'unassigned' ? 'var(--blue-800)' : 'var(--gray-800)'}}>{column.title}</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--gray-200)', padding: '2px 8px', borderRadius: '12px' }}>{requests.length}</span>
              </div>
              {column.specialization && <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>{column.specialization}</div>}
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ background: snapshot.isDraggingOver ? 'var(--blue-50)' : 'transparent', minHeight: '150px', borderRadius: '4px', transition: 'background-color 0.2s ease' }}
                  >
                    {requests.map((req, index) => (
                      <Draggable key={req._id} draggableId={req._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              userSelect: 'none',
                              padding: '1rem',
                              margin: '0 0 8px 0',
                              backgroundColor: snapshot.isDragging ? '#e0f2fe' : '#fff',
                              color: '#333',
                              boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                              border: '1px solid var(--gray-200)',
                              borderRadius: '4px',
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--blue-600)', marginBottom: '0.5rem' }}>{req.category}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                              <span><User size={12} style={{display:'inline'}}/> {req.user?.name || 'Unknown'}</span>
                              <span><Clock size={12} style={{display:'inline'}}/> {new Date(req.preferredDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default DragDropCalendar;
