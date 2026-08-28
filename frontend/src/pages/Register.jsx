import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Wrench } from 'lucide-react';
import '../assets/css/auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [specialization, setSpecialization] = useState('');
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalSpecialization = specialization === 'Other' ? customSpecialization : specialization;
      
      const userData = {
        name,
        email,
        password,
        role,
        specialization: role === 'technician' ? finalSpecialization : undefined,
        phone: role === 'technician' ? phone : undefined
      };
      
      const user = await register(userData);
      
      if (user.role === 'technician') {
        navigate('/technician-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="auth-shape register-shape-1"></div>
        <div className="auth-shape register-shape-2"></div>
        <div className="auth-shape auth-shape-3"></div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-container auth-icon-gold">
            <Wrench size={32} />
          </div>
          <h2 className="auth-title">
            Create your account
          </h2>
          <p className="auth-subtitle">
            Join us to start booking repairs
          </p>
        </div>
        
        {error && (
          <div className="auth-error">
            <p className="auth-error-text">{error}</p>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="label-text" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="input-field"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label-text" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text" htmlFor="role">I want to register as a</label>
            <select 
              id="role" 
              className="input-field" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="technician">Technician</option>
            </select>
          </div>

          {role === 'technician' && (
            <div style={{ padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label-text" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="label-text" htmlFor="specialization">Technician Type</label>
                <select 
                  id="specialization" 
                  className="input-field" 
                  value={specialization} 
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                >
                  <option value="" disabled>Select specialization...</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Appliance Repair">Appliance Repair</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {specialization === 'Other' && (
                <div>
                  <label className="label-text" htmlFor="customSpecialization">Specify Your Type</label>
                  <input
                    id="customSpecialization"
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. HVAC Specialist"
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-secondary auth-submit-btn">
            Sign up
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link auth-link-gold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
