import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import TechnicianDashboard from './pages/technician/TechnicianDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import OperationsCenter from './pages/OperationsCenter';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Routes */}
              <Route element={<ProtectedRoute adminOnly={false} allowAdmin />}>
                <Route path="/dashboard" element={<CustomerDashboard />} />
                <Route path="/operations" element={<OperationsCenter />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute adminOnly={true} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>

              {/* Technician Routes */}
              <Route element={<ProtectedRoute technicianOnly={true} />}>
                <Route path="/technician-dashboard" element={<TechnicianDashboard />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
