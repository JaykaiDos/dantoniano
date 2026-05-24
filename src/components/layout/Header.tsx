/**
 * Header global — logo + tagline + theme toggle.
 * Sticky con glassmorphism idéntico al referencia.css.
 */
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header() {
  return (
    <header className="vh-header">
      <div className="vh-container">
        <div className="vh-header__inner">
          {/* Brand */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="vh-header__brand">
              <span className="vh-header__logo">🎌</span>
              <h1 className="vh-header__title">
                Danton<span className="vh-header__accent">iano</span>
              </h1>
              <span className="vh-header__tagline">reacciones de anime</span>
            </div>
          </Link>

          {/* Controles */}
          <div className="vh-header__controls">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}