import { channels } from "@/data/seed-media";
import { ChannelView } from "./ChannelView";

export const dynamicParams = false;
export function generateStaticParams() {
  return channels.map((c) => ({ handle: c.handle }));
}

export default async function ChannelPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <ChannelView handle={handle} />;
}
