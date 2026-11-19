'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCanva } from '@/context/CanvaContext';
import { Presenter } from '@/components/editor/Presenter';

export function PresentClient({ id }: { id: string }) {
  const { hydrated, projects } = useCanva();
  const router = useRouter();
  const start = Number(useSearchParams().get('p')) || 0;
  const project = projects.find((p) => p.id === id && !p.trashed);
  if (!hydrated) return <div className="fixed inset-0 bg-black" />;
  if (!project)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black text-white">
        <p>This design could not be found in this browser.</p>
        <Link href="/" className="bg-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold">
          Back to home
        </Link>
      </div>
    );
  return <Presenter project={project} start={start} onExit={() => router.push(`/design/${id}/`)} />;
}
