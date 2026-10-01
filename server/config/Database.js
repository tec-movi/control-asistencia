import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'control_asistencia_db',
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      dateStrings: false
    });
  }

  async query(sql, params = []) {
    const startedAt = performance.now();
    try {
      const [rows] = await this.pool.execute(sql, params);
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      const timingEnabled = process.env.DB_QUERY_TIMING === 'true';
      const slowQueryMs = Number(process.env.DB_SLOW_QUERY_MS || 500);

      if (timingEnabled || durationMs >= slowQueryMs) {
        console.info('[DB]', {
          durationMs,
          rows: Array.isArray(rows) ? rows.length : rows.affectedRows,
          query: sql.replace(/\s+/g, ' ').trim().slice(0, 160),
        });
      }

      return rows;
    } catch (error) {
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      console.error('[DB] Query failed', { durationMs, code: error.code });
      console.error('Error en la base de datos:', error.code || error.message);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

export default new Database();