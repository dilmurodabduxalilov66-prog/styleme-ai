FROM node:20 AS builder
WORKDIR /app
COPY tsconfig.json ./
COPY common/ ./common/
COPY services/auth-service/ ./services/auth-service/
COPY services/payment-service/ ./services/payment-service/
WORKDIR /app/services/payment-service
RUN npm install --loglevel verbose --no-fund --no-audit
RUN npm run build

FROM node:20
WORKDIR /app/services/payment-service
COPY services/payment-service/package*.json ./
RUN npm install --omit=dev --loglevel verbose --no-fund --no-audit
COPY --from=builder /app/services/payment-service/dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/main.js"]
