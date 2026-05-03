import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir OneSignal en producción
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com 'wasm-unsafe-eval' 'inline-speculation-rules'; worker-src 'self' blob: https://cdn.onesignal.com; child-src 'self' blob: https://*.onesignal.com; connect-src 'self' https://*.onesignal.com https://api.onesignal.com wss://*.onesignal.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
