FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install mongoose class-validator class-transformer --fetch-timeout=1000000 --fetch-retries=5 --fetch-timeout=1000000 --fetch-retries=5
WORKDIR /app/services/booking-service
RUN npm install mongoose class-validator class-transformer --fetch-timeout=1000000 --fetch-retries=5
RUN npm run build

FROM node:20
WORKDIR /app
COPY ./services/booking-service/package*.json ./
RUN npm install mongoose class-validator class-transformer --fetch-timeout=1000000 --fetch-retries=5 --only=production
COPY --from=builder /app/services/booking-service/dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/services/booking-service/src/main.js"]
