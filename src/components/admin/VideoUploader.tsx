'use client';

import { useState, useRef } from 'react';

interface UploadResult {
  streamtapeUrl: string;
}

interface Props {
  onSuccess: (result: UploadResult) => void;
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

export function VideoUploader({ onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file,     setFile]     = useState<File | null>(null);
  const [state,    setState]    = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [url,      setUrl]      = useState('');
  const [error,    setError]    = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setState('idle');
    setProgress(0);
    setUrl('');
    setError('');
  }

  async function handleUpload() {
    if (!file) return;
    setState('uploading');
    setProgress(0);
    setError('');

    try {
      // Paso 1: obtener URL de subida de Streamtape
      const tokenRes = await fetch('/api/upload/streamtape');
      if (!tokenRes.ok) {
        const { error: msg } = await tokenRes.json();
        setState('error');
        setError(msg ?? 'Error al obtener URL de subida');
        return;
      }
      const { uploadUrl } = await tokenRes.json();

      // Paso 2: subir directo a Streamtape con progreso real
      await new Promise<void>((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            const fileId   = response?.result?.id ?? response?.result?.url;
            if (fileId) {
              const finalUrl = fileId.startsWith('http')
                ? fileId
                : `https://streamtape.com/v/${fileId}`;
              setUrl(finalUrl);
              setProgress(100);
              setState('done');
              onSuccess({ streamtapeUrl: finalUrl });
              resolve();
            } else {
              reject(new Error('No se obtuvo el link de Streamtape'));
            }
          } catch {
            reject(new Error('Respuesta inválida de Streamtape'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Error de conexión')));

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

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
        📤 Subir video a Streamtape
      </h3>

      {/* Selector de archivo */}
      {state !== 'uploading' && state !== 'done' && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border:       '2px dashed var(--vh-border)',
            borderRadius: 'var(--vh-radius-md)',
            padding:      '2rem',
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
            accept="video/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {file ? '🎬' : '📁'}
          </div>
          <div style={{
            fontSize:   '0.88rem',
            color:      file ? 'var(--vh-accent)' : 'var(--vh-text-muted)',
            fontWeight: file ? 700 : 400,
          }}>
            {file ? file.name : 'Hacé click para seleccionar el archivo de video'}
          </div>
          {file && (
            <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', marginTop: '0.25rem' }}>
              {(file.size / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      {state === 'uploading' && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: '0.4rem',
            fontSize: '0.82rem',
          }}>
            <span style={{ color: 'var(--vh-text-secondary)', fontWeight: 600 }}>
              📼 Subiendo a Streamtape...
            </span>
            <span style={{ color: 'var(--vh-accent)', fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
          <div style={{
            height: '8px', borderRadius: '999px',
            background: 'var(--vh-bg-card)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'var(--vh-accent)',
              borderRadius: '999px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', marginTop: '0.4rem' }}>
            {file && `${(file.size / 1024 / 1024).toFixed(0)} MB · No cerrés esta pestaña`}
          </div>
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
        <div style={{
          padding:      '0.875rem 1rem',
          background:   'rgba(34,197,94,0.1)',
          border:       '1px solid #22c55e',
          borderRadius: 'var(--vh-radius-md)',
          fontSize:     '0.85rem',
          color:        '#22c55e',
          fontWeight:   600,
        }}>
          ✅ Subido correctamente — link cargado en Streamtape
          <div style={{
            fontSize:     '0.72rem',
            fontWeight:   400,
            color:        'var(--vh-text-muted)',
            marginTop:    '0.25rem',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {url}
          </div>
        </div>
      )}

      {/* Botón */}
      {file && state !== 'uploading' && state !== 'done' && (
        <button
          onClick={handleUpload}
          className="vh-btn vh-btn--primary"
          style={{ width: '100%' }}
        >
          ⬆ Subir a Streamtape
        </button>
      )}

      {/* Subir otro */}
      {state === 'done' && (
        <button
          onClick={() => { setFile(null); setState('idle'); setUrl(''); setProgress(0); }}
          className="vh-btn vh-btn--ghost"
          style={{ width: '100%', fontSize: '0.85rem' }}
        >
          Subir otro video
        </button>
      )}
    </div>
  );
}