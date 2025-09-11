import mysql from 'mysql2/promise';
import "dotenv/config"

export const pool = mysql.createPool({
  host: process.env.MARIA_HOST || '',
  port: 3306,
  user: process.env.MARIA_USER || '',
  password: process.env.MARIA_PASSWORD || '',
  database: 'genielabs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
