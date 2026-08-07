FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm config set fetch-retries 5 -g
RUN npm install --legacy-peer-deps --no-fund --no-audit
COPY . .
RUN npm run build

FROM node:20
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
CMD ["npm", "start"]
