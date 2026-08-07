import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 1. Auth Service proxy mapping (port 9001)
      {
        source: '/api/v1/auth/:path*',
        destination: 'http://styleme-auth:9001/api/v1/auth/:path*',
      },
      {
        source: '/api/v1/analytics/:path*',
        destination: 'http://styleme-auth:9001/api/v1/analytics/:path*',
      },
      {
        source: '/api/v1/admin/:path*',
        destination: 'http://styleme-auth:9001/api/v1/admin/:path*',
      },
      // 2. Booking, Availability, CRM, and Portfolio mapping (port 9002)
      {
        source: '/api/v1/bookings/:path*',
        destination: 'http://styleme-booking:9002/api/v1/bookings/:path*',
      },
      {
        source: '/api/v1/barbers/availability/:path*',
        destination: 'http://styleme-booking:9002/api/v1/barbers/availability/:path*',
      },
      {
        source: '/api/v1/barbers/dossiers/:path*',
        destination: 'http://styleme-booking:9002/api/v1/barbers/dossiers/:path*',
      },
      {
        source: '/api/v1/barbers/portfolio/:path*',
        destination: 'http://styleme-booking:9002/api/v1/barbers/portfolio/:path*',
      },
      {
        source: '/api/v1/barbers/:barberId/portfolio',
        destination: 'http://styleme-booking:9002/api/v1/barbers/:barberId/portfolio',
      },
      // 3. Payment webhook and integrations (port 9003)
      {
        source: '/api/v1/payments/:path*',
        destination: 'http://styleme-payment:9003/api/v1/payments/:path*',
      },
      // 4. Reputation and S-Rank progress worker (port 9004)
      {
        source: '/api/v1/reputation/:path*',
        destination: 'http://styleme-reputation:9004/api/v1/reputation/:path*',
      },
      // 5. AI biometric mapping and try-on playground (port 8000)
      {
        source: '/api/v1/ai/:path*',
        destination: 'http://styleme-ai:8000/api/v1/ai/:path*',
      },
    ];
  },
};

export default nextConfig;
