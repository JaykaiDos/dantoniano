// ─────────────────────────────────────────────
// Tipos globales del proyecto Dantoniano Hub
// ─────────────────────────────────────────────

export type Season = {
  id: string;
  name: string;        // "Invierno 2025"
  slug: string;        // "invierno-2025"
  year: number;
  cour: 'invierno' | 'primavera' | 'verano' | 'otoño';
  emoji: string;       // "❄️"
  is_current: boolean;
  anime_count?: number;
  created_at: string;
};

export type Anime = {
  id: string;
  title: string;
  title_jp?: string;
  cover_url?: string;
  synopsis?: string;
  genres: string[];
  year: number;
  season_id?: string;
  season?: Season;
  mal_id?: number;
  // Estado de la lista personal
  personal_status: 'pendiente' | 'viendo' | 'completado' | 'dropeado' | null;
  personal_score?: number;   // 1-10
  personal_notes?: string;
  is_featured: boolean;
  reaction_count?: number;
  created_at: string;
};

export type Reaction = {
  id:                 string;
  anime_id:           string;
  anime?:             Anime;
  episode_number:     number;
  youtube_url:        string;   // fuente principal (cualquier plataforma)
  youtube_id:         string;
  thumbnail_url?:     string;
  title:              string;
  duration?:          string;
  published_at?:      string;
  // Fuentes alternativas
  source_okru?:       string;
  source_streamtape?: string;
  source_doodstream?: string;
  source_streamwish?: string;
  source_filemoon?:   string;
  source_voe?:        string;
  created_at:         string;
};

export type PersonalStatus = Anime['personal_status'];

export type Profile = {
  id:               string;
  display_name:     string;
  avatar_url?:      string;
  bio?:             string;
  youtube_channel?: string;
  twitter?:         string;
  kick_channel?:    string;
  instagram?:       string;
  discord?:         string;
  twitch?:          string;
  created_at:       string;
};