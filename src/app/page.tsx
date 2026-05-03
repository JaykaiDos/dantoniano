/**
 * Home — hero + stats + temporada actual + últimas reacciones.
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { SeasonCard } from '@/components/ui/SeasonCard';
import { ReactionCard } from '@/components/ui/ReactionCard';
import { GlobalSubscribeButton } from '@/components/ui/GlobalSubscribeButton';

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: seasons },
    { data: recentReactions },
    { data: stats },
  ] = await Promise.all([
    supabase.from('seasons').select('*, anime_count:animes(count)')
      .order('year', { ascending: false }).limit(4),
    supabase.from('reactions').select('*, anime:animes(title, cover_url, season_id)')
      .order('created_at', { ascending: false }).limit(6),
    supabase.from('animes').select('personal_status', { count: 'exact' }),
  ]);

  const seasonsNorm = (seasons ?? []).map(s => ({
    ...s,
    anime_count: (s.anime_count as { count: number }[])?.[0]?.count ?? 0,
  }));

  const totalAnimes = stats?.length ?? 0;
  const completados = stats?.filter(a => a.personal_status === 'completado').length ?? 0;

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view">

          {/* ── Hero ── */}
          <section className="vh-hero-section" style={{
            textAlign: 'center', padding: '3rem 1rem 3.5rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎌</div>
            <h2 className="vh-hero-title" style={{
              fontFamily: 'var(--font-playfair, Georgia, serif)',
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              fontWeight: 700, color: 'var(--vh-text-primary)',
              letterSpacing: '-0.02em', lineHeight: 1.15,
              marginBottom: '1rem',
            }}>
              Las reacciones de{' '}
              <span style={{
                color: 'var(--vh-accent)',
                textShadow: '0 0 28px rgba(72,202,228,0.4)',
              }}>
                xdantonioxd21
              </span>
            </h2>
            <p style={{
              color: 'var(--vh-text-secondary)', fontSize: '1rem',
              maxWidth: '520px', margin: '0 auto 2rem', lineHeight: 1.6,
            }}>
              Todas las reacciones de anime organizadas por temporada.
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          <GlobalSubscribeButton />
        </div>
        <div className="vh-hero-stats" style={{
              display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
            }}>
              {[
                { value: seasonsNorm.length, label: 'Temporadas' },
                { value: totalAnimes,        label: 'Animes'     },
                { value: completados,        label: 'Completados'},
              ].map(({ value, label }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div className="vh-hero-stat-value" style={{
                    fontFamily: 'var(--font-playfair, Georgia, serif)',
                    fontSize: '2rem', fontWeight: 700,
                    color: 'var(--vh-accent)', lineHeight: 1,
                  }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--vh-text-muted)', marginTop: '0.25rem' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Temporadas recientes ── */}
          <section style={{ marginBottom: '3rem' }}>
            <div className="vh-section-header">
              <div>
                <h3 className="vh-section-title">Temporadas 📅</h3>
                <p className="vh-section-subtitle">Explorá por estación</p>
              </div>
              <Link href="/temporadas" className="vh-btn vh-btn--ghost" style={{ fontSize: '0.85rem' }}>
                Ver todas →
              </Link>
            </div>
            <div className="vh-cards-grid" style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            }}>
              {seasonsNorm.map(s => <SeasonCard key={s.id} season={s} />)}
            </div>
          </section>

          {/* ── Últimas reacciones ── */}
          {recentReactions && recentReactions.length > 0 && (
            <div className="vh-reactions-box">
              <section>
                <div className="vh-section-header">
                  <div>
                    <h3 className="vh-section-title">Últimas reacciones ▶</h3>
                    <p className="vh-section-subtitle">Lo más reciente del canal</p>
                  </div>
                </div>
                <div className="vh-cards-grid" style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                }}>
                  {recentReactions.map(r => (
                    <ReactionCard
                      key={r.id}
                      reaction={{
                        ...r,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        anime_cover: (r.anime as any)?.cover_url ?? undefined,
                      }}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}

        </div>
      </main>
    </>
  );
}