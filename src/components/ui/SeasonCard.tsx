/**
 * Card de temporada — estilo cyberpunk en modo claro,
 * glassmorphism en modo oscuro.
 */
import Link from 'next/link';
import type { Season } from '@/types';
import { SEASON_META } from '@/lib/utils';

interface Props {
  season: Season & { anime_count?: number };
}

const COUR_COLORS = {
  invierno: { border: '#87ceeb', glow: 'rgba(135,206,235,0.6)', icon: '❄️' },
  primavera: { border: '#ffb3d9', glow: 'rgba(255,179,217,0.6)', icon: '🌸' },
  verano:    { border: '#ffd700', glow: 'rgba(255,215,0,0.6)',   icon: '☀️' },
  otoño:     { border: '#ff8c42', glow: 'rgba(255,140,66,0.6)',  icon: '🍂' },
} as const;

export function SeasonCard({ season }: Props) {
  const meta   = SEASON_META[season.cour as keyof typeof SEASON_META];
  const colors = COUR_COLORS[season.cour as keyof typeof COUR_COLORS]
    ?? COUR_COLORS.invierno;

  return (
    <Link href={`/temporadas/${season.slug}`} style={{ textDecoration: 'none' }}>
      <article
        className="season-card-new"
        data-cour={season.cour}
        style={{ '--cour-border': colors.border, '--cour-glow': colors.glow } as React.CSSProperties}
      >
        {/* Icono grande centrado */}
        <div className="season-card-new__icon">
          {season.emoji || colors.icon}
        </div>

        {/* Nombre de la temporada */}
        <h3 className="season-card-new__name">{season.name}</h3>

        {/* Meses */}
        <p className="season-card-new__period">{meta?.months}</p>

        {/* Stats */}
        <div className="season-card-new__stats">
          <span className="season-card-new__count">
            {season.anime_count ?? 0} Animes
          </span>
          {season.is_current ? (
            <span className="season-card-new__badge season-card-new__badge--active">
              ACTIVO
            </span>
          ) : (
            <span className="season-card-new__badge season-card-new__badge--done">
              FINALIZADO
            </span>
          )}
        </div>

        {/* Descripción */}
        <p className="season-card-new__desc">
          {season.is_current
            ? 'Temporada actual'
            : 'Ver las reacciones de esta temporada'}
        </p>

        {/* Botón */}
        <div className="season-card-new__btn">
          VER REACCIONES →
        </div>
      </article>
    </Link>
  );
}