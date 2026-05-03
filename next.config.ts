import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir scripts de OneSignal
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)?',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self' data: https:;
              connect-src 'self' https://*.onesignal.com https://api.onesignal.com wss://*.onesignal.com;
              frame-src 'self' https://*.onesignal.com;
              worker-src 'self' blob: https://cdn.onesignal.com;
              child-src 'self' blob: https://*.onesignal.com;
            `.replace(/\s+/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
