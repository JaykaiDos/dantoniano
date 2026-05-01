/**
 * Navegación principal — links a las secciones del sitio.
 * El estado activo se determina comparando pathname.
 * 
 * Nota: usePathname() puede retornar undefined durante SSR, lo que causa hydration mismatch.
 * Usamos suppressHydrationWarning para ignorar cambios en clases y atributos aria después de montar.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '/',            label: 'Inicio',      icon: '🏠' },
  { href: '/temporadas',  label: 'Temporadas',  icon: '📅' },
  { href: '/buscar',      label: 'Buscar',      icon: '🔍' },
  { href: '/perfil',     label: 'Perfil',     icon: '👤' },
] as const;

export function MainNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="vh-main-nav" aria-label="Navegación principal">
      <div className="vh-container">
        <ul className="vh-nav__list">
          {NAV_LINKS.map(({ href, label, icon }) => {
            // Activo exacto para home, prefijo para el resto
            // Solo aplicar lógica de activeLink si ya montó en el cliente para evitar mismatch
            const isActive = mounted 
              ? (href === '/' ? pathname === '/' : pathname.startsWith(href))
              : false;
            
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx('vh-nav__btn', isActive && 'vh-nav__btn--active')}
                  aria-current={isActive ? 'page' : undefined}
                  suppressHydrationWarning
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}