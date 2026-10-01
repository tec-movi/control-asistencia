import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/authContextValue';

export const PrivateRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;

  // Si no hay usuario logueado, lo devuelve al Login
  if (!user) {
    return <Navigate to="/" />;
  }

  // Si el usuario intenta entrar a una ruta de un rol que no le corresponde
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? "/admin/dashboard" : "/user/attendance"} />;
  }

  // Si todo está bien, renderiza el componente hijo
  return children;
};