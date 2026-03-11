import type { Config } from 'drizzle-kit';

export default {
	schema: './server/database/schema.ts',
	out: './server/database/migrations',
	dialect: 'mysql',
	dbCredentials: {
		host: process.env.NUXT_DB_HOST || 'localhost',
		port: Number(process.env.NUXT_DB_PORT) || 3306,
		user: process.env.NUXT_DB_USER || 'root',
		password: process.env.NUXT_DB_PASSWORD || 'root',
		database: process.env.NUXT_DB_NAME || 'xc-tickets',
	},
} satisfies Config;
