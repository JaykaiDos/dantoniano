import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar CSP estricto de Next.js para permitir OneSignal
  // La CSP se maneja manualmente en el layout si es necesario
  async headers() {
    return [];
  },
};

export default nextConfig;
