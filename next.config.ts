import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.onesignal.com https://api.onesignal.com wss://*.onesignal.com",
              "worker-src 'self' blob: https://cdn.onesignal.com",
              "child-src 'self' blob: https://*.onesignal.com",
              "frame-src 'self' https://*.onesignal.com"
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
