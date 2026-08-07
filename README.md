# StyleMe AI — AI-Powered Hairstyle Try-On & Barber Marketplace

StyleMe AI is an advanced microservice-based platform that uses AI (SDXL Inpainting, InsightFace, SAM2, and MediaPipe) to detect face shapes, analyze hair texture and density, provide personalized hairstyle recommendations, and allow instant virtual haircut try-ons. It also features a full barber marketplace and booking management system.

## 🚀 Key Features

- **AI Virtual Haircut Try-On**: Realistic SDXL inpainting with custom 5-zone dynamic hair masking and Mediapipe face mesh protection.
- **Face Shape & Hair Analysis**: Real-time facial landmark scanning and hair texture/density profiling.
- **Personalized Hairstyle Catalog**: AI recommendation engine tailored for individual head shapes and features.
- **Barber Marketplace & Booking**: Real-time appointment scheduling, barber CRM, and service ledger.
- **2FA & Secure Auth**: NestJS authentication microservice with JWT token rotation, Eskiz SMS OTP verification, and password recovery.
- **Multi-Role Dashboards**: Dedicated UI views for Clients, Barbers, Admins, and Platform Owners.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Zustand.
- **AI Microservice**: FastAPI, PyTorch, MediaPipe, OpenCV, Replicate API, Cloudflare R2.
- **Backend Microservices**: NestJS (Auth, Booking, Payment, Reputation).
- **Databases & Cache**: PostgreSQL (Patroni/PostGIS), MongoDB, Redis, Apache Kafka.
- **Infrastructure**: Nginx reverse proxy, Docker & Docker Compose, Prometheus & Promtail monitoring.

## ⚙️ Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your environment credentials in `.env` (Database URLs, Redis URL, Replicate API token, Eskiz SMS credentials, JWT secrets).

3. Start all microservices using Docker Compose:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

## 📜 License

MIT License. Developed for StyleMe AI.
