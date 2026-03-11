FROM node:20
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["sh", "-c", "yarn db:push; echo 'DB done, starting server...'; node .output/server/index.mjs"]
