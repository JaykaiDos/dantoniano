/**
 * Botón circular para alternar claro/oscuro.
 * Usa el hook useTheme y las clases vh-theme-toggle del design system.
 */
'use client';

import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="vh-theme-toggle"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
}