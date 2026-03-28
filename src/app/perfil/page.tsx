/**
 * Página pública de perfil — foto, bio y redes sociales.
 */
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil — Dantoniano',
};

const SOCIAL_CONFIG = [
  { key: 'youtube_channel', label: 'YouTube',    icon: '▶️', color: '#ff0000', bg: 'rgba(255,0,0,0.08)',       border: 'rgba(255,0,0,0.25)'       },
  { key: 'kick_channel',    label: 'Kick',        icon: '🟢', color: '#53fc18', bg: 'rgba(83,252,24,0.08)',     border: 'rgba(83,252,24,0.25)'     },
  { key: 'twitter',         label: 'Twitter / X', icon: '🐦', color: '#1d9bf0', bg: 'rgba(29,155,240,0.08)',    border: 'rgba(29,155,240,0.25)'    },
  { key: 'instagram',       label: 'Instagram',   icon: '📸', color: '#e1306c', bg: 'rgba(225,48,108,0.08)',    border: 'rgba(225,48,108,0.25)'    },
  { key: 'discord',         label: 'Discord',     icon: '💬', color: '#5865f2', bg: 'rgba(88,101,242,0.08)',    border: 'rgba(88,101,242,0.25)'    },
  { key: 'twitch',          label: 'Twitch',      icon: '🎮', color: '#9146ff', bg: 'rgba(145,70,255,0.08)',    border: 'rgba(145,70,255,0.25)'    },
] as const;

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profile').select('*').single();

  const hasSocials = SOCIAL_CONFIG.some(
    ({ key }) => !!profile?.[key as keyof typeof profile]
  );

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view" style={{ maxWidth: '680px' }}>

          {/* ── Tarjeta principal ── */}
          <div style={{
            background:   'var(--vh-bg-card)',
            border:       '1.5px solid var(--vh-border-card)',
            borderRadius: 'var(--vh-radius-xl)',
            boxShadow:    'var(--vh-shadow-lg)',
            overflow:     'hidden',
            marginBottom: '1.5rem',
          }}>
            {/* Foto de portada / banner */}
<div style={{
  width: '100%',
  minHeight: '120px',
  background: 'linear-gradient(135deg, var(--vh-accent) 0%, var(--vh-accent-2) 100%)',
  position: 'relative',
  overflow: 'hidden',
}}>
  {profile?.avatar_url && (
    <img
      src={profile.avatar_url}
      alt={profile.display_name}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        maxHeight: '480px',
        objectFit: 'cover',
      }}
    />
  )}
  {/* Degradado inferior para legibilidad */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '80px',
    background: 'linear-gradient(to top, var(--vh-bg-card), transparent)',
  }} />
</div>

            {/* Info */}
            <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
              <h1 style={{
                fontFamily:   'var(--font-playfair, Georgia, serif)',
                fontSize:     '1.9rem',
                fontWeight:   700,
                color:        'var(--vh-text-primary)',
                marginBottom: '0.5rem',
                lineHeight:   1.15,
              }}>
                {profile?.display_name ?? 'Dantoniano'}
              </h1>

              {profile?.bio && (
                <p style={{
                  color:      'var(--vh-text-secondary)',
                  fontSize:   '0.97rem',
                  lineHeight: 1.65,
                  maxWidth:   '520px',
                }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* ── Redes sociales ── */}
          <section>
            <h2 style={{
              fontFamily:    'var(--font-playfair, Georgia, serif)',
              fontSize:      '1.2rem',
              fontWeight:    700,
              color:         'var(--vh-text-primary)',
              marginBottom:  '1rem',
              letterSpacing: '-0.01em',
            }}>
              Encontrame en 🌐
            </h2>

            {!hasSocials ? (
              <div className="vh-empty-state">
                <span style={{ fontSize: '2rem' }}>🌐</span>
                <p className="vh-empty-state__text">
                  Las redes sociales aún no fueron configuradas.
                </p>
              </div>
            ) : (
              <div style={{
                display:               'grid',
                gridTemplateColumns:   'repeat(auto-fill, minmax(200px, 1fr))',
                gap:                   '0.75rem',
              }}>
                {SOCIAL_CONFIG.map(({ key, label, icon, color, bg, border }) => {
                  const url = profile?.[key as keyof typeof profile] as string | undefined;
                  if (!url) return null;

                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        className="social-card"
                        style={{
                          display:      'flex',
                          alignItems:   'center',
                          gap:          '0.875rem',
                          padding:      '1rem 1.1rem',
                          background:   bg,
                          border:       `1.5px solid ${border}`,
                          borderRadius: 'var(--vh-radius-lg)',
                          cursor:       'pointer',
                          transition:   'all var(--vh-transition)',
                        }}
                      >
                        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color }}>
                            {label}
                          </div>
                          <div style={{
                            fontSize:     '0.72rem',
                            color:        'var(--vh-text-muted)',
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace:   'nowrap',
                          }}>
                            {url.replace('https://', '').replace('http://', '')}
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--vh-text-muted)', fontSize: '0.9rem', flexShrink: 0 }}>
                          →
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </main>
    </>
  );
}