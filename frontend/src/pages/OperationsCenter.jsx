import { useEffect, useState } from 'react';
import { Bell, CheckCircle, CreditCard, Mail, MessageSquare, Send, Smartphone } from 'lucide-react';
import axios from '../api/axios';
import '../assets/css/operations.css';

const OperationsCenter = () => {
  const [activeTab, setActiveTab] = useState('payment');
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState({});
  const [selectedRequest, setSelectedRequest] = useState('');
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'card', cardLast4: '' });
  const [notificationForm, setNotificationForm] = useState({ channel: 'sms', template: 'request_update', subject: '', message: '' });
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [requestResponse, paymentResponse, notificationResponse, templateResponse] = await Promise.all([
        axios.get('/requests/my-requests'),
        axios.get('/payments/my-payments'),
        axios.get('/notifications'),
        axios.get('/notifications/templates'),
      ]);
      const nextRequests = Array.isArray(requestResponse.data) ? requestResponse.data : [];
      setRequests(nextRequests);
      setPayments(paymentResponse.data || []);
      setNotifications(notificationResponse.data || []);
      setTemplates(templateResponse.data || {});
      const defaultTemplate = templateResponse.data?.request_update;
      if (defaultTemplate) {
        setNotificationForm((form) => ({
          ...form,
          subject: defaultTemplate.subject || '',
          message: defaultTemplate.message || '',
        }));
      }
      if (nextRequests.length && !selectedRequest) {
        setSelectedRequest(nextRequests[0]._id);
        setPaymentForm((form) => ({ ...form, amount: nextRequests[0].estimatedCost || '' }));
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Unable to load operations data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const showTemplate = (template) => {
    const selected = templates[template];
    if (selected) setNotificationForm((form) => ({ ...form, subject: selected.subject || '', message: selected.message || '' }));
  };

  const handleRequestChange = (event) => {
    const request = requests.find((item) => item._id === event.target.value);
    setSelectedRequest(event.target.value);
    setPaymentForm((form) => ({ ...form, amount: request?.estimatedCost || '' }));
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    try {
      const created = await axios.post('/payments', { serviceRequest: selectedRequest, amount: paymentForm.amount, method: paymentForm.method });
      await axios.post(`/payments/${created.data._id}/confirm`, { cardLast4: paymentForm.cardLast4 });
      setNotice({ type: 'success', text: 'Mock payment succeeded. No real funds were moved.' });
      setPaymentForm((form) => ({ ...form, cardLast4: '' }));
      loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Mock payment failed' });
    }
  };

  const handleNotification = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/notifications/send', notificationForm);
      setNotice({ type: 'success', text: `Mock ${notificationForm.channel.toUpperCase()} delivery recorded.` });
      loadData();
    } catch (error) {
      setNotice({ type: 'error', text: error.response?.data?.message || 'Notification could not be sent' });
    }
  };

  return (
    <div className="operations-page max-w-7xl">
      <div className="operations-heading">
        <div>
          <p className="eyebrow">Integration Sandbox</p>
          <h1 className="dashboard-title">Payments & Communications</h1>
          <p className="dashboard-subtitle">Exercise the customer payment, SMS, and email delivery flows with mock providers.</p>
        </div>
        <Bell className="operations-heading-icon" size={30} />
      </div>

      <div className="operations-tabs" role="tablist">
        <button className={activeTab === 'payment' ? 'operations-tab active' : 'operations-tab'} onClick={() => setActiveTab('payment')}><CreditCard size={17} /> Payment</button>
        <button className={activeTab === 'sms' ? 'operations-tab active' : 'operations-tab'} onClick={() => { setActiveTab('sms'); setNotificationForm((form) => ({ ...form, channel: 'sms' })); }}><Smartphone size={17} /> SMS</button>
        <button className={activeTab === 'email' ? 'operations-tab active' : 'operations-tab'} onClick={() => { setActiveTab('email'); setNotificationForm((form) => ({ ...form, channel: 'email' })); }}><Mail size={17} /> Email</button>
      </div>

      {notice.text && <div className={`operations-notice ${notice.type}`}><CheckCircle size={17} /> {notice.text}</div>}
      {loading ? <div className="operations-loading">Loading operation history...</div> : (
        <div className="operations-grid">
          <section className="card operations-panel">
            {activeTab === 'payment' ? (
              <>
                <div className="panel-title"><CreditCard size={20} /><h2>Mock payment</h2></div>
                <p className="panel-copy">Create and confirm a payment against one of your service requests. Use any four digits as the card suffix.</p>
                <form className="operations-form" onSubmit={handlePayment}>
                  <label className="label-text">Service request<select className="input-field" value={selectedRequest} onChange={handleRequestChange} required><option value="">Select a request</option>{requests.map((request) => <option key={request._id} value={request._id}>{request.title}</option>)}</select></label>
                  <label className="label-text">Amount (INR)<input className="input-field" type="number" min="1" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} required /></label>
                  <label className="label-text">Payment method<select className="input-field" value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}><option value="card">Card</option><option value="upi">UPI</option><option value="cash">Cash</option></select></label>
                  {paymentForm.method === 'card' && <label className="label-text">Mock card last four digits<input className="input-field" inputMode="numeric" maxLength="4" value={paymentForm.cardLast4} onChange={(event) => setPaymentForm({ ...paymentForm, cardLast4: event.target.value })} placeholder="4242" required /></label>}
                  <button className="btn btn-primary" type="submit"><CreditCard size={17} /> Pay securely (mock)</button>
                </form>
              </>
            ) : (
              <>
                <div className="panel-title">{activeTab === 'sms' ? <MessageSquare size={20} /> : <Mail size={20} />}<h2>Send mock {activeTab}</h2></div>
                <p className="panel-copy">The server checks your saved contact and notification preference, then records a provider reference.</p>
                <form className="operations-form" onSubmit={handleNotification}>
                  <label className="label-text">Template<select className="input-field" value={notificationForm.template} onChange={(event) => { setNotificationForm({ ...notificationForm, template: event.target.value }); showTemplate(event.target.value); }}><option value="request_update">Request update</option><option value="payment_confirmation">Payment confirmation</option><option value="appointment_reminder">Appointment reminder</option></select></label>
                  {activeTab === 'email' && <label className="label-text">Subject<input className="input-field" value={notificationForm.subject} onChange={(event) => setNotificationForm({ ...notificationForm, subject: event.target.value })} required /></label>}
                  <label className="label-text">Message<textarea className="input-field" rows="5" value={notificationForm.message} onChange={(event) => setNotificationForm({ ...notificationForm, message: event.target.value })} required /></label>
                  <button className="btn btn-secondary" type="submit"><Send size={17} /> Send {activeTab} (mock)</button>
                </form>
              </>
            )}
          </section>

          <section className="card operations-panel history-panel">
            <div className="panel-title"><CheckCircle size={20} /><h2>Delivery history</h2></div>
            {activeTab === 'payment' ? payments.map((payment) => <div className="history-row" key={payment._id}><div><strong>{payment.serviceRequest?.title || 'Service request'}</strong><span>{payment.method.toUpperCase()} · {payment.providerReference || 'Pending'}</span></div><span className={`status-badge status-${payment.status === 'succeeded' ? 'Completed' : 'Pending'}`}>{payment.status}</span></div>) : notifications.filter((item) => item.channel === activeTab).map((item) => <div className="history-row" key={item._id}><div><strong>{item.template.replaceAll('_', ' ')}</strong><span>{item.recipient} · {item.providerReference}</span></div><span className="status-badge status-Completed">{item.status}</span></div>)}
            {((activeTab === 'payment' && !payments.length) || (activeTab !== 'payment' && !notifications.some((item) => item.channel === activeTab))) && <p className="history-empty">No {activeTab} activity yet.</p>}
          </section>
        </div>
      )}
    </div>
  );
};

export default OperationsCenter;
