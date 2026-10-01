import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/authContextValue';
import { 
  LogOut, Search, ChevronDown, Download, Calendar, Users,
  LayoutDashboard, Settings, UserPlus, Pencil, Trash2, UserRoundCheck
} from 'lucide-react';
import { getReportsService } from '../../services/attendanceService';
import { getUsersService, createUserService, updateUserService, deleteUserService, activateUserService } from '../../services/userService';
import '../../assets/css/LiquidGlass.css';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [activeReport, setActiveReport] = useState('late');
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER', password: '' });

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const fetchUsers = async () => {
    const data = await getUsersService();
    setUsersList(data);
    return data;
  };

  useEffect(() => {
    fetchUsers().catch((error) => console.error("Error cargando usuarios", error));
  }, []);

  useEffect(() => {
    let active = true;
    getReportsService(activeReport).then((reportData) => {
      if (active) setReports(reportData);
    });
    return () => { active = false; };
  }, [activeReport]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Abrir modal para Crear
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'USER', password: '' });
    setIsUserModalOpen(true);
  };

  // Abrir modal para Editar (GU-02)
  const handleOpenEdit = (user) => {
    setEditingId(user.id);
    setFormData({ 
      name: user.nombre, 
      email: user.email, 
      role: user.rol === 'Administrador' ? 'ADMIN' : 'USER',
      password: ''
    });
    setIsUserModalOpen(true);
  };

  // Guardar (Crear o Modificar)
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingId) {
        response = await updateUserService(editingId, formData);
      } else {
        response = await createUserService(formData);
      }
      setIsUserModalOpen(false);
      await fetchUsers();
      alert(response.message || 'Usuario guardado correctamente');
    } catch (error) {
      alert(error.response?.data?.error || "Error al guardar el usuario");
    }
  };

  // Eliminar / Desactivar (GU-03)
  const handleDeleteUser = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas dar de baja a este usuario?')) {
      try {
        const response = await deleteUserService(id);
        await fetchUsers();
        alert(response.message || 'Usuario dado de baja exitosamente');
      } catch (error) {
        alert(error.response?.data?.error || "No se pudo dar de baja al usuario");
      }
    }
  };

  const handleActivateUser = async (id) => {
    if (window.confirm('¿Deseas reactivar este usuario? Podrá volver a iniciar sesión.')) {
      try {
        const response = await activateUserService(id);
        await fetchUsers();
        alert(response.message || 'Usuario reactivado correctamente');
      } catch (error) {
        alert(error.response?.data?.error || "No se pudo reactivar al usuario");
      }
    }
  };

  const selectReport = (reportType) => {
    setActiveReport(reportType);
    setActiveTab('reports');
  };

  const reportConfig = {
    late: {
      code: 'RE-01', statusClass: 'badge-warning', statusLabel: 'Atraso',
      title: 'Reporte de Atrasos', description: 'Entradas registradas después de las 09:30 am',
      totalLabel: 'Total atrasos', averageLabel: 'Promedio atraso', averageValue: '14 min', timeLabel: 'Hora de Entrada',
    },
    earlyDeparture: {
      code: 'RE-02', statusClass: 'badge-alert', statusLabel: 'Salida anticipada',
      title: 'Reporte de Salidas Anticipadas', description: 'Salidas registradas antes del término de la jornada',
      totalLabel: 'Total salidas anticipadas', averageLabel: 'Promedio salida', averageValue: '16:40 pm', timeLabel: 'Hora de Salida',
    },
    absence: {
      code: 'RE-03', statusClass: 'badge-danger', statusLabel: 'Inasistencia',
      title: 'Reporte de Inasistencias', description: 'Trabajadores sin registro de asistencia',
      totalLabel: 'Total inasistencias', averageLabel: 'Días registrados', averageValue: '1 día', timeLabel: null,
    },
  };

  const selectedReport = reportConfig[activeReport];

  return (
    <div className="app-container bg-admin">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-sm"></div>
          <span className="body-bold">Admin Panel</span>
        </div>
        <nav className="nav-menu">
          <button className="nav-item"><LayoutDashboard size={18}/> Dashboard</button>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18}/> Usuarios
          </button>
          <button
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setIsReportsOpen(!isReportsOpen)}
          >
            <Calendar size={18}/>
            <span className="nav-item-label">Reportes</span>
            <ChevronDown className={`submenu-chevron ${isReportsOpen ? 'open' : ''}`} size={16}/>
          </button>
          {isReportsOpen && (
            <div className="reports-submenu">
              <button className={`submenu-item ${activeReport === 'late' && activeTab === 'reports' ? 'active' : ''}`} onClick={() => selectReport('late')}>Atrasos</button>
              <button className={`submenu-item ${activeReport === 'earlyDeparture' && activeTab === 'reports' ? 'active' : ''}`} onClick={() => selectReport('earlyDeparture')}>Salidas anticipadas</button>
              <button className={`submenu-item ${activeReport === 'absence' && activeTab === 'reports' ? 'active' : ''}`} onClick={() => selectReport('absence')}>Inasistencias</button>
            </div>
          )}
          <div className="nav-spacer"></div>
          <button className="nav-item" onClick={handleLogout}><LogOut size={18}/> Salir</button>
        </nav>
      </div>

      {/* Main Area */}
      <div className="admin-main">
        {activeTab === 'users' && (
          <>
            <div className="page-header">
              <h1 className="h1-text">Gestión de Usuarios</h1>
              <button className="glass-btn-primary" onClick={handleOpenCreate}>
                <span className="flex-center gap-2"><UserPlus size={16}/> Nuevo Usuario</span>
              </button>
            </div>
            
            <div className="glass-card table-container mt-4">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Nombre</th><th>Correo</th><th>Cargo</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isActive = Number(u.estado) === 1;

                    return (
                    <tr key={u.id} className={!isActive ? 'user-row-inactive' : ''}>
                      <td>EMP-{u.id}</td>
                      <td className="body-bold">{u.nombre}</td>
                      <td className="opacity-65">{u.email}</td>
                      <td>{u.rol}</td>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px' }}>
                        <button className="icon-btn" onClick={() => handleOpenEdit(u)} title="Editar">
                          <Pencil size={16}/>
                        </button>
                        {isActive && (
                          <button className="icon-btn" onClick={() => handleDeleteUser(u.id)} title="Dar de baja">
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        )}
                        {!isActive && (
                          <button className="icon-btn" onClick={() => handleActivateUser(u.id)} title="Reactivar usuario">
                            <UserRoundCheck size={16} color="#22c55e" />
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ... Lógica de la pestaña de reportes (sin cambios) ... */}
      </div>

      {/* Modal Crear / Editar Usuario */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="glass-modal" style={{ width: '480px' }}>
            <h2 className="modal-title w-full" style={{ textAlign: 'left' }}>
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={handleSubmitUser} className="w-full flex-col-center gap-2" style={{ alignItems: 'stretch' }}>
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input 
                  required type="text" className="glass-input" 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Correo electrónico</label>
                <input 
                  required type="email" className="glass-input" 
                  value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="flex gap-2 w-full">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Rol</label>
                  <select 
                    className="glass-input" 
                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                    style={{ appearance: 'auto', backgroundColor: 'rgba(0,0,0,0.2)' }}
                  >
                    <option value="USER">Estándar</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              {!editingId && (
                <div className="input-group">
                  <label className="input-label">Contraseña temporal</label>
                  <input
                    required
                    type="password"
                    className="glass-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              )}

              <div className="modal-actions flex-end gap-2 mt-4">
                <button type="button" className="glass-btn-secondary" onClick={() => setIsUserModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="glass-btn-primary">
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};