import { seedVideos, UPLOAD_SLOTS } from "@/data/seed-media";
import { WatchView } from "./WatchView";

export const dynamicParams = false;

// Seed videos plus pre-built slots that uploads fill in from local storage.
export function generateStaticParams() {
  return [...seedVideos.map((v) => ({ id: v.id })), ...UPLOAD_SLOTS.map((id) => ({ id }))];
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WatchView id={id} />;
}
