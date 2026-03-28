/**
 * Botón de eliminación con confirmación inline.
 * Reutilizable para temporadas, animes y reacciones.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id:          string;
  table:       'seasons' | 'animes' | 'reactions';
  label:       string;
  redirectTo:  string;
}

const TABLE_TO_ROUTE: Record<Props['table'], string> = {
  seasons:   '/api/admin/seasons',
  animes:    '/api/admin/animes',
  reactions: '/api/admin/reactions',
};

export function DeleteButton({ id, table, label, redirectTo }: Props) {
  const router    = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(TABLE_TO_ROUTE[table], {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
    setLoading(false);
    router.push(redirectTo);
    router.refresh();
  }

  if (confirm) {
    return (
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="vh-btn"
          style={{
            fontSize: '0.78rem', padding: '0.4rem 0.75rem',
            background: 'var(--vh-danger)', color: '#fff',
            border: '1.5px solid var(--vh-danger)',
            borderRadius: 'var(--vh-radius-md)',
          }}
        >
          {loading ? '...' : '✓ Sí, borrar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="vh-btn vh-btn--ghost"
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="vh-btn vh-btn--ghost"
      style={{
        fontSize: '0.8rem', padding: '0.4rem 0.9rem',
        color: 'var(--vh-danger)', borderColor: 'var(--vh-danger)',
      }}
    >
      🗑️
    </button>
  );
}