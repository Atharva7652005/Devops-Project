import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false, allowAdmin = false, technicianOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to={user.role === 'technician' ? "/technician-dashboard" : "/dashboard"} replace />;
  }

  if (technicianOnly && user.role !== 'technician') {
    return <Navigate to={user.role === 'admin' ? "/admin" : "/dashboard"} replace />;
  }

  if (!adminOnly && !technicianOnly && !allowAdmin && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!adminOnly && !technicianOnly && user.role === 'technician') {
    return <Navigate to="/technician-dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
