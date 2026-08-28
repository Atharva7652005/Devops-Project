import { useState, useEffect, useContext } from 'react';
import axios from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, MapPin, Receipt, X, CheckCircle2, AlertCircle, Briefcase, Calendar } from 'lucide-react';
import { io } from 'socket.io-client';
import '../../assets/css/technician.css';

const TechnicianDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [jobBoard, setJobBoard] = useState([]);
  const [mySchedule, setMySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [activeTab, setActiveTab] = useState('board');
  const [biddingReqId, setBiddingReqId] = useState(null);
  const [bidPrice, setBidPrice] = useState('');
  
  // Receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceiptReq, setSelectedReceiptReq] = useState(null);

  useEffect(() => {
    fetchRequests();
    
    // Set up WebSocket connection
    const socket = io('http://localhost:5000');
    
    socket.on('new_request', (newReq) => {
      // If it matches our specialization, add it to job board
      if (user && user.specialization && newReq.category.toLowerCase() === user.specialization.toLowerCase()) {
        setJobBoard(prev => [newReq, ...prev]);
      }
    });

    socket.on('request_claimed', ({ requestId }) => {
      // Remove it from job board
      setJobBoard(prev => prev.filter(req => req._id !== requestId));
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/technician/requests');
      setJobBoard(res.data.jobBoard);
      setMySchedule(res.data.mySchedule);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRespond = async (reqId, status, price = 0) => {
    try {
      await axios.post(`/technician/requests/${reqId}/respond`, { status, basePrice: price });
      if (status === 'Confirmed') {
        alert('Successfully claimed request! Check My Schedule.');
      }
      setBiddingReqId(null);
      setBidPrice('');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error responding to request');
    }
  };

  const handleStatusUpdate = async (reqId, status) => {
    try {
      await axios.put(`/technician/requests/${reqId}/status`, { status });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Helper to check if technician has already responded to a request
  const hasResponded = (req) => {
    return req.technicianResponses?.some(r => r.technicianId === user._id);
  };

  if (loading) return <div className="loading-container"><div className="spinner spinner-lg"></div></div>;

  return (
    <div className="layout-container max-w-7xl">
      
      {/* Sidebar */}
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-link ${activeTab === 'board' ? 'active' : ''}`} 
              onClick={() => setActiveTab('board')} 
            >
              <Briefcase className="sidebar-icon" /> Job Board
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${activeTab === 'schedule' ? 'active' : ''}`} 
              onClick={() => setActiveTab('schedule')} 
            >
              <Calendar className="sidebar-icon" /> My Schedule
            </button>
          </li>
        </ul>
      </aside>

      {/* Content Area */}
      <main className="content-area">
          
          {/* Job Board Tab */}
          {activeTab === 'board' && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 className="admin-table-title" style={{marginBottom: '1.5rem'}}>
                Available Requests {user.specialization ? `(${user.specialization})` : ''}
              </h2>
              {jobBoard.length === 0 ? (
                <div className="tech-empty-state">
                  <AlertCircle size={32} style={{marginBottom: '1rem', color: 'var(--gray-400)'}}/>
                  <p>No pending requests available at the moment.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  {jobBoard.map(req => {
                    const responded = hasResponded(req);
                    const myResponse = req.technicianResponses?.find(r => r.technicianId === user._id);

                    return (
                      <div key={req._id} className={`tech-job-card ${responded ? 'responded' : ''}`}>
                        <div className="tech-job-header">
                          <h3 className="tech-job-title">{req.title}</h3>
                          <span className="status-badge status-Pending">Pending Assignment</span>
                        </div>
                        <p className="tech-job-desc">{req.description}</p>
                        <div className="tech-job-meta">
                          <div className="tech-job-meta-item"><MapPin size={16}/> {req.user?.city} - {req.user?.pincode}</div>
                          <div className="tech-job-meta-item"><Clock size={16}/> Pref: {new Date(req.preferredDate).toLocaleDateString()}</div>
                          {req.requestedMaximumCharge > 0 && (
                            <div className="tech-job-meta-item" style={{color: 'var(--blue-700)', fontWeight: 600}}>
                              💰 Budget: ₹{req.requestedMaximumCharge}
                            </div>
                          )}
                        </div>
                        {req.attachments && req.attachments.length > 0 && (
                          <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '6px' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>Customer Attachments:</strong>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                              {req.attachments.map((att, i) => (
                                <a key={i} href={att.startsWith('http') ? att : `http://localhost:5000${att}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--blue-600)', textDecoration: 'underline' }}>
                                  📎 View File {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bidding Actions */}
                        {!responded ? (
                          biddingReqId === req._id ? (
                            <div className="tech-bidding-section">
                              <label className="tech-bidding-label">Your Price (Max: ₹{req.requestedMaximumCharge || 'N/A'}):</label>
                              <input type="number" className="tech-bidding-input" value={bidPrice} onChange={e => setBidPrice(e.target.value)} placeholder={`e.g. ${req.requestedMaximumCharge || '500'}`} autoFocus />
                              <button onClick={() => handleRespond(req._id, 'Confirmed', bidPrice)} className="btn btn-primary" disabled={!bidPrice}>Claim Request</button>
                              <button onClick={() => setBiddingReqId(null)} className="btn btn-secondary">Cancel</button>
                            </div>
                          ) : (
                            <div style={{display: 'flex', gap: '1rem'}}>
                              <button onClick={() => setBiddingReqId(req._id)} className="btn btn-primary" style={{backgroundColor: 'var(--blue-600)'}}><CheckCircle size={16} /> Accept Request</button>
                              <button onClick={() => handleRespond(req._id, 'Rejected')} className="btn btn-secondary"><XCircle size={16} /> Hide</button>
                            </div>
                          )
                        ) : (
                          <div className={`tech-response-box ${myResponse?.status === 'Confirmed' ? 'tech-response-confirmed' : 'tech-response-rejected'}`}>
                            {myResponse?.status === 'Confirmed' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
                            <span>
                              <strong>Your Response:</strong> {myResponse?.status} 
                              {myResponse?.status === 'Confirmed' && ` (Bid: ₹${myResponse?.basePrice})`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 className="admin-table-title" style={{marginBottom: '1.5rem'}}>My Assigned Jobs</h2>
              {mySchedule.length === 0 ? (
                <div className="tech-empty-state">
                  <CheckCircle size={32} style={{marginBottom: '1rem', color: 'var(--gray-400)'}}/>
                  <p>You have no assigned jobs.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                  {mySchedule.map(req => (
                    <div key={req._id} className="tech-schedule-card">
                      <div className="tech-job-header">
                        <h3 className="tech-job-title">{req.title}</h3>
                        <span className={`status-badge status-${req.status}`}>{req.status}</span>
                      </div>
                      <p className="tech-job-desc">{req.description}</p>
                      
                      <div className="tech-customer-details">
                        <div>
                          <h4>Customer Info</h4>
                          <p><strong>{req.user?.name}</strong></p>
                          <p>{req.user?.phone}</p>
                          <p>{req.user?.address}, {req.user?.city} - {req.user?.pincode}</p>
                        </div>
                        <div>
                          <h4>Job Details</h4>
                          <p><strong>Agreed Price:</strong> ₹{req.quotedCost || req.estimatedCost}</p>
                          <p><strong>Scheduled Date:</strong> {new Date(req.preferredDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {req.attachments && req.attachments.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--gray-50)', borderRadius: '6px' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>Customer Attachments:</strong>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                            {req.attachments.map((att, i) => (
                              <a key={i} href={att.startsWith('http') ? att : `http://localhost:5000${att}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--blue-600)', textDecoration: 'underline' }}>
                                📎 View File {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="tech-action-bar">
                        <button onClick={() => { setSelectedReceiptReq(req); setShowReceiptModal(true); }} className="btn btn-secondary">
                          <Receipt size={16} /> View Receipt
                        </button>
                        
                        <div style={{display: 'flex', gap: '0.75rem'}}>
                          {req.status === 'Scheduled' && (
                            <button onClick={() => handleStatusUpdate(req._id, 'In Progress')} className="btn btn-primary">Mark In Progress</button>
                          )}
                          {req.status === 'In Progress' && (
                            <button onClick={() => handleStatusUpdate(req._id, 'Completed')} className="btn btn-primary" style={{backgroundColor: '#16a34a', color: 'white'}}>Mark Completed</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

      </main>

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceiptReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Service Receipt</h3>
              <div>
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
                    <p style={{ margin: '5px 0' }}><strong>Name:</strong> {user.name}</p>
                    <p style={{ margin: '5px 0' }}><strong>Specialization:</strong> {user.specialization}</p>
                    <p style={{ margin: '5px 0' }}><strong>Contact:</strong> {user.phone}</p>
                    <p style={{ margin: '5px 0' }}><strong>Status:</strong> {selectedReceiptReq.status}</p>
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
                      <strong>Base Price:</strong>
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

export default TechnicianDashboard;
