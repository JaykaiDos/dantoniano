/**
 * Layout del panel admin — sidebar + área de contenido.
 * Solo se renderiza si el middleware ya validó la sesión.
 */
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/components/admin/SignOutButton';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/temporadas', label: 'Temporadas', icon: '📅' },
  { href: '/admin/animes', label: 'Animes', icon: '🎌' },
  { href: '/admin/reacciones', label: 'Reacciones', icon: '▶️' },
  { href: '/admin/notificaciones', label: 'Notificaciones', icon: '🔔' },
  { href: '/admin/procesador', label: 'Procesador', icon: '⚡' },
  { href: '/admin/perfil', label: 'Redes', icon: '👤' },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/admin/login');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: 'var(--vh-bg-surface)',
        borderRight: '1.5px solid var(--vh-border)',
        backdropFilter: 'var(--vh-glass-blur)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem 1.25rem 1rem',
          borderBottom: '1px solid var(--vh-border)',
        }}>
          <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>🔐</div>
          <div style={{
            fontFamily: 'var(--font-playfair, Georgia, serif)',
            fontSize: '1.1rem', fontWeight: 700,
            color: 'var(--vh-text-primary)',
          }}>
            Panel Admin
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', marginTop: '0.2rem' }}>
            Dantoniano Hub
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {NAV_ITEMS.map(({ href, label, icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--vh-radius-md)',
                    textDecoration: 'none',
                    color: 'var(--vh-text-secondary)',
                    fontSize: '0.9rem', fontWeight: 500,
                    transition: 'all var(--vh-transition)',
                  }}
                  className="admin-nav-link"
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer del sidebar */}
        <div style={{
          padding: '1rem 0.75rem',
          borderTop: '1px solid var(--vh-border)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <Link
            href="/"
            style={{
              fontSize: '0.8rem', color: 'var(--vh-text-muted)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            ← Ver sitio público
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}