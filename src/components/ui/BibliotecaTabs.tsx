/**
 * Tabs client-side de la biblioteca — alterna entre los 4 estados.
 * Recibe los datos pre-fetcheados desde el Server Component padre.
 */
'use client';

import { useState } from 'react';
import { AnimeCard } from './AnimeCard';
import { EmptyState } from './EmptyState';
import type { Anime } from '@/types';

type AnimeRow = Anime & { reaction_count?: number; season_name?: string; season_slug?: string };

interface Props {
  viendo:     AnimeRow[];
  pendiente:  AnimeRow[];
  completado: AnimeRow[];
  dropeado:   AnimeRow[];
}

const TABS = [
  { key: 'viendo',     label: 'Viendo',     emoji: '▶️', empty: 'No estás viendo ningún anime.' },
  { key: 'pendiente',  label: 'Pendiente',  emoji: '🕐', empty: 'No tenés animes pendientes.'   },
  { key: 'completado', label: 'Completado', emoji: '✅', empty: 'No completaste ningún anime.'   },
  { key: 'dropeado',   label: 'Dropeado',   emoji: '❌', empty: 'No dropeaste ningún anime.'     },
] as const;

export function BibliotecaTabs({ viendo, pendiente, completado, dropeado }: Props) {
  const [active, setActive] = useState<typeof TABS[number]['key']>('viendo');

  const dataMap = { viendo, pendiente, completado, dropeado };
  const activeTab = TABS.find(t => t.key === active)!;
  const items     = dataMap[active];

  return (
    <div>
      {/* Tabs */}
      <div className="vh-tabs">
        {TABS.map(tab => {
          const count = dataMap[tab.key].length;
          return (
            <button
              key={tab.key}
              className={`vh-tab ${active === tab.key ? 'vh-tab--active' : ''}`}
              onClick={() => setActive(tab.key)}
            >
              <span className="vh-tab__icon">{tab.emoji}</span>
              {tab.label}
              <span className="vh-tab__count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      {items.length === 0 ? (
        <EmptyState
          icon={activeTab.emoji}
          title={activeTab.empty}
        />
      ) : (
        <div className="vh-cards-grid">
          {items.map(anime => (
            <AnimeCard key={anime.id} anime={anime} showSeason />
          ))}
        </div>
      )}
    </div>
  );
}