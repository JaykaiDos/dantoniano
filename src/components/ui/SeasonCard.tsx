/**
 * Card de temporada para el grid de /temporadas y el Home.
 * Diseño glass con hover glow, fiel al referencia.css.
 */
import Link from 'next/link';
import type { Season } from '@/types';
import { SEASON_META } from '@/lib/utils';

interface Props {
  season: Season & { anime_count?: number };
}

export function SeasonCard({ season }: Props) {
  const meta = SEASON_META[season.cour as keyof typeof SEASON_META];

  return (
    <Link href={`/temporadas/${season.slug}`} style={{ textDecoration: 'none' }}>
      <article className="vh-card vh-card--season" style={{ cursor: 'pointer' }}>
        {/* Cover decorativo con gradiente según el cour */}
        <div className="vh-card__season-cover" data-cour={season.cour}>
          <span className="vh-card__season-emoji">{season.emoji}</span>
          {season.is_current && (
            <span
              className="vh-badge vh-badge--playing"
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}
            >
              Actual
            </span>
          )}
        </div>

        <div className="vh-card__body">
          <h3 className="vh-card__title" style={{ fontSize: '1rem' }}>
            {season.name}
          </h3>
          <div className="vh-card__meta">
            <span className="vh-card__year">{meta?.months}</span>
            {season.anime_count !== undefined && (
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--vh-accent)',
              }}>
                {season.anime_count} anime{season.anime_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}