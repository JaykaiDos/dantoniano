/**
 * Hook para controlar el tema claro/oscuro.
 * Lee y escribe en localStorage + modifica data-theme en <html>.
 * 
 * Evita hydration mismatch inicializando el tema desde el DOM antes del render.
 */
'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

// Función para leer el tema actual del DOM sin SSR/Client mismatch
function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const current = document.documentElement.getAttribute('data-theme');
  return current === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  // Inicializa desde el DOM para evitar mismatch durante hidratación
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [mounted, setMounted] = useState(false);

  // Sincroniza una sola vez cuando monta en el cliente
  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute('data-theme');
    const actualTheme = current === 'dark' ? 'dark' : 'light';
    if (actualTheme !== theme) {
      setTheme(actualTheme);
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('vh-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('vh-theme', 'light');
    }
  };

  return { theme, toggle, isDark: theme === 'dark', mounted };
}