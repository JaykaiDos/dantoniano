'use client';

import { useState, useRef } from 'react';

interface Props {
  onSuccess: (imageUrl: string) => void;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function ImageUploader({ onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file,  setFile]  = useState<File | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [url,   setUrl]   = useState('');
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Seleccioná un archivo de imagen (jpg, png, webp, etc.)');
      return;
    }
    setFile(f);
    setState('idle');
    setUrl('');
    setError('');
  }

  async function handleUpload() {
    if (!file) return;
    setState('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) {
        const msg = await res.text();
        setState('error');
        setError(`Error ${res.status}: ${msg}`);
        return;
      }

      const data = await res.json();
      const imageUrl = data.secure_url;
      setUrl(imageUrl);
      setState('done');
      onSuccess(imageUrl);
    } catch (err: any) {
      setState('error');
      setError(err?.message ?? 'Error inesperado');
    }
  }

  return (
    <div style={{
      padding:       '1.25rem',
      background:    'var(--vh-bg-elevated)',
      border:        '1.5px solid var(--vh-border)',
      borderRadius:  'var(--vh-radius-lg)',
      display:       'flex',
      flexDirection: 'column',
      gap:           '1rem',
    }}>
      <h3 style={{
        fontSize: '0.85rem', fontWeight: 700,
        color: 'var(--vh-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        🖼 Subir imagen a Cloudinary
      </h3>

      {/* Selector de archivo */}
      {state !== 'uploading' && state !== 'done' && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border:       '2px dashed var(--vh-border)',
            borderRadius: 'var(--vh-radius-md)',
            padding:      '1.5rem',
            textAlign:    'center',
            cursor:       'pointer',
            background:   file ? 'var(--vh-accent-soft)' : 'transparent',
            borderColor:  file ? 'var(--vh-accent)' : 'var(--vh-border)',
            transition:   'all var(--vh-transition)',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {file ? '🖼️' : '📁'}
          </div>
          <div style={{
            fontSize:   '0.88rem',
            color:      file ? 'var(--vh-accent)' : 'var(--vh-text-muted)',
            fontWeight: file ? 700 : 400,
          }}>
            {file ? file.name : 'Hacé click para seleccionar la imagen'}
          </div>
          {file && (
            <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', marginTop: '0.25rem' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      )}

      {/* Progreso */}
      {state === 'uploading' && (
        <div style={{
          padding:      '0.875rem 1rem',
          background:   'var(--vh-accent-soft)',
          border:       '1px solid var(--vh-accent)',
          borderRadius: 'var(--vh-radius-md)',
          color:        'var(--vh-accent)',
          fontSize:     '0.85rem',
          fontWeight:   600,
          textAlign:    'center',
        }}>
          ⏳ Subiendo a Cloudinary... (no cerrés la pestaña)
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{
          padding:      '0.75rem 1rem',
          background:   'var(--vh-danger-bg)',
          border:       '1px solid var(--vh-danger)',
          borderRadius: 'var(--vh-radius-md)',
          color:        'var(--vh-danger)',
          fontSize:     '0.85rem',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Éxito */}
      {state === 'done' && (
        <div>
          <div style={{
            padding:      '0.875rem 1rem',
            background:   'rgba(34,197,94,0.1)',
            border:       '1px solid #22c55e',
            borderRadius: 'var(--vh-radius-md)',
            fontSize:     '0.85rem',
            color:        '#22c55e',
            fontWeight:   600,
            marginBottom: '0.5rem',
          }}>
            ✅ Imagen subida — URL cargada automáticamente
          </div>
          {url && (
            <img
              src={url}
              alt="thumbnail preview"
              style={{
                width: '100%', maxWidth: 280,
                borderRadius: 'var(--vh-radius-md)',
                border: '1.5px solid var(--vh-border)',
              }}
            />
          )}
        </div>
      )}

      {/* Botón */}
      {file && state !== 'uploading' && state !== 'done' && (
        <button
          onClick={handleUpload}
          className="vh-btn vh-btn--primary"
          style={{ width: '100%' }}
        >
          ⬆ Subir a Cloudinary
        </button>
      )}

      {/* Subir otra */}
      {state === 'done' && (
        <button
          onClick={() => { setFile(null); setState('idle'); setUrl(''); }}
          className="vh-btn vh-btn--ghost"
          style={{ width: '100%', fontSize: '0.85rem' }}
        >
          Subir otra imagen
        </button>
      )}
    </div>
  );
}