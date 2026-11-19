export interface LyricLine {
  /** seconds from the start of the track */
  time: number;
  text: string;
}

export interface CoverArt {
  /** dominant colour, used for the ambient hero gradient */
  color: string;
  /** second colour for the generated cover */
  accent: string;
  /** real artwork (YouTube thumbnail) when there is one */
  image?: string;
}

export interface TrackItem {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  /** seconds */
  duration: number;
  src: string;
  cover: CoverArt;
  explicit?: boolean;
  genres: string[];
  lyrics: LyricLine[];
  addedAt: string;
  source: 'catalog' | 'youtube' | 'synth';
  youtubeId?: string;
  disc?: number;
  /** trim in/out points for imported tracks (seconds) */
  trimStart?: number;
  trimEnd?: number;
  tags?: string[];
}

export interface PlaylistItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  cover: CoverArt;
  trackIds: string[];
  custom?: boolean;
}

export interface AlbumItem {
  id: string;
  title: string;
  artistId: string;
  year: number;
  releaseDate: string;
  type: 'Album' | 'Single' | 'EP';
  cover: CoverArt;
  trackIds: string[];
  copyright: string;
}

export interface ArtistItem {
  id: string;
  name: string;
  cover: CoverArt;
  monthlyListeners: number;
  bio: string;
  city: string;
}

export interface GenreItem {
  slug: string;
  name: string;
  color: string;
  accent: string;
}

export interface EqPreset {
  name: 'Flat' | 'Bass Boost' | 'Electronic' | 'Vocal' | 'Acoustic';
  /** gains in dB for 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz */
  gains: [number, number, number, number, number];
}

export type RepeatMode = 'off' | 'all' | 'one';
export type StreamQuality = 'auto' | 'normal' | 'high' | 'veryhigh';
