import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { markAttendanceService } from '../../services/attendanceService';
import { AuthContext } from '../../context/authContextValue';
import { CheckCircle, LogOut } from 'lucide-react';
import '../../assets/css/LiquidGlass.css';

export const UserAttendance = () => {
  const [modalData, setModalData] = useState({ isOpen: false, title: '', message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date()); // Estado para el reloj
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Efecto para actualizar el reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer); // Limpieza del intervalo
  }, []);

  const handleAttendance = async (type) => {
    setIsLoading(true);
    const userId = user?.id || 2; 
    const response = await markAttendanceService(userId, type);
    
    setModalData({
      isOpen: true,
      title: '¡Registro exitoso!',
      message: response.message,
      type: type,
      timestamp: response.timestamp
    });
    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Formateadores de fecha y hora
  const timeString = currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="app-container bg-user">
      <div className="blob blob-cyan"></div>
      <div className="blob blob-pink"></div>

      <div className="topbar glass-card radius-bottom-0">
        <div className="user-info">
          <div className="avatar">{user?.name ? user.name.charAt(0) : 'U'}</div>
          <div>
            <p className="body-bold">{user?.name || 'Trabajador'}</p>
            <p className="caption-text opacity-65">ID: EMP-{user?.id ?? 'N/A'}</p>
          </div>
        </div>
        <button className="glass-btn-secondary" onClick={handleLogout}>
          <span className="flex-center gap-2"><LogOut size={16}/> Cerrar sesión</span>
        </button>
      </div>

      <div className="main-content center-content">
        <div className="clock-widget">
          {/* Reloj Dinámico */}
          <h1 className="display-time">{timeString}</h1> 
          <p className="body-text opacity-70" style={{ textTransform: 'capitalize' }}>
            {dateString}
          </p>
        </div>

        <div className="glass-card actions-container">
          <button className="glass-btn-primary btn-large" onClick={() => handleAttendance('entrada')} disabled={isLoading}>
            <span className="flex-col-center gap-2">
              <CheckCircle size={32} />
              {isLoading ? 'Registrando...' : 'Marcar Entrada'}
            </span>
          </button>
          
          <button className="glass-btn-primary btn-large btn-variant" onClick={() => handleAttendance('salida')} disabled={isLoading}>
            <span className="flex-col-center gap-2">
              <LogOut size={32} />
              {isLoading ? 'Registrando...' : 'Marcar Salida'}
            </span>
          </button>
        </div>
      </div>

      {modalData.isOpen && (
        <div className="modal-overlay">
          <div className="glass-modal">
            <div className="modal-content">
              <CheckCircle className="modal-icon text-success" size={64} />
              <h2 className="modal-title">{modalData.title}</h2>
              <div className="record-details">
                <div className="detail-row"><span>Acción:</span><span>{modalData.type}</span></div>
                <div className="detail-row"><span>Mensaje:</span><span>{modalData.message}</span></div>
                <div className="detail-row"><span>Fecha/Hora:</span><span>{new Date(modalData.timestamp).toLocaleString()}</span></div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="glass-btn-primary w-full" onClick={() => setModalData({ ...modalData, isOpen: false })}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};