import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../database/schema';
import { sql } from 'drizzle-orm';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDB() {
	if (_db) return _db;

	const config = useRuntimeConfig();

	const pool = mysql.createPool({
		host: config.dbHost || 'localhost',
		port: Number(config.dbPort) || 3306,
		user: config.dbUser || 'root',
		password: config.dbPassword || 'root',
		database: config.dbName || 'xc-tickets',
		charset: 'utf8mb4',
		waitForConnections: true,
		connectionLimit: 10,
		timezone: 'Z',
	});

	// Force MySQL session timezone to UTC so TIMESTAMP values are always returned as UTC
	pool.on('connection', (connection) => {
		connection.query("SET time_zone = '+00:00'");
	});

	_db = drizzle(pool, { schema, mode: 'default' });
	return _db;
}

export async function generateTicketCode(): Promise<string> {
	const year = new Date().getFullYear();
	const db = useDB();
	const result = await db.execute<[{ count: number }]>(
		sql`SELECT COUNT(*) as count FROM tickets WHERE YEAR(created_at) = ${year}`,
	);
	const count = (Number((result[0] as any)?.[0]?.count) ?? 0) + 1;
	return `XC-${year}-${String(count).padStart(4, '0')}`;
}
