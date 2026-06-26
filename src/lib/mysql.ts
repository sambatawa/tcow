import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }

  pool = mysql.createPool({
    host: match[3],
    port: parseInt(match[4]),
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    database: match[5],
    ssl: {},
    waitForConnections: true,
    connectionLimit: 5,
    connectTimeout: 15000,
    queueLimit: 0,
  });

  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export default { getPool, query };
