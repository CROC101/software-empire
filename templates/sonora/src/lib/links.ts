import type { TrackItem } from '@/types/spotify';
import { getAlbum, getArtist } from '@/data/seed-spotify';

/** Imported tracks have no album/artist page, so they point at the importer instead of a dead link. */
export const artistHref = (t: TrackItem) => (getArtist(t.artistId) ? `/artist/${t.artistId}` : '/import');
export const albumHref = (t: TrackItem) => (getAlbum(t.albumId) ? `/album/${t.albumId}` : '/import');
