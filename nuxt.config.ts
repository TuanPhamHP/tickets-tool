// https://nuxt.com/docs/api/configuration/nuxt-config
//@ts-ignore
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
	ui: {
		theme: {
			default: 'light',
			auto: false,
		},
	},
	future: {
		compatibilityVersion: 4,
	},
	compatibilityDate: '2025-03-22',
	devtools: { enabled: true },
	ssr: false,
	nitro: {
		preset: 'node-server',
		experimental: {
			database: true,
		},
	},
	runtimeConfig: {
		jwtSecret: process.env.NUXT_JWT_SECRET || 'xc-ticket-secret-key-2025',
		dbHost: process.env.NUXT_DB_HOST || 'localhost',
		dbPort: process.env.NUXT_DB_PORT || '3306',
		dbUser: process.env.NUXT_DB_USER || 'root',
		dbPassword: process.env.NUXT_DB_PASSWORD || 'root',
		dbName: process.env.NUXT_DB_NAME || 'xc-tickets',
		public: {
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost',
			kztekBaseUrl: process.env.NUXT_PUBLIC_KZ_TEK_URL || 'http://localhost',
			xApiKey: process.env.NUXT_PUBLIC_X_API_KEY || 'default-key',
			minioBaseUrl: process.env.NUXT_PUBLIC_MINIO_URL || 'default-key',
		},
	},
	modules: ['@nuxt/ui', '@nuxt/image', '@nuxt/icon', '@nuxt/eslint', '@pinia/nuxt'],
	css: ['assets/style/global.css'],
	vite: {
		plugins: [tailwindcss()],
	},
	plugins: ['~/services/index.ts'],
	app: {
		head: {
			titleTemplate: 'Xuân Cương - %s',
			title: 'Tra cứu xe',
			link: [
				{
					rel: 'preconnect',
					href: 'https://fonts.googleapis.com',
				},
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
				},
				{ rel: 'icon', type: 'image/x-icon', href: '/logo_web.svg' },
			],
			meta: [{ name: 'color-scheme', content: 'light' }],
		},
	},
});
