import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { Login } from './pages/Login/Login';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { UserAttendance } from './pages/User/UserAttendance';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/" element={<Login />} />
          
          {/* Rutas Privadas de Administrador */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute allowedRole="ADMIN">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />

          {/* Rutas Privadas de Trabajador */}
          <Route 
            path="/user/attendance" 
            element={
              <PrivateRoute allowedRole="USER">
                <UserAttendance />
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;