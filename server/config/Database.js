import mysql from 'mysql2/promise';
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'control_asistencia_db'
    });
  }

  async query(sql, params) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error("Error en la base de datos:", error);
      throw error;
    }
  }
}

export default new Database();