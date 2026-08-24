import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, LogOut, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import '../assets/css/navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-brand">
            <div className="navbar-logo">
              <Wrench size={24} />
            </div>
            <span className="navbar-title">
              RepairHub
            </span>
          </Link>
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <span className="navbar-user-info">
                <User size={18} className="navbar-user-icon" />
                {user.name} 
                <span className="navbar-role-badge">
                  {user.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="navbar-logout-btn"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-login-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
