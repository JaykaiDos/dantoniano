/**
 * Utilidades globales del proyecto.
 */
import { clsx, type ClassValue } from 'clsx';

/** Combina clases de Tailwind/CSS condicionalmente */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Extrae el ID de YouTube de una URL cualquiera */
export function getYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^#&?]{11})/,
    /youtube\.com\/watch\?v=([^#&?]{11})/,
    /youtube\.com\/embed\/([^#&?]{11})/,
    /youtube\.com\/shorts\/([^#&?]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** Genera la URL del thumbnail de YouTube */
export function getYoutubeThumbnail(youtubeId: string, quality: 'hq' | 'mq' = 'hq') {
  return `https://img.youtube.com/vi/${youtubeId}/${quality}default.jpg`;
}

/** Convierte string a slug URL-friendly */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Mapeo de cour a emoji y nombre legible */
export const SEASON_META: Record<string, { emoji: string; label: string; months: string }> = {
  invierno: { emoji: '❄️', label: 'Invierno', months: 'Enero – Marzo' },
  primavera: { emoji: '🌸', label: 'Primavera', months: 'Abril – Junio' },
  verano:    { emoji: '☀️', label: 'Verano',    months: 'Julio – Septiembre' },
  otoño:     { emoji: '🍂', label: 'Otoño',     months: 'Octubre – Diciembre' },
};

/** Configuración de badges de estado personal */
export const STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',   emoji: '🕐', className: 'vh-badge--pending'  },
  viendo:     { label: 'Viendo',      emoji: '▶️', className: 'vh-badge--playing'  },
  completado: { label: 'Completado',  emoji: '✅', className: 'vh-badge--finished' },
  dropeado:   { label: 'Dropeado',    emoji: '❌', className: 'vh-badge--dropped'  },
} as const;

/**
 * Convierte cualquier URL de video a su versión embeddable.
 * Soporta YouTube, Google Drive, Okru, Streamtape, SeekStreaming y más.
 */
export function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // ── YouTube ──
  const ytPatterns = [
    /youtube\.com\/watch\?v=([^#&?]{11})/,
    /youtu\.be\/([^#&?]{11})/,
    /youtube\.com\/shorts\/([^#&?]{11})/,
  ];
  for (const pattern of ytPatterns) {
    const match = trimmed.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  if (trimmed.includes('youtube.com/embed/')) return trimmed;

  // ── Google Drive ──
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  if (trimmed.includes('drive.google.com') && trimmed.includes('/preview')) return trimmed;

  // ── Okru ──
  const okruMatch = trimmed.match(/ok\.ru\/video\/(\d+)/);
  if (okruMatch) return `https://ok.ru/videoembed/${okruMatch[1]}`;
  if (trimmed.includes('ok.ru/videoembed/')) return trimmed;

  // ── Streamtape ──
  const stMatch = trimmed.match(/streamtape\.com\/v\/([^/?]+)/);
  if (stMatch) return `https://streamtape.com/e/${stMatch[1]}`;
  if (trimmed.includes('streamtape.com/e/')) return trimmed;

  // ── Doodstream ──
  const doodMatch = trimmed.match(/dood(?:stream)?\.(?:com|watch|to|re|li)\/d\/([^/?]+)/);
  if (doodMatch) return `https://doodstream.com/e/${doodMatch[1]}`;
  if (trimmed.match(/dood.*\/e\//)) return trimmed;

  // ── Streamwish / SeekStreaming / SeekPlays ──
  const swPatterns = [
    /streamwish\.(?:com|to)\/(?:e\/|f\/)?([^/?]+)/,
    /seekstreaming\.com\/(?:e\/|f\/)?([^/?]+)/,
    /seekplays\.online\/#([^&?/]+)/,
    /seekplays\.online\/(?:e\/|f\/)?([^/?#]+)/,
  ];
  for (const pattern of swPatterns) {
    const match = trimmed.match(pattern);
    if (match) return `https://seekstreaming.com/e/${match[1]}`;
  }
  if (trimmed.includes('seekstreaming.com/e/') || trimmed.includes('streamwish.com/e/')) return trimmed;

  // ── Filemoon ──
  const fmMatch = trimmed.match(/filemoon\.(?:sx|to|cc)\/e\/([^/?]+)/);
  if (fmMatch) return `https://filemoon.sx/e/${fmMatch[1]}`;
  const fmMatch2 = trimmed.match(/filemoon\.(?:sx|to|cc)\/(?:d\/)?([^/?]+)/);
  if (fmMatch2) return `https://filemoon.sx/e/${fmMatch2[1]}`;

  // ── VOE ──
  const voeMatch = trimmed.match(/voe\.sx\/(?:e\/)?([^/?]+)/);
  if (voeMatch) return `https://voe.sx/e/${voeMatch[1]}`;

  // ── Mega ──
  if (trimmed.includes('mega.nz')) return null;

  // ── Fallback embed directo ──
  if (trimmed.startsWith('http') && (
    trimmed.includes('/embed/') ||
    trimmed.includes('/e/') ||
    trimmed.includes('/player') ||
    trimmed.includes('#')
  )) return trimmed;

  return null;
}

export function getVideoProvider(url: string): string {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be'))            return 'youtube';
  if (url.includes('drive.google.com'))                                    return 'google-drive';
  if (url.includes('ok.ru'))                                               return 'okru';
  if (url.includes('streamtape.com'))                                      return 'streamtape';
  if (url.includes('dood'))                                                return 'doodstream';
  if (url.includes('streamwish') || url.includes('seekstreaming') ||
      url.includes('seekplays'))                                           return 'streamwish';
  if (url.includes('filemoon'))                                            return 'filemoon';
  if (url.includes('voe.sx'))                                              return 'voe';
  if (url.includes('mega.nz'))                                             return 'mega';
  return 'other';
}