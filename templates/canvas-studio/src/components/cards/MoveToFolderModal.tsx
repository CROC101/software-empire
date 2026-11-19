'use client';

import { Folder, FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { useCanva } from '@/context/CanvaContext';
import { Modal } from '@/components/ui/Modal';

export function MoveToFolderModal({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const canva = useCanva();
  const [name, setName] = useState('');
  const move = (folderId: string | null) => {
    canva.moveToFolder(ids, folderId);
    onClose();
  };
  return (
    <Modal open={ids.length > 0} onClose={onClose} title={`Move ${ids.length} design${ids.length > 1 ? 's' : ''} to folder`}>
      <div className="space-y-1">
        <button onClick={() => move(null)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-hover">
          <Folder size={16} className="text-muted" /> No folder
        </button>
        {canva.folders.map((f) => (
          <button key={f.id} onClick={() => move(f.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-hover">
            <Folder size={16} className="text-cyan" /> {f.name}
          </button>
        ))}
      </div>
      <form
        className="mt-4 flex gap-2 border-t border-line pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) move(canva.createFolder(name.trim()));
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New folder name" className="flex-1 rounded-lg border border-line bg-canvas px-3 py-2 text-sm" />
        <button className="flex items-center gap-1 rounded-lg bg-cyan px-3 text-sm font-semibold text-[#06272a]">
          <FolderPlus size={15} /> Create
        </button>
      </form>
    </Modal>
  );
}
