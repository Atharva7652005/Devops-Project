import { useState, useEffect, useContext } from 'react';
import axios from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { Plus, X, Edit2, Trash2, Settings, AlertCircle, CheckCircle, Clock, Wrench, User, Star, Upload, Calendar } from 'lucide-react';
import '../../assets/css/dashboard.css';
import '../../assets/css/profile.css';

const CustomerDashboard = () => {
  const { user, login, updateUser } = useContext(AuthContext); // needed to update local user state if profile changes
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'profile', 'reviews'
  
  const [requests, setRequests] = useState([]);
  const [catalogOptions, setCatalogOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Modal States
  const [showReqModal, setShowReqModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReqForAction, setSelectedReqForAction] = useState(null);

  // Form States
  const [reqForm, setReqForm] = useState({ category: '', title: '', description: '', preferredDate: '', attachments: [] });
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '', emailNotif: true, smsNotif: false });
  const [rescheduleForm, setRescheduleForm] = useState({ requestedDate: '', reason: '' });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/requests/my-requests');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching requests', error);
      setRequests([]);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await axios.get('/admin/catalog');
      setCatalogOptions(res.data);
      if (res.data.length > 0) {
        setReqForm(prev => ({...prev, category: prev.category || res.data[0].name}));
      }
    } catch (error) {
      console.error('Error fetching catalog', error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchCatalog();
      await fetchRequests();
      setLoading(false);
    };
    initData();
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
        emailNotif: user.notifications?.email ?? true,
        smsNotif: user.notifications?.sms ?? false,
      });
    }
  }, [user]);

  // --- Profile Handlers ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('/users/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        pincode: profileForm.pincode,
        notifications: { email: profileForm.emailNotif, sms: profileForm.smsNotif }
      });
      if (updateUser && res.data) {
        // update local storage and context so it persists on refresh
        // we must preserve the token which isn't returned by /profile but might be in user context
        updateUser({ ...user, ...res.data }); 
      }
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Error updating profile');
    }
  };

  // --- Request Handlers ---
  const handleReqSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRequest) {
        await axios.put(`/requests/${editingRequest._id}`, reqForm);
      } else {
        if (reqForm.attachments && reqForm.attachments.length > 0) {
          const formData = new FormData();
          formData.append('category', reqForm.category);
          formData.append('title', reqForm.title);
          formData.append('description', reqForm.description);
          formData.append('preferredDate', reqForm.preferredDate);
          Array.from(reqForm.attachments).forEach(file => formData.append('attachments', file));
          await axios.post('/requests', formData);
        } else {
          await axios.post('/requests', reqForm);
        }
      }
      setShowReqModal(false);
      fetchRequests();
    } catch (error) {
      console.error('Error saving request', error);
    }
  };

  const handleReqDelete = async (id) => {
    if (window.confirm('Cancel this request?')) {
      try {
        await axios.delete(`/requests/${id}`);
        fetchRequests();
      } catch (error) {
        console.error('Error deleting request', error);
      }
    }
  };

  const handleAttachmentUpload = async (reqId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('attachment', file);
    
    try {
      await axios.post(`/requests/${reqId}/attachments`, formData);
      fetchRequests();
    } catch (err) {
      alert('Error uploading file');
    }
  };

  const handleRemoveAttachment = async (reqId, url) => {
    try {
      await axios.delete(`/requests/${reqId}/attachments`, { data: { url } });
      fetchRequests();
    } catch (err) {
      alert('Error removing file');
    }
  };

  // --- Reschedule Handlers ---
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/requests/${selectedReqForAction._id}/reschedule`, rescheduleForm);
      setShowRescheduleModal(false);
      fetchRequests();
    } catch (err) {
      alert('Error requesting reschedule');
    }
  };

  // --- Review Handlers ---
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/requests/${selectedReqForAction._id}/reviews`, reviewForm);
      setShowReviewModal(false);
      alert('Review submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting review');
    }
  };


  const getStatusClass = (status) => `status-badge status-${(status || '').replace(/\s+/g, '')}`;
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock size={14} />;
      case 'Scheduled': return <Clock size={14} />;
      case 'In Progress': return <Settings size={14} className="spinner" />;
      case 'Completed': return <CheckCircle size={14} />;
      case 'Cancelled': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="layout-container max-w-7xl">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <button className={`sidebar-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')} style={{width: '100%', border: 'none', background: activeTab === 'requests' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <Wrench className="sidebar-icon" /> My Requests
            </button>
          </li>
          <li>
            <button className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{width: '100%', border: 'none', background: activeTab === 'profile' ? 'var(--blue-50)' : 'transparent', textAlign: 'left'}}>
              <User className="sidebar-icon" /> Profile & Settings
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <div className="content-area">
        {activeTab === 'requests' && (
          <>
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">My Dashboard</h1>
                <p className="dashboard-subtitle">Manage your service and repair requests</p>
              </div>
              <button 
                onClick={() => {
                  setEditingRequest(null);
                  setReqForm({ category: catalogOptions.length > 0 ? catalogOptions[0].name : '', title: '', description: '', preferredDate: '', attachments: [] });
                  setShowReqModal(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={20} /> New Request
              </button>
            </div>

            <div className="dashboard-metrics">
              <div className="card metric-card metric-card-blue">
                <h3 className="metric-title metric-title-blue">Total Requests</h3>
                <p className="metric-value metric-value-blue">{requests.length}</p>
              </div>
              <div className="card metric-card metric-card-gold">
                <h3 className="metric-title metric-title-gold">Active Repairs</h3>
                <p className="metric-value metric-value-gold">{requests.filter(r => ['Scheduled', 'In Progress'].includes(r.status)).length}</p>
              </div>
            </div>

            <div className="card">
              <div className="data-table-header">
                <h2 className="data-table-title">Your Repair Requests</h2>
              </div>
              
              {loading ? (
                <div className="empty-state"><div className="spinner spinner-lg mx-auto"></div></div>
              ) : requests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><Wrench size={24} /></div>
                  <h3 className="empty-title">No requests yet</h3>
                  <button onClick={() => setShowReqModal(true)} className="empty-link">+ Create a Request</button>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Service Details</th>
                        <th>Status</th>
                        <th>Dates & Reschedules</th>
                        <th>Pricing</th>
                        <th>Attachments</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req._id}>
                          <td style={{verticalAlign: 'top'}}>
                            <div className="item-title">{req.title}</div>
                            <div className="item-category">{req.category}</div>
                          </td>
                          <td style={{verticalAlign: 'top'}}>
                            <span className={getStatusClass(req.status)}>{getStatusIcon(req.status)} {req.status}</span>
                            {req.technician ? (
                              <div className="item-tech" style={{marginTop: '0.5rem', background: 'var(--blue-50)', padding: '0.5rem', borderRadius: '4px'}}>
                                <div style={{fontWeight: 500, color: 'var(--blue-800)'}}>👨‍🔧 {req.technician.name}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--gray-600)'}}>{req.technician.specialization}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--gray-600)'}}>{req.technician.contactInfo}</div>
                              </div>
                            ) : (
                              <div className="item-tech" style={{marginTop: '0.5rem'}}>Tech: {req.assignedTechnician}</div>
                            )}
                          </td>
                          <td style={{verticalAlign: 'top'}}>
                            <div className="item-date">Pref: {new Date(req.preferredDate).toLocaleDateString()}</div>
                            {req.rescheduleRequests && req.rescheduleRequests.length > 0 && (
                              <div style={{fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--gold-600)'}}>
                                Reschedule: {req.rescheduleRequests[req.rescheduleRequests.length-1].status}
                              </div>
                            )}
                          </td>
                          <td style={{verticalAlign: 'top'}}>
                            <div className="item-cost">₹{req.estimatedCost || '0'}</div>
                          </td>
                          <td style={{verticalAlign: 'top'}}>
                            {req.attachments?.map((att, i) => (
                              <div key={i} style={{fontSize: '0.75rem', marginBottom: '0.25rem'}}>
                                <a href={`http://localhost:5000${att}`} target="_blank" className="attachment-link">File {i+1}</a>
                                {req.status === 'Pending' && (
                                  <button onClick={() => handleRemoveAttachment(req._id, att)} style={{color: 'red', marginLeft: '0.5rem'}}>x</button>
                                )}
                              </div>
                            ))}
                            {req.status === 'Pending' && (
                              <label style={{cursor: 'pointer', fontSize: '0.75rem', color: 'var(--blue-600)', display: 'inline-block', marginTop: '0.25rem'}}>
                                + Upload
                                <input type="file" style={{display: 'none'}} onChange={(e) => handleAttachmentUpload(req._id, e)} />
                              </label>
                            )}
                          </td>
                          <td style={{verticalAlign: 'top', textAlign: 'right'}}>
                            <div className="item-actions">
                              {req.status === 'Pending' && (
                                <>
                                  <button onClick={() => {
                                    setEditingRequest(req);
                                    let dateStr = '';
                                    try {
                                      dateStr = req.preferredDate ? new Date(req.preferredDate).toISOString().split('T')[0] : '';
                                    } catch (e) {}
                                    setReqForm({ category: req.category, title: req.title, description: req.description, preferredDate: dateStr, attachments: [] });
                                    setShowReqModal(true);
                                  }} className="action-btn" title="Edit"><Edit2 size={16} /></button>
                                  
                                  <button onClick={() => {
                                    setSelectedReqForAction(req);
                                    setRescheduleForm({ requestedDate: '', reason: '' });
                                    setShowRescheduleModal(true);
                                  }} className="action-btn" title="Reschedule"><Calendar size={16} /></button>

                                  <button onClick={() => handleReqDelete(req._id)} className="action-btn action-btn-danger" title="Cancel"><Trash2 size={16} /></button>
                                </>
                              )}
                              {req.status === 'Completed' && (
                                <button onClick={() => {
                                  setSelectedReqForAction(req);
                                  setReviewForm({ rating: 5, comment: '' });
                                  setShowReviewModal(true);
                                }} className="action-btn" title="Write Review"><Star size={16} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="card profile-card">
            <div className="profile-section">
              <h2 className="profile-section-title">Personal Information</h2>
              <form onSubmit={(e) => {
                if (!isEditingProfile) {
                  e.preventDefault();
                  setIsEditingProfile(true);
                } else {
                  handleProfileSubmit(e);
                }
              }} className="profile-grid">
                <div className="form-group">
                  <label className="label-text">Full Name</label>
                  <input type="text" className="input-field" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required disabled={!isEditingProfile} />
                </div>
                <div className="form-group">
                  <label className="label-text">Phone Number</label>
                  <input type="text" className="input-field" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="+91 ..." disabled={!isEditingProfile} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="label-text">Service / Shipping Address</label>
                  <textarea className="input-field" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} rows="3" disabled={!isEditingProfile}></textarea>
                </div>
                <div className="form-group">
                  <label className="label-text">City</label>
                  <input type="text" className="input-field" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} placeholder="e.g. Mumbai" disabled={!isEditingProfile} />
                </div>
                <div className="form-group">
                  <label className="label-text">Pincode</label>
                  <input type="text" className="input-field" value={profileForm.pincode} onChange={e => setProfileForm({...profileForm, pincode: e.target.value})} placeholder="e.g. 400001" disabled={!isEditingProfile} />
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <h3 className="profile-section-title" style={{fontSize: '1rem'}}>Notification Preferences</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <label className="toggle-container" style={{opacity: isEditingProfile ? 1 : 0.6}}>
                      <div>
                        <div className="toggle-label">Email Notifications</div>
                        <div className="toggle-desc">Receive updates about your requests via email.</div>
                      </div>
                      <input type="checkbox" checked={profileForm.emailNotif} onChange={e => setProfileForm({...profileForm, emailNotif: e.target.checked})} disabled={!isEditingProfile} />
                    </label>
                    <label className="toggle-container" style={{opacity: isEditingProfile ? 1 : 0.6}}>
                      <div>
                        <div className="toggle-label">SMS Notifications</div>
                        <div className="toggle-desc">Receive updates about your requests via SMS.</div>
                      </div>
                      <input type="checkbox" checked={profileForm.smsNotif} onChange={e => setProfileForm({...profileForm, smsNotif: e.target.checked})} disabled={!isEditingProfile} />
                    </label>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '1rem' }}>
                  {isEditingProfile ? (
                    <>
                      <button type="button" className="btn-cancel" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                    </>
                  ) : (
                    <button type="submit" className="btn btn-primary"><Edit2 size={16} style={{display: 'inline', marginRight: '0.5rem'}} /> Edit Profile</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showReqModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingRequest ? 'Edit Request' : 'New Request'}</h3>
              <button onClick={() => setShowReqModal(false)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleReqSubmit} className="modal-form">
                {!editingRequest && (
                  <>
                    <div>
                      <label className="label-text">Category</label>
                      <select className="input-field" value={reqForm.category} onChange={e => {
                        const selectedCat = catalogOptions.find(c => c.name === e.target.value);
                        setReqForm({...reqForm, category: e.target.value, title: selectedCat ? selectedCat.name : ''});
                      }}>
                        {catalogOptions.length === 0 && <option value="">No services available</option>}
                        {catalogOptions.map(cat => (
                          <option key={cat._id} value={cat.name}>{cat.name} (Base: ₹{cat.basePrice})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-text">Attachments (Optional)</label>
                      <input type="file" multiple className="input-field" style={{padding: '0.3rem'}} onChange={e => setReqForm({...reqForm, attachments: e.target.files})} />
                    </div>
                  </>
                )}
                <div>
                  <label className="label-text">Title</label>
                  <input type="text" className="input-field" value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} required disabled={!!editingRequest} />
                </div>
                <div>
                  <label className="label-text">Description</label>
                  <textarea className="input-field" rows="4" value={reqForm.description} onChange={e => setReqForm({...reqForm, description: e.target.value})} required></textarea>
                </div>
                <div>
                  <label className="label-text">Preferred Date</label>
                  <input type="date" className="input-field" value={reqForm.preferredDate} onChange={e => setReqForm({...reqForm, preferredDate: e.target.value})} required />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowReqModal(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Request Reschedule</h3>
              <button onClick={() => setShowRescheduleModal(false)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRescheduleSubmit} className="modal-form">
                <div>
                  <label className="label-text">New Proposed Date</label>
                  <input type="date" className="input-field" value={rescheduleForm.requestedDate} onChange={e => setRescheduleForm({...rescheduleForm, requestedDate: e.target.value})} required />
                </div>
                <div>
                  <label className="label-text">Reason (Optional)</label>
                  <textarea className="input-field" rows="3" value={rescheduleForm.reason} onChange={e => setRescheduleForm({...rescheduleForm, reason: e.target.value})}></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Write a Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="modal-close"><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleReviewSubmit} className="modal-form">
                <div>
                  <label className="label-text">Rating (1-5)</label>
                  <input type="number" min="1" max="5" className="input-field" value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: e.target.value})} required />
                </div>
                <div>
                  <label className="label-text">Comments</label>
                  <textarea className="input-field" rows="4" value={reviewForm.comment} onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} required></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="btn-cancel">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Review</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
