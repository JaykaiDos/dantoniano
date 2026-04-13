'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Anime {
  id:    string;
  title: string;
}

interface Reaction {
  id:                  string;
  title:               string;
  episode_number:      number | null;
  source_voe:          string | null;
  source_filemoon:     string | null;
  source_doodstream:   string | null;
  source_streamwish:   string | null;
  anime_id:            string;
}

interface Props {
  animes:    Anime[];
  reactions: Reaction[];
}

type Mode = 'new' | 'complete';

const PLATFORMS = [
  { key: 'source_voe',        label: '🔺 VOE'         },
  { key: 'source_filemoon',   label: '🌙 Filemoon'    },
  { key: 'source_doodstream', label: '🎞 Doodstream'  },
  { key: 'source_streamwish', label: '⭐ SeekStreaming' },
] as const;

export function UploadTaskForm({ animes, reactions }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('new');

  // ── Modo nuevo ──
  const [sourceUrl,   setSourceUrl]   = useState('');
  const [animeId,     setAnimeId]     = useState('');
  const [episode,     setEpisode]     = useState('');
  const [title,       setTitle]       = useState('');
  const [duration,    setDuration]    = useState('');
  const [publishedAt, setPublishedAt] = useState('');

  // ── Modo completar ──
  const [filterAnimeId,  setFilterAnimeId]  = useState('');
  const [selectedReaction, setSelectedReaction] = useState<Reaction | null>(null);
  const [completeUrl,    setCompleteUrl]    = useState('');
  const [selectedPlats,  setSelectedPlats]  = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  // Filtrar reacciones por anime seleccionado
  const filteredReactions = filterAnimeId
    ? reactions.filter(r => r.anime_id === filterAnimeId)
    : reactions;

  // Al seleccionar una reacción, pre-seleccionar las plataformas que le faltan
  function handleSelectReaction(r: Reaction) {
    setSelectedReaction(r);
    const missing = new Set<string>();
    if (!r.source_voe)        missing.add('source_voe');
    if (!r.source_filemoon)   missing.add('source_filemoon');
    if (!r.source_doodstream) missing.add('source_doodstream');
    if (!r.source_streamwish) missing.add('source_streamwish');
    setSelectedPlats(missing);
    setCompleteUrl('');
    setError('');
    setSuccess('');
  }

  function togglePlat(key: string) {
    setSelectedPlats(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // Auto título en modo nuevo
  function handleAnimeChange(val: string) {
    setAnimeId(val);
    if (episode && !title) {
      const anime = animes.find(a => a.id === val);
      if (anime) setTitle(`${anime.title} EP ${episode}`);
    }
  }

  function handleEpisodeChange(val: string) {
    setEpisode(val);
    if (!title) {
      const anime = animes.find(a => a.id === animeId);
      if (anime) setTitle(`${anime.title} EP ${val}`);
    }
  }

  async function handleSubmitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceUrl || !animeId || !title) { setError('Completá URL, anime y título.'); return; }
    setLoading(true); setError(''); setSuccess('');

    const res = await fetch('/api/admin/upload-task', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        source_url:     sourceUrl,
        anime_id:       animeId,
        episode_number: episode    ? Number(episode) : null,
        title,
        duration:       duration   || null,
        published_at:   publishedAt || null,
        platforms:      ['voe', 'filemoon', 'doodstream', 'seekstreaming'],
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? 'Error al encolar');
    } else {
      setSuccess('✅ Tarea encolada — el sistema procesa en segundo plano');
      setSourceUrl(''); setTitle(''); setEpisode(''); setDuration(''); setPublishedAt('');
      router.refresh();
    }
  }

  async function handleSubmitComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReaction) { setError('Seleccioná una reacción.'); return; }
    if (!completeUrl)       { setError('Pegá el link directo del video.'); return; }
    if (selectedPlats.size === 0) { setError('Seleccioná al menos una plataforma.'); return; }

    setLoading(true); setError(''); setSuccess('');

    // Convertir keys seleccionadas a nombres de plataforma
    const platMap: Record<string, string> = {
      source_voe:        'voe',
      source_filemoon:   'filemoon',
      source_doodstream: 'doodstream',
      source_streamwish: 'seekstreaming',
    };
    const platforms = [...selectedPlats].map(k => platMap[k]).filter(Boolean);

    const res = await fetch('/api/admin/upload-task', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        source_url:  completeUrl,
        anime_id:    selectedReaction.anime_id,
        reaction_id: selectedReaction.id,       // para actualizar la reacción existente
        episode_number: selectedReaction.episode_number,
        title:       selectedReaction.title,
        platforms,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? 'Error al encolar');
    } else {
      setSuccess(`✅ Completando ${selectedReaction.title} en ${platforms.join(', ')}`);
      setSelectedReaction(null);
      setCompleteUrl('');
      setSelectedPlats(new Set());
      router.refresh();
    }
  }

  return (
    <div style={{
      background:   'var(--vh-bg-card)',
      border:       '1.5px solid var(--vh-border-card)',
      borderRadius: 'var(--vh-radius-xl)',
      padding:      '1.5rem',
      boxShadow:    'var(--vh-shadow-md)',
    }}>
      {/* ── Selector de modo ── */}
      <div style={{
        display:      'flex',
        gap:          '0.5rem',
        marginBottom: '1.25rem',
        background:   'var(--vh-bg-elevated)',
        padding:      '0.25rem',
        borderRadius: 'var(--vh-radius-lg)',
      }}>
        {([['new', '🔗 Nuevo episodio'], ['complete', '🔧 Completar existente']] as [Mode, string][]).map(([m, label]) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); setSuccess(''); }}
            style={{
              flex:         1,
              padding:      '0.5rem',
              borderRadius: 'var(--vh-radius-md)',
              border:       'none',
              background:   mode === m ? 'var(--vh-accent)' : 'transparent',
              color:        mode === m ? 'var(--vh-text-on-accent)' : 'var(--vh-text-muted)',
              fontFamily:   'inherit',
              fontSize:     '0.82rem',
              fontWeight:   700,
              cursor:       'pointer',
              transition:   'all var(--vh-transition)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--vh-danger-bg)', border: '1px solid var(--vh-danger)', borderRadius: 'var(--vh-radius-md)', color: 'var(--vh-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '0.875rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 'var(--vh-radius-md)', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {/* ══════════════════════════════════
          MODO NUEVO
      ══════════════════════════════════ */}
      {mode === 'new' && (
        <form onSubmit={handleSubmitNew} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="🔗 Link directo del video *">
            <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
              style={inputStyle} placeholder="https://..." required />
            <span style={{ fontSize: '0.72rem', color: 'var(--vh-text-muted)' }}>
              Direct link accesible públicamente
            </span>
          </Field>

          <Field label="Anime *">
            <select value={animeId} onChange={e => handleAnimeChange(e.target.value)} style={selectStyle} required>
              <option value="">Seleccioná un anime...</option>
              {animes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </Field>

          <Field label="Título *">
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={inputStyle} placeholder="Reacción EP 1 — Jujutsu Kaisen" required />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <Field label="Episodio">
              <input type="number" value={episode} onChange={e => handleEpisodeChange(e.target.value)}
                style={inputStyle} min={0} placeholder="1" />
            </Field>
            <Field label="Duración">
              <input value={duration} onChange={e => setDuration(e.target.value)}
                style={inputStyle} placeholder="24:00" />
            </Field>
            <Field label="Fecha">
              <input type="date" value={publishedAt} onChange={e => setPublishedAt(e.target.value)}
                style={inputStyle} />
            </Field>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: 'var(--vh-bg-elevated)', border: '1px solid var(--vh-border)', borderRadius: 'var(--vh-radius-md)', fontSize: '0.78rem', color: 'var(--vh-text-muted)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--vh-text-secondary)' }}>Se subirá a:</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['🔺 VOE','🌙 Filemoon','🎞 Doodstream','⭐ SeekStreaming'].map(p => (
                <span key={p} style={{ padding: '0.2rem 0.6rem', background: 'var(--vh-accent-soft)', color: 'var(--vh-accent)', border: '1px solid var(--vh-border)', borderRadius: 'var(--vh-radius-full)', fontWeight: 600 }}>{p}</span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="vh-btn vh-btn--primary" style={{ width: '100%' }}>
            {loading ? '⏳ Encolando...' : '⚡ Procesar video'}
          </button>
        </form>
      )}

      {/* ══════════════════════════════════
          MODO COMPLETAR
      ══════════════════════════════════ */}
      {mode === 'complete' && (
        <form onSubmit={handleSubmitComplete} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Filtro por anime */}
          <Field label="Filtrar por anime">
            <select value={filterAnimeId} onChange={e => { setFilterAnimeId(e.target.value); setSelectedReaction(null); }} style={selectStyle}>
              <option value="">Todos los animes</option>
              {animes.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </Field>

          {/* Lista de reacciones */}
          <Field label="Seleccioná la reacción a completar *">
            <div style={{
              maxHeight:    '220px',
              overflowY:    'auto',
              border:       '1.5px solid var(--vh-border)',
              borderRadius: 'var(--vh-radius-md)',
              background:   'var(--vh-bg-elevated)',
            }}>
              {filteredReactions.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--vh-text-muted)', fontSize: '0.82rem' }}>
                  No hay reacciones
                </div>
              ) : (
                filteredReactions.map(r => {
                  const missingCount = [r.source_voe, r.source_filemoon, r.source_doodstream, r.source_streamwish].filter(s => !s).length;
                  const isSelected   = selectedReaction?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleSelectReaction(r)}
                      style={{
                        padding:     '0.65rem 0.875rem',
                        cursor:      'pointer',
                        background:  isSelected ? 'var(--vh-accent-soft)' : 'transparent',
                        borderLeft:  isSelected ? '3px solid var(--vh-accent)' : '3px solid transparent',
                        transition:  'all var(--vh-transition)',
                        display:     'flex',
                        alignItems:  'center',
                        justifyContent: 'space-between',
                        gap:         '0.5rem',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? 'var(--vh-accent)' : 'var(--vh-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--vh-text-muted)', marginTop: '0.1rem', display: 'flex', gap: '0.4rem' }}>
                          {r.source_voe        && <span style={{ color: '#22c55e' }}>VOE✓</span>}
                          {r.source_filemoon   && <span style={{ color: '#22c55e' }}>FM✓</span>}
                          {r.source_doodstream && <span style={{ color: '#22c55e' }}>DD✓</span>}
                          {r.source_streamwish && <span style={{ color: '#22c55e' }}>SK✓</span>}
                        </div>
                      </div>
                      {missingCount > 0 && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          background: 'rgba(239,68,68,0.15)',
                          color: 'var(--vh-danger)',
                          border: '1px solid var(--vh-danger)',
                          borderRadius: 'var(--vh-radius-full)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {missingCount} faltan
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Field>

          {/* Plataformas a completar */}
          {selectedReaction && (
            <>
              <Field label="Plataformas a completar *">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {PLATFORMS.map(({ key, label }) => {
                    const alreadyHas = !!selectedReaction[key as keyof Reaction];
                    const isChecked  = selectedPlats.has(key);
                    return (
                      <label
                        key={key}
                        style={{
                          display:     'flex',
                          alignItems:  'center',
                          gap:         '0.6rem',
                          padding:     '0.5rem 0.75rem',
                          borderRadius:'var(--vh-radius-md)',
                          border:      `1.5px solid ${alreadyHas ? 'rgba(34,197,94,0.3)' : isChecked ? 'var(--vh-accent)' : 'var(--vh-border)'}`,
                          background:  alreadyHas ? 'rgba(34,197,94,0.06)' : isChecked ? 'var(--vh-accent-soft)' : 'var(--vh-bg-elevated)',
                          cursor:      alreadyHas ? 'not-allowed' : 'pointer',
                          opacity:     alreadyHas ? 0.6 : 1,
                          transition:  'all var(--vh-transition)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={alreadyHas}
                          onChange={() => !alreadyHas && togglePlat(key)}
                          style={{ accentColor: 'var(--vh-accent)', width: 16, height: 16, cursor: alreadyHas ? 'not-allowed' : 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: alreadyHas ? '#22c55e' : isChecked ? 'var(--vh-accent)' : 'var(--vh-text-secondary)', flex: 1 }}>
                          {label}
                        </span>
                        {alreadyHas && (
                          <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>Ya subido ✓</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </Field>

              <Field label="🔗 Link directo del video *">
                <input
                  type="url"
                  value={completeUrl}
                  onChange={e => setCompleteUrl(e.target.value)}
                  style={inputStyle}
                  placeholder="https://..."
                  required
                />
              </Field>
            </>
          )}

          <button
            type="submit"
            disabled={loading || !selectedReaction || selectedPlats.size === 0}
            className="vh-btn vh-btn--primary"
            style={{ width: '100%' }}
          >
            {loading ? '⏳ Encolando...' : `⚡ Completar en ${selectedPlats.size} plataforma${selectedPlats.size !== 1 ? 's' : ''}`}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 1rem', borderRadius: 'var(--vh-radius-md)',
  border: '1.5px solid var(--vh-border)', background: 'var(--vh-bg-elevated)',
  color: 'var(--vh-text-primary)', fontFamily: 'inherit', fontSize: '0.875rem',
  outline: 'none', width: '100%',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };