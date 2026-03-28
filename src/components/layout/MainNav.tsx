/**
 * Navegación principal — links a las secciones del sitio.
 * El estado activo se determina comparando pathname.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const NAV_LINKS = [
  { href: '/',            label: 'Inicio',      icon: '🏠' },
  { href: '/temporadas',  label: 'Temporadas',  icon: '📅' },
  { href: '/biblioteca',  label: 'Biblioteca',  icon: '📚' },
  { href: '/buscar',      label: 'Buscar',      icon: '🔍' },
] as const;

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="vh-main-nav" aria-label="Navegación principal">
      <div className="vh-container">
        <ul className="vh-nav__list">
          {NAV_LINKS.map(({ href, label, icon }) => {
            // Activo exacto para home, prefijo para el resto
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx('vh-nav__btn', isActive && 'vh-nav__btn--active')}
                  aria-current={isActive ? 'page' : undefined}
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