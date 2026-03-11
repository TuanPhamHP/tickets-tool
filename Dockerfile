FROM node:20 AS build

WORKDIR /app

# Copy package để cache npm install
COPY package*.json ./
RUN npm install

# Copy toàn bộ source
COPY . .

# Build production
RUN npm run generate   

# Output dist nằm ở .output/public hoặc dist tùy project