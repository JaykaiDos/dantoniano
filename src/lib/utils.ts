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