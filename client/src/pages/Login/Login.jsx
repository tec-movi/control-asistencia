import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/authContextValue';
import { loginService } from '../../services/authService';
import '../../assets/css/LiquidGlass.css';
import '../../assets/css/pages/login.css'; // Mantiene tu estilo original exactamente igual[cite: 3]

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Llamamos al servicio simulado que creamos en el paso 4
      const response = await loginService(email, password);
      
      // Guardamos la sesión en el contexto global
      login(response.user, response.token);

      // Redirigimos dependiendo del rol
      if (response.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/attendance');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <form onSubmit={handleSubmit}>
        <h2>Registro de Asistencia</h2>
        
        {/* Mostramos error si las credenciales son incorrectas */}
        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}

        <div className="input-field">
          <input 
            type="text" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <label>Ingrese su email</label>
        </div>
        
        <div className="input-field password-field">
          <input 
            type={showPassword ? 'text' : 'password'} 
            id="passwordInput" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <label htmlFor="passwordInput">Ingrese su contraseña</label>
          <button 
            type="button" 
            className="toggle-password" 
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        
        <div className="forget">
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};