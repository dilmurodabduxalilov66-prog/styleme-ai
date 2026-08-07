FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install mongoose class-validator class-transformer
WORKDIR /app/services/reputation-service
RUN npm install --legacy-peer-deps
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY ./services/reputation-service/package*.json ./
RUN npm install --legacy-peer-deps --only=production
COPY --from=builder /app/services/reputation-service/dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/services/reputation-service/src/main.js"]
