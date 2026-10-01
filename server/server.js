import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

const app = express();

// 1. MIDDLEWARES (Los traductores)
app.use(cors());
app.use(express.json()); // Traduce el JSON
app.use(express.urlencoded({ extended: true })); // Traduce si viene de un formulario normal

// 2. RUTAS
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);

// 3. INICIO DEL SERVIDOR
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
