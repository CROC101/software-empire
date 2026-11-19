import { DESIGN_SLOTS } from '@/lib/slots';
import { EditorWorkspace } from '@/components/editor/EditorWorkspace';

export const dynamicParams = false;

export function generateStaticParams() {
  return DESIGN_SLOTS.map((id) => ({ id }));
}

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorWorkspace id={id} />;
}
