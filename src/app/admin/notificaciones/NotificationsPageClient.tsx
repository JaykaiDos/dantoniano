'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  channel_id: string;
  video_id: string;
  title: string;
  published_at: string;
  created_at: string;
}

const CHANNEL_NAMES: Record<string, string> = {
  'UC-q98369P9K3P6-G_Z4I-fA': 'Principal',
  'UCf6vV_j6tLgJq_mZ8_O-K7A': 'Clips',
  'UCnDO8cR8PLPitCoEa1VyEJw': 'Secundario',
};

export default function NotificationsPage({ initialData }: { initialData: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (videoId: string) => {
    if (!confirm('¿Seguro que querés eliminar esta notificación?')) return;

    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/youtube-notifications/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_id: videoId }),
        });

        if (response.ok) {
          setNotifications((prev) => prev.filter((n) => n.video_id !== videoId));
        } else {
          alert('Error al eliminar');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
      }
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair, Georgia, serif)',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 700,
          color: 'var(--vh-text-primary)',
          marginBottom: '0.5rem',
        }}>
          Notificaciones de YouTube 🔔
        </h1>
        <p style={{ color: 'var(--vh-text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
          Gestioná las notificaciones de videos nuevos de tus canales.
        </p>
      </div>

      {notifications.length > 0 ? (
        <div style={{
          background: 'var(--vh-bg-card)',
          border: '1.5px solid var(--vh-border-card)',
          borderRadius: 'var(--vh-radius-xl)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{
                  background: 'var(--vh-bg-elevated)',
                  borderBottom: '1px solid var(--vh-border)',
                }}>
                  <th style={thStyle}>Canal</th>
                  <th style={thStyle}>Título</th>
                  <th style={thStyle}>Publicado</th>
                  <th style={thStyle}>Creado</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif, idx) => (
                  <tr
                    key={notif.id}
                    style={{
                      borderBottom: idx !== notifications.length - 1 ? '1px solid var(--vh-border)' : 'none',
                      transition: 'background var(--vh-transition)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--vh-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--vh-accent)',
                        background: 'var(--vh-accent-soft)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--vh-radius-sm)',
                        display: 'inline-block',
                      }}>
                        {CHANNEL_NAMES[notif.channel_id] || notif.channel_id}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: '400px' }}>
                      <div
                        title={notif.title}
                        style={{
                          fontWeight: 500,
                          color: 'var(--vh-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.title}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                      {new Date(notif.published_at).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                      {new Date(notif.created_at).toLocaleString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(notif.video_id)}
                        disabled={isPending}
                        style={{
                          background: isPending ? 'var(--vh-text-muted)' : 'transparent',
                          border: '1.5px solid var(--vh-danger)',
                          color: isPending ? 'var(--vh-text-muted)' : 'var(--vh-danger)',
                          borderRadius: 'var(--vh-radius-md)',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: isPending ? 'not-allowed' : 'pointer',
                          transition: 'all var(--vh-transition)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isPending) {
                            e.currentTarget.style.background = 'var(--vh-danger)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPending) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--vh-danger)';
                          }
                        }}
                      >
                        {isPending ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'var(--vh-bg-card)',
          border: '1.5px solid var(--vh-border-card)',
          borderRadius: 'var(--vh-radius-xl)',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔕</div>
          <p style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: 'var(--vh-text-primary)',
            marginBottom: '0.5rem',
          }}>
            Sin notificaciones
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--vh-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
            Las notificaciones aparecerán aquí cuando YouTube las envíe.
          </p>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Link
          href="/admin"
          className="vh-btn vh-btn--ghost"
          style={{
            color: 'var(--vh-accent)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--vh-radius-md)',
            background: 'var(--vh-accent-soft)',
            transition: 'all var(--vh-transition)',
          }}
        >
          ← Volver al dashboard
        </Link>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '1rem' as const,
  textAlign: 'left' as const,
  fontSize: '0.75rem' as const,
  fontWeight: 700 as const,
  color: 'var(--vh-text-muted)' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const tdStyle = {
  padding: '1rem',
  fontSize: '0.9rem',
  color: 'var(--vh-text-primary)',
};
