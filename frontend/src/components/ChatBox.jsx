import { useState, useEffect, useRef, useContext } from 'react';
import axios from '../api/axios';
import { Send } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ChatBox = ({ requestId }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/chat/${requestId}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await axios.post(`/chat/${requestId}`, { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px', border: '1px solid var(--gray-200)', borderRadius: '8px', background: '#fff' }}>
      <div style={{ padding: '1rem', background: 'var(--blue-50)', borderBottom: '1px solid var(--gray-200)', fontWeight: 600 }}>
        Request Chat
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((msg, idx) => {
          const isMine = msg.sender?._id === user._id || msg.sender === user._id;
          return (
            <div key={idx} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.2rem', textAlign: isMine ? 'right' : 'left' }}>
                {msg.sender?.name || 'Unknown'} {msg.sender?.role === 'admin' ? '(Admin)' : ''}
              </div>
              <div style={{
                background: isMine ? 'var(--blue-600)' : 'var(--gray-100)',
                color: isMine ? '#fff' : '#333',
                padding: '0.5rem 1rem',
                borderRadius: '16px',
                borderBottomRightRadius: isMine ? '4px' : '16px',
                borderBottomLeftRadius: !isMine ? '4px' : '16px',
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', padding: '1rem', borderTop: '1px solid var(--gray-200)', gap: '0.5rem' }}>
        <input 
          type="text" 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-300)' }} 
        />
        <button type="submit" style={{ background: 'var(--blue-600)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 1rem', cursor: 'pointer' }}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
