/**
 * Hook para controlar el tema claro/oscuro.
 * Lee y escribe en localStorage + modifica data-theme en <html>.
 */
'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  // Leer tema inicial del DOM (ya fue seteado por el script inline del layout)
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
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

  return { theme, toggle, isDark: theme === 'dark' };
}