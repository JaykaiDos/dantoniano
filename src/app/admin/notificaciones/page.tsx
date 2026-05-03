import { createAdminClient } from '@/lib/supabase/admin';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: notifications } = await supabase
    .from('youtube_notifications')
    .select('*')
    .order('published_at', { ascending: false });

  const CHANNEL_NAMES: Record<string, string> = {
    'UC-q98369P9K3P6-G_Z4I-fA': 'Principal',
    'UCf6vV_j6tLgJq_mZ8_O-K7A': 'Clips',
    'UCnDO8cR8PLPitCoEa1VyEJw': 'Secundario',
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair, Georgia, serif)',
          fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--vh-text-primary)', marginBottom: '0.25rem',
        }}>
          Notificaciones de YouTube 🔔
        </h1>
        <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.875rem' }}>
          Gestiona las notificaciones de videos nuevos de tus canales.
        </p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div style={{
          background: 'var(--vh-bg-card)',
          border: '1.5px solid var(--vh-border-card)',
          borderRadius: 'var(--vh-radius-xl)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: 'var(--vh-bg-elevated)',
            borderBottom: '1px solid var(--vh-border)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--vh-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <div>Canal</div>
            <div>Título</div>
            <div>Publicado</div>
            <div>Creado</div>
            <div>Acciones</div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1fr 1fr auto',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--vh-border)',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  color: 'var(--vh-text-secondary)',
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--vh-accent)',
                }}>
                  {CHANNEL_NAMES[notif.channel_id] || notif.channel_id}
                </div>
                <div style={{
                  fontWeight: 500,
                  color: 'var(--vh-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)' }}>
                  {new Date(notif.published_at).toLocaleDateString('es-AR')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)' }}>
                  {new Date(notif.created_at).toLocaleString('es-AR')}
                </div>
                <div>
                  <form
                    action="/api/admin/youtube-notifications/delete"
                    method="POST"
                    style={{ display: 'inline' }}
                  >
                    <input type="hidden" name="video_id" value={notif.video_id} />
                    <button
                      type="submit"
                      style={{
                        background: 'transparent',
                        border: '1.5px solid var(--vh-danger)',
                        color: 'var(--vh-danger)',
                        borderRadius: 'var(--vh-radius-md)',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--vh-transition)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--vh-danger)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--vh-danger)';
                      }}
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--vh-text-muted)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔕</div>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Sin notificaciones
          </p>
          <p style={{ fontSize: '0.875rem' }}>
            Las notificaciones aparecerán aquí cuando YouTube las envíe.
          </p>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Link
          href="/admin"
          style={{
            color: 'var(--vh-accent)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          ← Volver al dashboard
        </Link>
      </div>
    </div>
  );
}