'use client';

import { useRouter } from 'next/navigation';
import { useCanva, type NewDesignInput } from '@/context/CanvaContext';

/** Create / clone a design and jump straight into the editor. */
export function useDesignActions() {
  const router = useRouter();
  const canva = useCanva();
  const open = (id: string | null) => id && router.push(`/design/${id}/`);
  return {
    createAndOpen: (input: NewDesignInput) => open(canva.createProject(input)),
    cloneTemplate: (templateId: string) => open(canva.createFromTemplate(templateId)),
    duplicateAndOpen: (id: string) => open(canva.duplicateProject(id)),
  };
}
