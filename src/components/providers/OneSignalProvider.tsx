'use client';

// OneSignalProvider - ya no necesita inicializar, se hace en el layout
export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
