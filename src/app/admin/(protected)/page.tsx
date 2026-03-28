import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createAdminClient();

  const [
    { count: totalSeasons   },
    { count: totalAnimes    },
    { count: totalReactions },
  ] = await Promise.all([
    supabase.from('seasons').select('*',   { count: 'exact', head: true }),
    supabase.from('animes').select('*',    { count: 'exact', head: true }),
    supabase.from('reactions').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { icon: '📅', label: 'Temporadas',  value: totalSeasons   ?? 0, href: '/admin/temporadas' },
    { icon: '🎌', label: 'Animes',      value: totalAnimes    ?? 0, href: '/admin/animes'     },
    { icon: '▶️', label: 'Reacciones',  value: totalReactions ?? 0, href: '/admin/reacciones' },
  ];

  return (
    <div>
      <h1 style={{
        fontFamily: 'var(--font-playfair, Georgia, serif)',
        fontSize: '1.75rem', fontWeight: 700,
        color: 'var(--vh-text-primary)', marginBottom: '0.5rem',
      }}>
        Dashboard 📊
      </h1>
      <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Bienvenido al panel de administración de Dantoniano Hub.
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem', marginBottom: '2.5rem',
      }}>
        {stats.map(({ icon, label, value, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--vh-bg-card)',
              border: '1.5px solid var(--vh-border-card)',
              borderRadius: 'var(--vh-radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--vh-shadow-sm)',
              transition: 'all var(--vh-transition)',
              cursor: 'pointer',
            }}
            className="vh-card"
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
              <div style={{
                fontFamily: 'var(--font-playfair, Georgia, serif)',
                fontSize: '2rem', fontWeight: 700,
                color: 'var(--vh-accent)', lineHeight: 1,
              }}>
                {value}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--vh-text-muted)', marginTop: '0.25rem' }}>
                {label}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Acciones rápidas */}
      <h2 style={{
        fontSize: '1rem', fontWeight: 700,
        color: 'var(--vh-text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginBottom: '1rem',
      }}>
        Acciones rápidas
      </h2>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { href: '/admin/temporadas/nueva', label: '+ Nueva temporada' },
          { href: '/admin/animes/nuevo',     label: '+ Nuevo anime'     },
          { href: '/admin/reacciones/nueva', label: '+ Nueva reacción'  },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="vh-btn vh-btn--primary" style={{ fontSize: '0.875rem' }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}