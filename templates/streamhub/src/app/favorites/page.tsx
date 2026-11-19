import { PlaylistView } from "../playlists/[slug]/PlaylistView";

export const metadata = { title: "Favorites - StreamHub" };

export default function FavoritesPage() {
  return <PlaylistView slug="favorites" />;
}
