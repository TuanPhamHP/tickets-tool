import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config(); // load .env

const connection = await mysql.createConnection({
	host: process.env.NUXT_DB_HOST || 'localhost',
	port: Number(process.env.NUXT_DB_PORT) || 3306,
	user: process.env.NUXT_DB_USER || 'root',
	password: process.env.NUXT_DB_PASSWORD || 'root',
	database: process.env.NUXT_DB_NAME || 'xc-tickets',
	multipleStatements: true,
});

console.log('🗑  Dropping all tables...');
await connection.query('SET FOREIGN_KEY_CHECKS = 0');

const [rows] = await connection.query('SHOW TABLES');
const tables = rows.map(r => Object.values(r)[0]);

for (const table of tables) {
	await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
	console.log(`   dropped: ${table}`);
}

await connection.query('SET FOREIGN_KEY_CHECKS = 1');
await connection.end();

console.log('✅ All tables dropped. Run yarn db:push to recreate.');
