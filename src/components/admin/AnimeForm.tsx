'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Anime } from '@/types';

interface Props {
  anime?:   Anime;
  seasons:  { id: string; name: string }[];
}

export function AnimeForm({ anime, seasons }: Props) {
  const router  = useRouter();
  const editing = !!anime;

  const [title,    setTitle]    = useState(anime?.title            ?? '');
  const [titleJp,  setTitleJp]  = useState(anime?.title_jp         ?? '');
  const [coverUrl, setCoverUrl] = useState(anime?.cover_url        ?? '');
  const [synopsis, setSynopsis] = useState(anime?.synopsis         ?? '');
  const [genres,   setGenres]   = useState((anime?.genres ?? []).join(', '));
  const [year,     setYear]     = useState(anime?.year             ?? new Date().getFullYear());
  const [seasonId, setSeasonId] = useState(anime?.season_id        ?? '');
  const [status,   setStatus]   = useState(anime?.personal_status  ?? '');
  const [score,    setScore]    = useState(anime?.personal_score   ?? '');
  const [notes,    setNotes]    = useState(anime?.personal_notes   ?? '');
  const [featured, setFeatured] = useState(anime?.is_featured      ?? false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      title,
      title_jp:        titleJp   || null,
      cover_url:       coverUrl  || null,
      synopsis:        synopsis  || null,
      genres:          genres.split(',').map(g => g.trim()).filter(Boolean),
      year:            Number(year),
      season_id:       seasonId  || null,
      personal_status: status    || null,
      personal_score:  score     ? Number(score) : null,
      personal_notes:  notes     || null,
      is_featured:     featured,
    };

    const res = await fetch('/api/admin/animes', {
      method:  editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(editing ? { ...payload, id: anime!.id } : payload),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? 'Error al guardar');
    } else {
      router.push('/admin/animes');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && <ErrorBox msg={error} />}

      <Field label="Título *">
        <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} required placeholder="Solo Leveling Season 2" />
      </Field>

      <Field label="Título en japonés">
        <input value={titleJp} onChange={e => setTitleJp(e.target.value)} style={inputStyle} placeholder="俺だけレベルアップな件" />
      </Field>

      <Field label="URL de la portada">
        <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} style={inputStyle} placeholder="https://cdn.myanimelist.net/images/..." type="url" />
        {coverUrl && (
          <img src={coverUrl} alt="preview" style={{
            marginTop: '0.5rem', width: 80, height: 110,
            objectFit: 'cover', objectPosition: 'top',
            borderRadius: 'var(--vh-radius-md)',
            border: '1.5px solid var(--vh-border)',
          }} />
        )}
      </Field>

      <Field label="Sinopsis">
        <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} placeholder="Descripción breve del anime..." />
      </Field>

      <Field label="Géneros (separados por coma)">
        <input value={genres} onChange={e => setGenres(e.target.value)} style={inputStyle} placeholder="Acción, Fantasía, Aventura" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Año">
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle} min={1990} max={2100} />
        </Field>
        <Field label="Temporada">
          <select value={seasonId} onChange={e => setSeasonId(e.target.value)} style={selectStyle}>
            <option value="">Sin temporada</option>
            {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Estado personal">
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            <option value="">Sin estado</option>
            <option value="viendo">▶ Viendo</option>
            <option value="pendiente">🕐 Pendiente</option>
            <option value="completado">✅ Completado</option>
            <option value="dropeado">❌ Dropeado</option>
          </select>
        </Field>
        <Field label="Puntaje (1-10)">
          <input type="number" value={score} onChange={e => setScore(e.target.value as any)} style={inputStyle} min={1} max={10} placeholder="8" />
        </Field>
      </div>

      <Field label="Notas personales">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} placeholder="Opinión personal, spoilers, etc." />
      </Field>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--vh-bg-elevated)', border: '1.5px solid var(--vh-border)', borderRadius: 'var(--vh-radius-md)', cursor: 'pointer' }}>
        <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--vh-accent)', cursor: 'pointer' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--vh-text-primary)' }}>⭐ Anime destacado</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--vh-text-muted)' }}>Aparecerá primero en la temporada</div>
        </div>
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button type="submit" disabled={loading} className="vh-btn vh-btn--primary" style={{ flex: 1 }}>
          {loading ? '⏳ Guardando...' : editing ? '💾 Guardar cambios' : '+ Crear anime'}
        </button>
        <button type="button" onClick={() => router.back()} className="vh-btn vh-btn--ghost">Cancelar</button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '0.75rem 1rem', background: 'var(--vh-danger-bg)', border: '1px solid var(--vh-danger)', borderRadius: 'var(--vh-radius-md)', color: 'var(--vh-danger)', fontSize: '0.875rem' }}>
      {msg}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 1rem', borderRadius: 'var(--vh-radius-md)',
  border: '1.5px solid var(--vh-border)', background: 'var(--vh-bg-elevated)',
  color: 'var(--vh-text-primary)', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', width: '100%', transition: 'border-color var(--vh-transition)',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };