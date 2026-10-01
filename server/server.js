import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import './config/Database.js';
import userRoutes from './routes/userRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

const app = express();

// 1. MIDDLEWARES (Los traductores)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 2. RUTAS
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);

// 3. INICIO DEL SERVIDOR
const port = Number(process.env.PORT || 3000);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
}

export default app;
