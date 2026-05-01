/**
 * Botón circular para alternar claro/oscuro.
 * Usa el hook useTheme y las clases vh-theme-toggle del design system.
 * 
 * Nota: Solo renderiza el emoji después de montar para evitar hydration mismatch.
 * Durante SSR, renderiza un placeholder que se reemplaza en el cliente.
 */
'use client';

import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Solo renderiza el contenido correcto después de montar
  const emoji = isClient ? (isDark ? '🌙' : '☀️') : '🌙';

  return (
    <button
      onClick={toggle}
      className="vh-theme-toggle"
      aria-label="Alternar tema"
      title="Alternar tema"
      suppressHydrationWarning
    >
      {emoji}
    </button>
  );
}