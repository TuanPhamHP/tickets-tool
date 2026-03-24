FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app

# Chỉ copy những gì cần để chạy
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# KHÔNG chạy migrate ở đây — migrate phải chạy riêng trước khi start
CMD ["node", ".output/server/index.mjs"]