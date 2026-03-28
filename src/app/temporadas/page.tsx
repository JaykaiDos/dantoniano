/**
 * Página de todas las temporadas — grid de SeasonCards.
 * Server Component: fetcha desde Supabase directamente.
 */
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';
import { MainNav } from '@/components/layout/MainNav';
import { SeasonCard } from '@/components/ui/SeasonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Temporadas — Dantoniano',
};

export default async function TemporadasPage() {
  const supabase = await createClient();

  // Traer temporadas con conteo de animes
  const { data: seasons } = await supabase
    .from('seasons')
    .select(`
      *,
      anime_count:animes(count)
    `)
    .order('year', { ascending: false })
    .order('cour', { ascending: true });

  // Normalizar el count que viene como array de Supabase
  const seasonsNormalized = (seasons ?? []).map(s => ({
    ...s,
    anime_count: (s.anime_count as any)?.[0]?.count ?? 0,
  }));

  const current  = seasonsNormalized.filter(s => s.is_current);
  const past     = seasonsNormalized.filter(s => !s.is_current);

  return (
    <>
      <Header />
      <MainNav />
      <main>
        <div className="vh-container vh-view">

          {/* Header de sección */}
          <div className="vh-section-header">
            <div>
              <h2 className="vh-section-title">Temporadas 📅</h2>
              <p className="vh-section-subtitle">
                {seasonsNormalized.length} temporadas · explorá por estación
              </p>
            </div>
          </div>

          {seasonsNormalized.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Sin temporadas aún"
              description="El admin todavía no cargó ninguna temporada."
            />
          ) : (
            <>
              {/* Temporada actual destacada */}
              {current.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                  <h3 style={{
                    fontSize: '0.85rem', fontWeight: 700,
                    color: 'var(--vh-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: '1rem',
                  }}>
                    🔴 En curso
                  </h3>
                  <div className="vh-cards-grid" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  }}>
                    {current.map(s => <SeasonCard key={s.id} season={s} />)}
                  </div>
                </section>
              )}

              {/* Temporadas pasadas */}
              {past.length > 0 && (
                <section>
                  <h3 style={{
                    fontSize: '0.85rem', fontWeight: 700,
                    color: 'var(--vh-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    marginBottom: '1rem',
                  }}>
                    📦 Anteriores
                  </h3>
                  <div className="vh-cards-grid" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  }}>
                    {past.map(s => <SeasonCard key={s.id} season={s} />)}
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </main>
    </>
  );
}