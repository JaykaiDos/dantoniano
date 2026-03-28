/**
 * VideoUploader — sube un archivo de video directo a Streamtape y/o Doodstream.
 * Direct upload: el archivo va del browser a la plataforma, sin pasar por Vercel.
 * Llama onSuccess con los links obtenidos al terminar.
 */
'use client';

import { useState, useRef } from 'react';

interface UploadResult {
  streamtapeUrl?: string;
  doodstreamUrl?: string;
}

interface Props {
  onSuccess: (result: UploadResult) => void;
}

interface PlatformStatus {
  state:    'idle' | 'uploading' | 'done' | 'error';
  progress: number;
  url?:     string;
  error?:   string;
}

export function VideoUploader({ onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file,        setFile]        = useState<File | null>(null);
  const [streamtape,  setStreamtape]  = useState<PlatformStatus>({ state: 'idle', progress: 0 });
  const [doodstream,  setDoodstream]  = useState<PlatformStatus>({ state: 'idle', progress: 0 });
  const [uploading,   setUploading]   = useState(false);

  const isActive = uploading || streamtape.state === 'done' || doodstream.state === 'done';

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Resetear estados
    setStreamtape({ state: 'idle', progress: 0 });
    setDoodstream({ state: 'idle', progress: 0 });
  }

  /**
   * Sube el archivo a una plataforma usando XMLHttpRequest para tracking de progreso.
   * Devuelve la URL del video subido.
   */
  async function uploadToPlatform(
    platform: 'streamtape' | 'doodstream',
    file: File,
    setStatus: React.Dispatch<React.SetStateAction<PlatformStatus>>
  ): Promise<string | null> {
    setStatus({ state: 'uploading', progress: 0 });

    try {
      // Paso 1: obtener URL de subida desde nuestro servidor
      const tokenRes = await fetch(`/api/upload/${platform}`);
      if (!tokenRes.ok) {
        const { error } = await tokenRes.json();
        setStatus({ state: 'error', progress: 0, error });
        return null;
      }
      const { uploadUrl } = await tokenRes.json();

      // Paso 2: subir directo a la plataforma con progreso
      return await new Promise((resolve) => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setStatus({ state: 'uploading', progress: pct });
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);

            if (platform === 'streamtape') {
              // Streamtape devuelve el file ID — construir URL
              const fileId = response?.result?.id ?? response?.result?.url;
              if (fileId) {
                const url = fileId.startsWith('http')
                  ? fileId
                  : `https://streamtape.com/v/${fileId}`;
                setStatus({ state: 'done', progress: 100, url });
                resolve(url);
              } else {
                setStatus({ state: 'error', progress: 0, error: 'No se obtuvo el link' });
                resolve(null);
              }
            } else {
              // Doodstream devuelve filecode
              const filecode = response?.result?.filecode ?? response?.filecode;
              if (filecode) {
                const url = `https://doodstream.com/d/${filecode}`;
                setStatus({ state: 'done', progress: 100, url });
                resolve(url);
              } else {
                setStatus({ state: 'error', progress: 0, error: 'No se obtuvo el link' });
                resolve(null);
              }
            }
          } catch {
            setStatus({ state: 'error', progress: 0, error: 'Respuesta inválida' });
            resolve(null);
          }
        });

        xhr.addEventListener('error', () => {
          setStatus({ state: 'error', progress: 0, error: 'Error de conexión' });
          resolve(null);
        });

        xhr.open('POST', uploadUrl);
        xhr.send(formData);
      });

    } catch (err) {
      setStatus({ state: 'error', progress: 0, error: 'Error inesperado' });
      return null;
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    // Subir a ambas plataformas en paralelo
    const [stUrl, ddUrl] = await Promise.all([
      uploadToPlatform('streamtape', file, setStreamtape),
      uploadToPlatform('doodstream', file, setDoodstream),
    ]);

    setUploading(false);

    // Llamar onSuccess con los links obtenidos
    if (stUrl || ddUrl) {
      onSuccess({
        streamtapeUrl: stUrl  ?? undefined,
        doodstreamUrl: ddUrl  ?? undefined,
      });
    }
  }

  return (
    <div style={{
      padding:      '1.25rem',
      background:   'var(--vh-bg-elevated)',
      border:       '1.5px solid var(--vh-border)',
      borderRadius: 'var(--vh-radius-lg)',
      display:      'flex',
      flexDirection:'column',
      gap:          '1rem',
    }}>
      <h3 style={{
        fontSize: '0.85rem', fontWeight: 700,
        color: 'var(--vh-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        📤 Subir video automáticamente
      </h3>

      {/* Selector de archivo */}
      {!isActive && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border:        '2px dashed var(--vh-border)',
            borderRadius:  'var(--vh-radius-md)',
            padding:       '2rem',
            textAlign:     'center',
            cursor:        'pointer',
            transition:    'all var(--vh-transition)',
            background:    file ? 'var(--vh-accent-soft)' : 'transparent',
            borderColor:   file ? 'var(--vh-accent)' : 'var(--vh-border)',
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
          <div style={{ fontSize: '0.88rem', color: file ? 'var(--vh-accent)' : 'var(--vh-text-muted)', fontWeight: file ? 700 : 400 }}>
            {file ? file.name : 'Hacé click para seleccionar el archivo de video'}
          </div>
          {file && (
            <div style={{ fontSize: '0.75rem', color: 'var(--vh-text-muted)', marginTop: '0.25rem' }}>
              {(file.size / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
          )}
        </div>
      )}

      {/* Estado de cada plataforma */}
      {(streamtape.state !== 'idle' || doodstream.state !== 'idle') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <PlatformProgress label="📼 Streamtape" status={streamtape} />
          <PlatformProgress label="🎞 Doodstream" status={doodstream} />
        </div>
      )}

      {/* Botón de subida */}
      {file && !isActive && (
        <button
          onClick={handleUpload}
          className="vh-btn vh-btn--primary"
          style={{ width: '100%' }}
        >
          ⬆ Subir a Streamtape y Doodstream
        </button>
      )}

      {/* Resultado exitoso */}
      {(streamtape.state === 'done' || doodstream.state === 'done') && !uploading && (
        <div style={{
          padding:      '0.875rem 1rem',
          background:   'rgba(34,197,94,0.1)',
          border:       '1px solid #22c55e',
          borderRadius: 'var(--vh-radius-md)',
          fontSize:     '0.85rem',
          color:        '#22c55e',
          fontWeight:   600,
        }}>
          ✅ Links obtenidos y cargados automáticamente en el formulario
        </div>
      )}
    </div>
  );
}

/** Barra de progreso por plataforma */
function PlatformProgress({ label, status }: { label: string; status: PlatformStatus }) {
  const colors = {
    idle:      'var(--vh-border)',
    uploading: 'var(--vh-accent)',
    done:      '#22c55e',
    error:     'var(--vh-danger)',
  };
  const color = colors[status.state];

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '0.35rem',
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--vh-text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.75rem', color }}>
          {status.state === 'idle'      && '—'}
          {status.state === 'uploading' && `${status.progress}%`}
          {status.state === 'done'      && '✅ Listo'}
          {status.state === 'error'     && `❌ ${status.error}`}
        </span>
      </div>
      <div style={{
        height: '6px', borderRadius: '999px',
        background: 'var(--vh-bg-card)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width:  `${status.state === 'done' ? 100 : status.progress}%`,
          background: color,
          borderRadius: '999px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      {status.url && (
        <div style={{ fontSize: '0.7rem', color: 'var(--vh-text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {status.url}
        </div>
      )}
    </div>
  );
}