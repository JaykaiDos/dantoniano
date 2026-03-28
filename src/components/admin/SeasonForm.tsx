'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugify, SEASON_META } from '@/lib/utils';
import type { Season } from '@/types';

type Cour = 'invierno' | 'primavera' | 'verano' | 'otoño';

interface Props {
  season?: Season;
}

export function SeasonForm({ season }: Props) {
  const router  = useRouter();
  const editing = !!season;

  const [name,      setName]      = useState(season?.name       ?? '');
  const [cour,      setCour]      = useState<Cour>(season?.cour as Cour ?? 'invierno');
  const [year,      setYear]      = useState(season?.year       ?? new Date().getFullYear());
  const [emoji,     setEmoji]     = useState(season?.emoji      ?? '📅');
  const [isCurrent, setIsCurrent] = useState(season?.is_current ?? false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  function handleCourChange(value: string) {
    const validCour = value as Cour;
    setCour(validCour);
    const meta = SEASON_META[validCour];
    if (meta) {
      setName(`${meta.label} ${year}`);
      setEmoji(meta.emoji);
    }
  }

  function handleYearChange(value: number) {
    setYear(value);
    const meta = SEASON_META[cour];
    if (meta) setName(`${meta.label} ${value}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      name,
      slug:       slugify(name),
      year,
      cour,
      emoji,
      is_current: isCurrent,
    };

    const res = await fetch('/api/admin/seasons', {
      method:  editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(editing ? { ...payload, id: season!.id } : payload),
    });

    setLoading(false);
    if (!res.ok) {
      const { error: msg } = await res.json();
      setError(msg ?? 'Error al guardar');
    } else {
      router.push('/admin/temporadas');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem 1rem', background: 'var(--vh-danger-bg)',
          border: '1px solid var(--vh-danger)', borderRadius: 'var(--vh-radius-md)',
          color: 'var(--vh-danger)', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={labelStyle}>Estación</label>
          <select value={cour} onChange={e => handleCourChange(e.target.value)} style={selectStyle} required>
            <option value="invierno">❄️ Invierno</option>
            <option value="primavera">🌸 Primavera</option>
            <option value="verano">☀️ Verano</option>
            <option value="otoño">🍂 Otoño</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={labelStyle}>Año</label>
          <input
            type="number"
            value={year}
            onChange={e => handleYearChange(Number(e.target.value))}
            style={inputStyle}
            min={2000} max={2100}
            required
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={labelStyle}>
          Nombre <span style={{ color: 'var(--vh-text-muted)', fontWeight: 400 }}>(auto-generado)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
          required
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)' }}>
          Slug: {slugify(name)}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <label style={labelStyle}>Emoji</label>
        <input
          type="text"
          value={emoji}
          onChange={e => setEmoji(e.target.value)}
          style={{ ...inputStyle, maxWidth: '120px', fontSize: '1.5rem', textAlign: 'center' }}
          maxLength={4}
        />
      </div>

      <label style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: 'var(--vh-bg-elevated)',
        border: '1.5px solid var(--vh-border)',
        borderRadius: 'var(--vh-radius-md)',
        cursor: 'pointer',
      }}>
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={e => setIsCurrent(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: 'var(--vh-accent)', cursor: 'pointer' }}
        />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--vh-text-primary)' }}>
            Temporada actual
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--vh-text-muted)' }}>
            Se mostrará destacada en el sitio
          </div>
        </div>
      </label>

      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <button type="submit" disabled={loading} className="vh-btn vh-btn--primary" style={{ flex: 1 }}>
          {loading ? '⏳ Guardando...' : editing ? '💾 Guardar cambios' : '+ Crear temporada'}
        </button>
        <button type="button" onClick={() => router.back()} className="vh-btn vh-btn--ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem', fontWeight: 600, color: 'var(--vh-text-secondary)',
};
const inputStyle: React.CSSProperties = {
  padding: '0.65rem 1rem',
  borderRadius: 'var(--vh-radius-md)',
  border: '1.5px solid var(--vh-border)',
  background: 'var(--vh-bg-elevated)',
  color: 'var(--vh-text-primary)',
  fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', width: '100%',
  transition: 'border-color var(--vh-transition)',
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };