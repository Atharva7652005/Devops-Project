import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Search, Filter, Trash2, Save, X, Edit, Clock, Settings, CheckCircle, AlertCircle, TrendingUp, Users, Wrench, BookOpen, UserCheck, Tag, FileText, Receipt, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../../assets/css/dashboard.css';
import '../../assets/css/admin.css';
import '../../assets/css/catalog.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests'); // requests, catalog, technicians, users
  
  // Data States
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptReq, setSelectedReceiptReq] = useState(null);

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
        const techRes = await axios.get('/admin/technicians');
        setTechnicians(techRes.data);
      } else if (activeTab === 'catalog') {
        const res = await axios.get('/admin/catalog');
        setCategories(res.data);
      } else if (activeTab === 'technicians') {
        const res = await axios.get('/admin/technicians');
        setTechnicians(res.data);

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
      technician: req.technician ? req.technician._id : '',
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

  // --- Catalog Handlers ---
  const [catForm, setCatForm] = useState({ name: '', basePrice: '', description: '' });
  const [editingCatId, setEditingCatId] = useState(null);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        await axios.put(`/admin/catalog/${editingCatId}`, catForm);
      } else {
        await axios.post(`/admin/catalog`, catForm);
      }
      setEditingCatId(null);
      setCatForm({ name: '', basePrice: '', description: '' });
      fetchData();
    } catch (err) { alert('Error saving category'); }
  };
  const handleDeleteCategory = async (id) => {
    if(window.confirm('Delete category?')) {
      await axios.delete(`/admin/catalog/${id}`);
      fetchData();
    }
  };

  // --- Technicians Handlers ---
  const [techForm, setTechForm] = useState({ name: '', specialization: '', contactInfo: '' });
  const [editingTechId, setEditingTechId] = useState(null);

  const handleSaveTech = async (e) => {
    e.preventDefault();
    try {
      if (editingTechId) {
        await axios.put(`/admin/technicians/${editingTechId}`, techForm);
      } else {
        await axios.post(`/admin/technicians`, techForm);
      }
      setEditingTechId(null);
      setTechForm({ name: '', specialization: '', contactInfo: '' });
      fetchData();
    } catch (err) { alert('Error saving technician'); }
  };
  const handleDeleteTech = async (id) => {
    if(window.confirm('Delete technician?')) {
      await axios.delete(`/admin/technicians/${id}`);
      fetchData();
    }
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
                          <div className="item-title" 
                               style={{ cursor: 'pointer', color: 'var(--blue-600)' }} 
                               onClick={() => req.user && setSelectedUserDetails(req.user)}>
                            {req.user?.name || 'Unknown'}
                          </div>
                          <div className="item-tech" style={{ marginBottom: '0.5rem' }}>{req.user?.email || 'N/A'}</div>
                          <div style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{req.title}</div>
                          <div className="item-category" style={{marginBottom: '0.5rem'}}>{req.category}</div>
                          {req.attachments && req.attachments.length > 0 && (
                            <div className="attachments-list" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem'}}>
                              {req.attachments.map((att, i) => (
                                <a key={i} href={`http://localhost:5000${att}`} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.75rem', color: 'var(--blue-600)', textDecoration: 'underline'}}>
                                  📎 File {i+1}
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        
                        <td style={{ verticalAlign: 'top' }}>
                          {editingId === req._id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <select name="status" value={editForm.status} onChange={(e)=>setEditForm({...editForm, status: e.target.value})} className="edit-select">
                                <option>Pending</option><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
                              </select>
                              <select name="technician" value={editForm.technician || ''} onChange={(e)=>setEditForm({...editForm, technician: e.target.value})} className="edit-select">
                                <option value="">Unassigned</option>
                                {technicians.map(t => (
                                  <option key={t._id} value={t._id}>{t.name} ({t.specialization})</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div>
                              <div style={{ marginBottom: '0.5rem' }}><span className={getStatusClass(req.status)}>{req.status}</span></div>
                              {req.technician ? (
                                <div><span className="edit-label" style={{ display: 'inline' }}>Tech: </span><span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--blue-700)' }}>👨‍🔧 {req.technician.name}</span></div>
                              ) : (
                                <div><span className="edit-label" style={{ display: 'inline' }}>Tech: </span><span style={{ fontSize: '0.875rem' }}>{req.assignedTechnician || 'Unassigned'}</span></div>
                              )}
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
                              <button onClick={() => { setSelectedReceiptReq(req); setShowReceiptModal(true); }} className="action-btn" title="View Receipt"><Receipt size={16} /></button>
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
                        <td style={{fontWeight: 500}}>
                          <span style={{ cursor: 'pointer', color: 'var(--blue-600)' }} onClick={() => setSelectedUserDetails(u)}>
                            {u.name}
                          </span>
                        </td>
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
        
        {/* Catalog Tab */}
        {activeTab === 'catalog' && (
          <div className="card">
            <div className="data-table-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="admin-table-title"><BookOpen size={20} className="admin-table-title-icon" /> Service Catalog</h2>
              <button className="btn btn-primary" onClick={() => { setCatForm({ name: '', basePrice: '', description: '' }); setEditingCatId(null); document.getElementById('catFormContainer').style.display='block'; }}>+ Add Category</button>
            </div>
            
            <div id="catFormContainer" style={{display: editingCatId ? 'block' : 'none', padding: '1rem', background: 'var(--gray-50)', marginBottom: '1rem', borderRadius: '8px'}}>
               <form onSubmit={handleSaveCategory} style={{display:'flex', gap:'1rem', alignItems:'center', flexWrap: 'wrap'}}>
                 <input type="text" placeholder="Name" className="input-field" value={catForm.name} onChange={e=>setCatForm({...catForm, name: e.target.value})} required/>
                 <input type="number" placeholder="Base Price" className="input-field" value={catForm.basePrice} onChange={e=>setCatForm({...catForm, basePrice: e.target.value})} required/>
                 <input type="text" placeholder="Description" className="input-field" value={catForm.description} onChange={e=>setCatForm({...catForm, description: e.target.value})} required style={{flexGrow:1}}/>
                 <button type="submit" className="btn btn-primary">Save</button>
                 <button type="button" className="btn-cancel" onClick={() => { setEditingCatId(null); document.getElementById('catFormContainer').style.display='none'; }}>Cancel</button>
               </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Base Price</th><th>Description</th><th style={{textAlign:'right'}}>Actions</th></tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c._id}>
                      <td style={{fontWeight:500}}>{c.name}</td>
                      <td>₹{c.basePrice}</td>
                      <td>{c.description}</td>
                      <td style={{textAlign:'right'}}>
                        <div className="item-actions" style={{justifyContent: 'flex-end'}}>
                           <button onClick={() => { setEditingCatId(c._id); setCatForm({name: c.name, basePrice: c.basePrice, description: c.description}); document.getElementById('catFormContainer').style.display='block'; }} className="action-btn" title="Edit"><Edit size={16}/></button>
                           <button onClick={() => handleDeleteCategory(c._id)} className="action-btn action-btn-danger" title="Delete"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Technicians Tab */}
        {activeTab === 'technicians' && (
          <div className="card">
            <div className="data-table-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <h2 className="admin-table-title"><UserCheck size={20} className="admin-table-title-icon" /> Technicians</h2>
              <button className="btn btn-primary" onClick={() => { setTechForm({ name: '', specialization: '', contactInfo: '' }); setEditingTechId(null); document.getElementById('techFormContainer').style.display='block'; }}>+ Add Technician</button>
            </div>
            
            <div id="techFormContainer" style={{display: editingTechId ? 'block' : 'none', padding: '1rem', background: 'var(--gray-50)', marginBottom: '1rem', borderRadius: '8px'}}>
               <form onSubmit={handleSaveTech} style={{display:'flex', gap:'1rem', alignItems:'center', flexWrap: 'wrap'}}>
                 <input type="text" placeholder="Name" className="input-field" value={techForm.name} onChange={e=>setTechForm({...techForm, name: e.target.value})} required/>
                 <input type="text" placeholder="Specialization" className="input-field" value={techForm.specialization} onChange={e=>setTechForm({...techForm, specialization: e.target.value})} required/>
                 <input type="text" placeholder="Contact Info" className="input-field" value={techForm.contactInfo} onChange={e=>setTechForm({...techForm, contactInfo: e.target.value})} required style={{flexGrow:1}}/>
                 <button type="submit" className="btn btn-primary">Save</button>
                 <button type="button" className="btn-cancel" onClick={() => { setEditingTechId(null); document.getElementById('techFormContainer').style.display='none'; }}>Cancel</button>
               </form>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Specialization</th><th>Contact</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr>
                </thead>
                <tbody>
                  {technicians.map(t => (
                    <tr key={t._id}>
                      <td style={{fontWeight:500}}>{t.name}</td>
                      <td>{t.specialization}</td>
                      <td>{t.contactInfo}</td>
                      <td><span className={t.isAvailable ? 'status-badge status-Completed' : 'status-badge status-Cancelled'}>{t.isAvailable ? 'Available' : 'Busy'}</span></td>
                      <td style={{textAlign:'right'}}>
                        <div className="item-actions" style={{justifyContent: 'flex-end'}}>
                           <button onClick={() => { setEditingTechId(t._id); setTechForm({name: t.name, specialization: t.specialization, contactInfo: t.contactInfo}); document.getElementById('techFormContainer').style.display='block'; }} className="action-btn" title="Edit"><Edit size={16}/></button>
                           <button onClick={() => handleDeleteTech(t._id)} className="action-btn action-btn-danger" title="Delete"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* User Details Modal */}
      {selectedUserDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Customer Details</h3>
              <button onClick={() => setSelectedUserDetails(null)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                <strong style={{color: 'var(--gray-600)'}}>Name:</strong> <span>{selectedUserDetails.name}</span>
                <strong style={{color: 'var(--gray-600)'}}>Phone:</strong> <span>{selectedUserDetails.phone || 'N/A'}</span>
                <strong style={{color: 'var(--gray-600)'}}>Email:</strong> <span>{selectedUserDetails.email}</span>
                <strong style={{color: 'var(--gray-600)'}}>Address:</strong> <span>{selectedUserDetails.address || 'N/A'}</span>
                <strong style={{color: 'var(--gray-600)'}}>City:</strong> <span>{selectedUserDetails.city || 'N/A'}</span>
                <strong style={{color: 'var(--gray-600)'}}>Pincode:</strong> <span>{selectedUserDetails.pincode || 'N/A'}</span>
                <strong style={{color: 'var(--gray-600)'}}>Status:</strong> 
                <span style={{fontWeight: 500, color: selectedUserDetails.isBlocked ? 'red' : 'green'}}>
                  {selectedUserDetails.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <div className="modal-footer" style={{ borderTop: 'none', padding: 0, justifyContent: 'center' }}>
                <button type="button" onClick={() => setSelectedUserDetails(null)} className="btn btn-primary" style={{ width: '100%' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceiptReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Service Receipt</h3>
              <div>
                <button onClick={() => {
                  const element = document.getElementById('receipt-content');
                  const opt = {
                    margin: 0.5,
                    filename: `receipt_${selectedReceiptReq._id}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                  };
                  html2pdf().set(opt).from(element).save();
                }} className="btn btn-primary" style={{marginRight: '10px'}}><Download size={16} style={{display:'inline', marginRight: '5px'}}/> Download PDF</button>
                <button onClick={() => setShowReceiptModal(false)} className="modal-close" style={{position: 'relative', top: '2px'}}><X size={20} /></button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div id="receipt-content" style={{ padding: '20px', backgroundColor: '#fff', color: '#333', fontFamily: 'sans-serif' }}>
                
                <div style={{ textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                  <h1 style={{ margin: 0, color: 'var(--blue-600)', fontSize: '24px' }}>RepairHub Receipt</h1>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>Service Request #{selectedReceiptReq._id.slice(-6).toUpperCase()}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#666' }}>Date: {new Date(selectedReceiptReq.createdAt).toLocaleDateString()}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', color: 'var(--blue-800)', marginTop: 0 }}>Customer Details</h3>
                    <p style={{ margin: '5px 0' }}><strong>Name:</strong> {selectedReceiptReq.user?.name || 'N/A'}</p>
                    <p style={{ margin: '5px 0' }}><strong>Email:</strong> {selectedReceiptReq.user?.email || 'N/A'}</p>
                    <p style={{ margin: '5px 0' }}><strong>Phone:</strong> {selectedReceiptReq.user?.phone || 'N/A'}</p>
                    <p style={{ margin: '5px 0' }}><strong>Address:</strong> {selectedReceiptReq.user?.address || 'N/A'}, {selectedReceiptReq.user?.city || 'N/A'} - {selectedReceiptReq.user?.pincode || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', color: 'var(--blue-800)', marginTop: 0 }}>Technician Details</h3>
                    <p style={{ margin: '5px 0' }}><strong>Name:</strong> {selectedReceiptReq.technician?.name || selectedReceiptReq.assignedTechnician || 'Unassigned'}</p>
                    <p style={{ margin: '5px 0' }}><strong>Status:</strong> {selectedReceiptReq.status}</p>
                    {selectedReceiptReq.technician && (
                      <>
                        <p style={{ margin: '5px 0' }}><strong>Specialization:</strong> {selectedReceiptReq.technician.specialization}</p>
                        <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {selectedReceiptReq.technician.contactInfo}</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', color: 'var(--blue-800)' }}>Service Details</h3>
                  <p style={{ margin: '5px 0' }}><strong>Category:</strong> {selectedReceiptReq.category}</p>
                  <p style={{ margin: '5px 0' }}><strong>Issue:</strong> {selectedReceiptReq.title}</p>
                  <p style={{ margin: '5px 0' }}><strong>Description:</strong> {selectedReceiptReq.description}</p>
                  <p style={{ margin: '5px 0' }}><strong>Preferred Date:</strong> {new Date(selectedReceiptReq.preferredDate).toLocaleDateString()}</p>
                </div>

                <div style={{ marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '300px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.1rem' }}>
                      <strong>Estimated Cost:</strong>
                      <strong>₹{selectedReceiptReq.estimatedCost || '0'}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>*Final price may vary after inspection</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
