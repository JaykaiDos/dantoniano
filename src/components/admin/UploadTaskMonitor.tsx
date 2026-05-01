'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type TaskStatus = 'pending' | 'processing' | 'done' | 'error';
type PlatStatus = 'pending' | 'processing' | 'done' | 'error' | 'skipped';

interface Task {
  id:                   string;
  title:                string;
  status:               TaskStatus;
  episode_number:       number | null;
  voe_status:           PlatStatus;
  filemoon_status:      PlatStatus;
  doodstream_status:    PlatStatus;
  seekstreaming_status: PlatStatus;
  voe_url:              string | null;
  filemoon_url:         string | null;
  doodstream_url:       string | null;
  seekstreaming_url:    string | null;
  error_msg:            string | null;
  created_at:           string;
  completed_at:         string | null;
  anime:                { title: string } | null;
}

interface Props {
  initialTasks: Task[];
}

const STATUS_ICON: Record<TaskStatus, string> = {
  pending:    '🕐',
  processing: '⏳',
  done:       '✅',
  error:      '❌',
};

const PLAT_ICON: Record<PlatStatus, string> = {
  pending:    '⬜',
  processing: '🔄',
  done:       '✅',
  error:      '❌',
  skipped:    '⏭',
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  pending:    'var(--vh-text-muted)',
  processing: '#f59e0b',
  done:       '#22c55e',
  error:      'var(--vh-danger)',
};

export function UploadTaskMonitor({ initialTasks }: Props) {
  const [tasks,   setTasks]   = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();



  async function refresh() {
    setLoading(true);
    try {
      const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending');
      if (activeTasks.length > 0) {
        await fetch('/api/admin/upload-task/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskIds: activeTasks.map(t => t.id) }),
        });
      }
      const res = await fetch('/api/admin/upload-task');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
    setLoading(false);
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    if (!confirm('¿Estás seguro de que querés eliminar esta tarea?')) return;
    
    setDeleting(taskId);
    try {
      const res = await fetch('/api/admin/upload-task', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
      } else {
        alert('Error al eliminar la tarea');
      }
    } catch (error) {
      console.error(error);
      alert('Error al eliminar la tarea');
    } finally {
      setDeleting(null);
    }
  }

  const active   = tasks.filter(t => t.status === 'processing' || t.status === 'pending');
  const finished = tasks.filter(t => t.status === 'done' || t.status === 'error');

  return (
    <div style={{
      background:   'var(--vh-bg-card)',
      border:       '1.5px solid var(--vh-border-card)',
      borderRadius: 'var(--vh-radius-xl)',
      padding:      '1.5rem',
      boxShadow:    'var(--vh-shadow-md)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--vh-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 Monitor de tareas
          {active.length > 0 && (
            <span style={{
              background: '#f59e0b', color: '#0a0a0a',
              fontSize: '0.65rem', fontWeight: 700,
              padding: '0.15rem 0.45rem', borderRadius: 'var(--vh-radius-full)',
            }}>
              {active.length} activa{active.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--vh-radius-full)',
            border: '1.5px solid var(--vh-border)',
            background: 'var(--vh-bg-elevated)',
            color: 'var(--vh-text-muted)',
            fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? '⏳' : '🔄'} Verificar
        </button>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--vh-text-muted)', fontSize: '0.875rem' }}>
          No hay tareas aún. Procesá tu primer video →
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              padding:      '0.875rem 1rem',
              background:   'var(--vh-bg-elevated)',
              border:       `1.5px solid ${task.status === 'done' ? 'rgba(34,197,94,0.3)' : task.status === 'error' ? 'rgba(239,68,68,0.3)' : 'var(--vh-border)'}`,
              borderRadius: 'var(--vh-radius-lg)',
            }}>
              {/* Cabecera de la tarea */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1rem' }}>{STATUS_ICON[task.status]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600, fontSize: '0.85rem',
                    color: 'var(--vh-text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--vh-text-muted)' }}>
                    {task.anime?.title ?? '—'} · {new Date(task.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: STATUS_COLOR[task.status], whiteSpace: 'nowrap' }}>
                  {task.status.toUpperCase()}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={deleting === task.id}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--vh-radius-full)',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--vh-danger)',
                    fontSize: '0.7rem',
                    cursor: deleting === task.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: deleting === task.id ? 0.5 : 1,
                  }}
                >
                  {deleting === task.id ? '⏳' : '🗑️'} Borrar
                </button>
              </div>

              {/* Estado por plataforma */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                {([
                  ['🔺 VOE',         task.voe_status,           task.voe_url],
                  ['🌙 Filemoon',     task.filemoon_status,      task.filemoon_url],
                  ['🎞 Doodstream',   task.doodstream_status,    task.doodstream_url],
                  ['⭐ SeekStreaming', task.seekstreaming_status, task.seekstreaming_url],
                ] as [string, PlatStatus, string | null][]).map(([label, status, url]) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.72rem', color: 'var(--vh-text-muted)',
                  }}>
                    <span>{PLAT_ICON[status]}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>
                        {label}
                      </a>
                    ) : (
                      <span style={{ color: status === 'error' ? 'var(--vh-danger)' : 'inherit' }}>{label}</span>
                    )}
                  </div>
                ))}
              </div>

              {task.error_msg && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--vh-danger)', fontStyle: 'italic' }}>
                  {task.error_msg}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}