FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install mongoose class-validator class-transformer
WORKDIR /app/services/auth-service
RUN npm install --legacy-peer-deps
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY ./services/auth-service/package*.json ./
RUN npm install --legacy-peer-deps --only=production
COPY --from=builder /app/services/auth-service/dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/services/auth-service/src/main.js"]
