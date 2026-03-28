/**
 * Buscador client-side con filtros por temporada y estado.
 * Filtra sobre los datos pre-fetcheados — sin requests extra al servidor.
 */
'use client';

import { useState, useMemo } from 'react';
import { AnimeCard } from './AnimeCard';
import { EmptyState } from './EmptyState';
import type { Anime } from '@/types';

type AnimeRow = Anime & { reaction_count?: number; season_name?: string; season_slug?: string };
type SeasonOption = { id: string; name: string; slug: string };

interface Props {
  animes:  AnimeRow[];
  seasons: SeasonOption[];
}

export function BuscarClient({ animes, seasons }: Props) {
  const [query,    setQuery]    = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [status,   setStatus]   = useState('');

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return animes.filter(a => {
      const matchText   = !q || a.title.toLowerCase().includes(q) ||
                          a.title_jp?.toLowerCase().includes(q) ||
                          a.genres.some(g => g.toLowerCase().includes(q));
      const matchSeason = !seasonId || a.season_id === seasonId;
      const matchStatus = !status   || a.personal_status === status;
      return matchText && matchSeason && matchStatus;
    });
  }, [animes, query, seasonId, status]);

  return (
    <div>
      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="vh-search-bar__wrapper" style={{ maxWidth: '100%' }}>
          <span style={{ color: 'var(--vh-accent)', fontSize: '1rem' }}>🔍</span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por título, género..."
            className="vh-search-bar__input"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                width: 36, height: 36, borderRadius: 'var(--vh-radius-full)',
                border: 'none', background: 'var(--vh-bg-elevated)',
                color: 'var(--vh-text-muted)', cursor: 'pointer', fontSize: '0.9rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem',
      }}>
        {/* Filtro temporada */}
        <select
          value={seasonId}
          onChange={e => setSeasonId(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--vh-radius-full)',
            border: '1.5px solid var(--vh-border)',
            background: 'var(--vh-bg-elevated)',
            color: 'var(--vh-text-secondary)',
            fontFamily: 'inherit', fontSize: '0.88rem',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">📅 Todas las temporadas</option>
          {seasons.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Filtro estado */}
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--vh-radius-full)',
            border: '1.5px solid var(--vh-border)',
            background: 'var(--vh-bg-elevated)',
            color: 'var(--vh-text-secondary)',
            fontFamily: 'inherit', fontSize: '0.88rem',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">🗂 Todos los estados</option>
          <option value="viendo">▶ Viendo</option>
          <option value="pendiente">🕐 Pendiente</option>
          <option value="completado">✅ Completado</option>
          <option value="dropeado">❌ Dropeado</option>
        </select>

        {/* Contador de resultados */}
        <span style={{
          alignSelf: 'center', fontSize: '0.85rem',
          color: 'var(--vh-text-muted)', marginLeft: 'auto',
        }}>
          {results.length} resultado{results.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Resultados */}
      {results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          description={query
            ? `No encontramos animes para "${query}"`
            : 'Probá con otros filtros.'}
          action={
            <button
              className="vh-btn vh-btn--ghost"
              onClick={() => { setQuery(''); setSeasonId(''); setStatus(''); }}
            >
              Limpiar filtros
            </button>
          }
        />
      ) : (
        <div className="vh-cards-grid">
          {results.map(anime => (
            <AnimeCard key={anime.id} anime={anime} showSeason />
          ))}
        </div>
      )}
    </div>
  );
}