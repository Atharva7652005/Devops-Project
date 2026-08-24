import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Search, Filter, Trash2, Save, X, Edit, Clock, Settings, CheckCircle, AlertCircle, TrendingUp, Users, Wrench, BookOpen, UserCheck, Tag, FileText } from 'lucide-react';
import '../../assets/css/dashboard.css';
import '../../assets/css/admin.css';
import '../../assets/css/catalog.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests'); // requests, catalog, technicians, promos, users
  
  // Data States
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [promos, setPromos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [newNote, setNewNote] = useState('');

  // Universal fetch based on tab
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'requests') {
        let query = '?';
        if (filter.status) query += `status=${filter.status}&`;
        if (filter.category) query += `category=${filter.category}`;
        const res = await axios.get(`/admin/requests${query}`);
        setRequests(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'catalog') {
        const res = await axios.get('/admin/catalog');
        setCategories(res.data);
      } else if (activeTab === 'technicians') {
        const res = await axios.get('/admin/technicians');
        setTechnicians(res.data);
      } else if (activeTab === 'promos') {
        const res = await axios.get('/admin/promos');
        setPromos(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('/admin/users');
        setUsers(res.data);
      }
    } catch (error) {
      console.error('Error fetching admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filter]);

  // --- Request Handlers ---
  const handleEditClick = (req) => {
    setEditingId(req._id);
    setEditForm({
      status: req.status,
      assignedTechnician: req.assignedTechnician,
      estimatedCost: req.estimatedCost,
    });
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`/admin/requests/${id}/status`, editForm);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error('Error updating request', error);
    }
  };

  const handleDeleteReq = async (id) => {
    if (window.confirm('Delete request permanently?')) {
      await axios.delete(`/admin/requests/${id}`);
      fetchData();
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/admin/requests/${selectedReq._id}/notes`, { note: newNote });
      setNewNote('');
      // Optimistic update for notes modal
      const res = await axios.get(`/admin/requests`); // refresh full list
      setRequests(res.data);
      setSelectedReq(res.data.find(r => r._id === selectedReq._id));
    } catch (err) {
      alert('Error adding note');
    }
  };

  const handleDeleteNote = async (reqId, noteId) => {
    try {
      await axios.delete(`/admin/requests/${reqId}/notes/${noteId}`);
      const res = await axios.get(`/admin/requests`);
      setRequests(res.data);
      setSelectedReq(res.data.find(r => r._id === selectedReq._id));
    } catch (err) {
      alert('Error deleting note');
    }
  };

  // --- Users Handlers ---
  const handleUserToggleBlock = async (user) => {
    try {
      await axios.put(`/admin/users/${user._id}`, { isBlocked: !user.isBlocked });
      fetchData();
    } catch (err) { alert('Error updating user'); }
  };

  const getStatusClass = (status) => `status-badge status-${(status || '').replace(/\s+/g, '')}`;

  return (
    <div className="layout-container max-w-7xl">
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <button className={`sidebar-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')} style={{width: '100%', border: 'none', background: activeTab === 'requests' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <Wrench className="sidebar-icon" /> Master Requests
            </button>
          </li>
          <li>
            <button className={`sidebar-link ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')} style={{width: '100%', border: 'none', background: activeTab === 'catalog' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <BookOpen className="sidebar-icon" /> Service Catalog
            </button>
          </li>
          <li>
            <button className={`sidebar-link ${activeTab === 'technicians' ? 'active' : ''}`} onClick={() => setActiveTab('technicians')} style={{width: '100%', border: 'none', background: activeTab === 'technicians' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <UserCheck className="sidebar-icon" /> Technicians
            </button>
          </li>
          <li>
            <button className={`sidebar-link ${activeTab === 'promos' ? 'active' : ''}`} onClick={() => setActiveTab('promos')} style={{width: '100%', border: 'none', background: activeTab === 'promos' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <Tag className="sidebar-icon" /> Promo Codes
            </button>
          </li>
          <li>
            <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{width: '100%', border: 'none', background: activeTab === 'users' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <Users className="sidebar-icon" /> Customers
            </button>
          </li>
        </ul>
      </aside>

      <div className="content-area">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Control Panel</h1>
            <p className="dashboard-subtitle">Manage system-wide configuration and data</p>
          </div>
          <div className="admin-badge"><Settings size={18} /> Admin Mode</div>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="card">
            <div className="data-table-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="admin-table-title"><Users size={20} className="admin-table-title-icon" /> Service Requests</h2>
              <div className="admin-filters">
                <select className="input-field filter-input" value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})}>
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <select className="input-field filter-input" value={filter.category} onChange={(e) => setFilter({...filter, category: e.target.value})}>
                  <option value="">All Categories</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer & Issue</th>
                      <th>Status & Tech</th>
                      <th>Pricing & Dates</th>
                      <th>Internal Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req._id} className={editingId === req._id ? 'edit-row' : ''}>
                        <td style={{ verticalAlign: 'top' }}>
                          <div className="item-title">{req.user?.name || 'Unknown'}</div>
                          <div className="item-tech" style={{ marginBottom: '0.5rem' }}>{req.user?.email || 'N/A'}</div>
                          <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{req.title}</div>
                          <div className="item-category">{req.category}</div>
                        </td>
                        
                        <td style={{ verticalAlign: 'top' }}>
                          {editingId === req._id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <select name="status" value={editForm.status} onChange={(e)=>setEditForm({...editForm, status: e.target.value})} className="edit-select">
                                <option>Pending</option><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                              </select>
                              <input type="text" name="assignedTechnician" value={editForm.assignedTechnician} onChange={(e)=>setEditForm({...editForm, assignedTechnician: e.target.value})} className="edit-input" placeholder="Tech name" />
                            </div>
                          ) : (
                            <div>
                              <div style={{ marginBottom: '0.5rem' }}><span className={getStatusClass(req.status)}>{req.status}</span></div>
                              <div><span className="edit-label" style={{ display: 'inline' }}>Tech: </span><span style={{ fontSize: '0.875rem' }}>{req.assignedTechnician || 'Unassigned'}</span></div>
                            </div>
                          )}
                        </td>
                        
                        <td style={{ verticalAlign: 'top' }}>
                          {editingId === req._id ? (
                            <div>
                              <label className="edit-label">Est. Cost (₹):</label>
                              <input type="number" name="estimatedCost" value={editForm.estimatedCost} onChange={(e)=>setEditForm({...editForm, estimatedCost: e.target.value})} className="edit-input" />
                            </div>
                          ) : (
                            <div>
                              <div className="item-cost">₹{req.estimatedCost || '0'}</div>
                              <div className="item-tech" style={{ marginTop: '0.5rem' }}>Pref: {new Date(req.preferredDate).toLocaleDateString()}</div>
                            </div>
                          )}
                        </td>
                        
                        <td style={{ verticalAlign: 'top' }}>
                          <button onClick={() => { setSelectedReq(req); setShowNotesModal(true); }} className="btn-cancel" style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}>
                            <FileText size={14} style={{display:'inline', marginRight: '0.25rem'}}/> {req.adminNotes?.length || 0} Logs
                          </button>
                        </td>
                        
                        <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                          {editingId === req._id ? (
                            <div className="edit-actions">
                              <button onClick={() => handleSave(req._id)} className="btn-save" title="Save"><Save size={16} /></button>
                              <button onClick={() => setEditingId(null)} className="btn-cancel-edit" title="Cancel"><X size={16} /></button>
                            </div>
                          ) : (
                            <div className="item-actions">
                              <button onClick={() => handleEditClick(req)} className="action-btn" title="Edit"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteReq(req._id)} className="action-btn action-btn-danger" title="Delete"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
             <div className="data-table-header">
                <h2 className="admin-table-title"><Users size={20} className="admin-table-title-icon" /> Customer Accounts</h2>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td style={{fontWeight: 500}}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || 'N/A'}</td>
                        <td><span className={`status-badge status-${u.role === 'admin' ? 'Completed' : 'Pending'}`}>{u.role}</span></td>
                        <td>
                          {u.isBlocked ? <span style={{color: 'red', fontWeight: 500}}>Blocked</span> : <span style={{color: 'green', fontWeight: 500}}>Active</span>}
                        </td>
                        <td style={{textAlign: 'right'}}>
                          <button onClick={() => handleUserToggleBlock(u)} className="btn-cancel" style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: u.isBlocked ? 'green' : 'red', color: u.isBlocked ? 'green' : 'red'}}>
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        )}
        
        {/* Basic placeholders for Catalog, Technicians, Promos - For full CRUD these would follow same table patterns */}
        {(activeTab === 'catalog' || activeTab === 'technicians' || activeTab === 'promos') && (
           <div className="card" style={{padding: '2rem', textAlign: 'center', color: 'var(--gray-500)'}}>
              <AlertCircle size={48} style={{margin: '0 auto 1rem', opacity: 0.5}} />
              <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard Module</h3>
              <p>CRUD interfaces for {activeTab} have been wired in the backend API.<br/>(Frontend CRUD grids would be instantiated here following the Users/Requests table pattern).</p>
           </div>
        )}

      </div>

      {/* Admin Notes Modal */}
      {showNotesModal && selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Internal Logs: {selectedReq.title}</h3>
              <button onClick={() => setShowNotesModal(false)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="notes-log" style={{marginBottom: '1rem'}}>
                {selectedReq.adminNotes?.length === 0 ? <p style={{color: 'var(--gray-500)'}}>No internal notes yet.</p> : 
                  selectedReq.adminNotes.map(note => (
                    <div key={note._id} className="note-item">
                      <div className="note-header">
                        <span className="note-author">{note.adminUser}</span>
                        <span>{new Date(note.date).toLocaleString()}</span>
                      </div>
                      <div className="note-text">{note.note}</div>
                      <div style={{marginTop: '0.5rem', textAlign: 'right'}}>
                        <button onClick={() => handleDeleteNote(selectedReq._id, note._id)} style={{color: 'red', fontSize: '0.75rem'}}>Delete</button>
                      </div>
                    </div>
                  ))
                }
              </div>
              <form onSubmit={handleAddNote} style={{display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem'}}>
                <input type="text" className="input-field" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add new internal note..." required style={{flexGrow: 1}} />
                <button type="submit" className="btn btn-primary">Add Note</button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
