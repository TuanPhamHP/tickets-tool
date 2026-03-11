FROM node:20
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["node", ".output/server/index.mjs"]