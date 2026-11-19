import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from 'react';
import { I } from '../components/Icons';
import { Avatar, Modal, Spinner } from '../components/ui';
import { putFile } from '../lib/idb';
import { useMe, useStore } from '../store';
import type { Media } from '../types';

export const FILTERS: [string, string][] = [
  ['Original', ''],
  ['Vivid', 'contrast(1.15) saturate(1.4)'],
  ['Warm', 'sepia(.25) saturate(1.3) brightness(1.05)'],
  ['Cool', 'hue-rotate(-12deg) saturate(1.1) brightness(1.05)'],
  ['Mono', 'grayscale(1) contrast(1.1)'],
  ['Fade', 'contrast(.85) brightness(1.12) saturate(.8)'],
  ['Drama', 'contrast(1.35) brightness(.92)'],
  ['Dream', 'brightness(1.12) saturate(1.2) blur(.4px)'],
  ['Retro', 'sepia(.5) contrast(1.05) hue-rotate(-8deg)'],
];
const ASPECTS: [string, number | null][] = [['Original', null], ['1:1', 1], ['4:5', 4 / 5], ['16:9', 16 / 9]];

interface Item { file: File; url: string; video: boolean; w: number; h: number; zoom: number; x: number; y: number }

function load(file: File): Promise<Item> {
  const url = URL.createObjectURL(file);
  const video = file.type.startsWith('video/');
  return new Promise((resolve, reject) => {
    if (video) {
      const v = document.createElement('video');
      v.onloadedmetadata = () => resolve({ file, url, video, w: v.videoWidth || 9, h: v.videoHeight || 16, zoom: 1, x: 0, y: 0 });
      v.onerror = reject;
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => resolve({ file, url, video, w: img.naturalWidth, h: img.naturalHeight, zoom: 1, x: 0, y: 0 });
      img.onerror = reject;
      img.src = url;
    }
  });
}

/** Cover-fit + zoom + pan, the same maths as the preview. Pan x/y are fractions of the frame. */
export function cropRect(it: { w: number; h: number; zoom: number; x: number; y: number }, W: number, H: number) {
  const s = Math.max(W / it.w, H / it.h) * it.zoom;
  const dw = it.w * s;
  const dh = it.h * s;
  return { dx: (W - dw) / 2 + it.x * W, dy: (H - dh) / 2 + it.y * H, dw, dh };
}

async function render(it: Item, aspect: number): Promise<Blob> {
  const W = 1080;
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const img = new Image();
  img.src = it.url;
  await img.decode();
  const { dx, dy, dw, dh } = cropRect(it, W, H);
  c.getContext('2d')!.drawImage(img, dx, dy, dw, dh);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', 0.86));
}

export function CreateModal({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const addPost = useStore((s) => s.addPost);
  const addStory = useStore((s) => s.addStory);
  const [step, setStep] = useState<'select' | 'crop' | 'filter' | 'details' | 'sharing' | 'done'>('select');
  const [items, setItems] = useState<Item[]>([]);
  const [cur, setCur] = useState(0);
  const [aspectKey, setAspectKey] = useState<string>('1:1');
  const [filter, setFilter] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [alsoStory, setAlsoStory] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const pan = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), [items]);

  const it = items[cur];
  const aspect = ASPECTS.find(([k]) => k === aspectKey)?.[1] ?? (it ? it.w / it.h : 1);
  const clampedAspect = Math.min(Math.max(aspect, 4 / 5), 16 / 9);

  const pick = async (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 10);
    if (!list.length) return setError('This file is not supported. Choose a photo or video.');
    try {
      const loaded = await Promise.all(list.map(load));
      setItems(loaded);
      setCur(0);
      setError('');
      if (loaded[0].video) setAspectKey('Original');
      setStep('crop');
    } catch {
      setError('Could not read this file.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files);
  };

  const patch = (p: Partial<Item>) => setItems(items.map((x, i) => (i === cur ? { ...x, ...p } : x)));

  const share = async () => {
    setStep('sharing');
    try {
      const media: Media[] = [];
      for (const x of items) {
        const blob = x.video ? x.file : await render(x, clampedAspect);
        media.push({ src: await putFile(blob), kind: x.video ? 'video' : 'image', filter: filter || undefined, aspect: x.video ? x.w / x.h : clampedAspect });
      }
      const isReel = media.every((m) => m.kind === 'video');
      addPost({ media, caption: caption.trim(), location: location.trim() || undefined, isReel, audio: isReel ? 'Original audio' : undefined });
      if (alsoStory) addStory(media[0].src);
      setStep('done');
    } catch {
      setError('Sharing failed. Please try again.');
      setStep('details');
    }
  };

  const close = () => (items.length && step !== 'done' ? setConfirmClose(true) : onClose());
  const titles = { select: 'Create new post', crop: 'Crop', filter: 'Edit', details: 'Create new post', sharing: 'Sharing', done: 'Post shared' };
  const nextStep = { crop: 'filter', filter: 'details' } as const;
  const prevStep = { crop: 'select', filter: 'crop', details: 'filter' } as const;
  const wide = step === 'filter' || step === 'details';

  const preview = it && (
    <div
      className="crop-frame"
      ref={frame}
      style={{ aspectRatio: String(clampedAspect) }}
      onPointerDown={(e: PointerEvent) => { if (step !== 'crop') return; (e.target as HTMLElement).setPointerCapture(e.pointerId); pan.current = { x: e.clientX, y: e.clientY, ox: it.x, oy: it.y }; }}
      onPointerMove={(e: PointerEvent) => {
        if (!pan.current || !frame.current) return;
        const r = frame.current.getBoundingClientRect();
        patch({ x: pan.current.ox + (e.clientX - pan.current.x) / r.width, y: pan.current.oy + (e.clientY - pan.current.y) / r.height });
      }}
      onPointerUp={() => (pan.current = null)}
    >
      {it.video ? (
        <video src={it.url} autoPlay loop muted playsInline style={{ filter, transform: `translate(${it.x * 100}%, ${it.y * 100}%) scale(${it.zoom})` }} />
      ) : (
        <img src={it.url} alt="Preview" draggable={false} style={{ filter, transform: `translate(${it.x * 100}%, ${it.y * 100}%) scale(${it.zoom})` }} />
      )}
      {step === 'crop' && <div className="crop-grid" aria-hidden="true"><i /><i /><i /><i /></div>}
      {items.length > 1 && (
        <>
          {cur > 0 && <button className="car-arrow left" onClick={() => setCur(cur - 1)} aria-label="Previous"><I.ChevronLeft size={16} strokeWidth={3} /></button>}
          {cur < items.length - 1 && <button className="car-arrow right" onClick={() => setCur(cur + 1)} aria-label="Next"><I.ChevronRight size={16} strokeWidth={3} /></button>}
          <div className="car-dots">{items.map((_, k) => <i key={k} className={k === cur ? 'on' : ''} />)}</div>
        </>
      )}
    </div>
  );

  return (
    <Modal onClose={close} className={`create ${wide ? 'wide' : ''}`} label="Create new post">
      <header className="modal-head">
        {step in prevStep ? <button className="plain" onClick={() => setStep(prevStep[step as keyof typeof prevStep])} aria-label="Back"><I.ArrowLeft /></button> : <span />}
        <b>{titles[step]}</b>
        {step in nextStep ? <button className="link-btn" onClick={() => setStep(nextStep[step as keyof typeof nextStep])}>Next</button>
          : step === 'details' ? <button className="link-btn" onClick={share}>Share</button> : <span />}
      </header>

      {step === 'select' && (
        <div className={`dropzone ${drag ? 'drag' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
          <I.Media size={96} />
          <p className="big">Drag photos and videos here</p>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-blue" onClick={() => fileInput.current?.click()}>Select from computer</button>
          <input ref={fileInput} type="file" accept="image/*,video/*" multiple hidden onChange={(e) => pick(e.target.files)} />
        </div>
      )}

      {(step === 'crop' || step === 'filter' || step === 'details') && it && (
        <div className="create-body">
          <div className="create-stage">
            {preview}
            {step === 'crop' && (
              <div className="crop-tools">
                <div className="crop-aspects">
                  {ASPECTS.map(([k]) => <button key={k} className={k === aspectKey ? 'on' : ''} onClick={() => setAspectKey(k)}>{k}</button>)}
                </div>
                {!it.video && (
                  <label className="zoom"><span>Zoom</span><input type="range" min={1} max={3} step={0.01} value={it.zoom} onChange={(e) => patch({ zoom: Number(e.target.value) })} aria-label="Zoom" /></label>
                )}
              </div>
            )}
          </div>
          {step === 'filter' && (
            <div className="create-side">
              <div className="filter-grid">
                {FILTERS.map(([name, f]) => (
                  <button key={name} className={`filter ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                    {it.video ? <span className="filter-swatch" style={{ filter: f }} /> : <img src={it.url} alt="" style={{ filter: f }} />}
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 'details' && (
            <div className="create-side">
              <div className="row gap12"><Avatar user={me} size={28} /><b>{me.username}</b></div>
              <textarea className="caption-input" placeholder="Write a caption..." maxLength={2200} value={caption} onChange={(e) => setCaption(e.target.value)} aria-label="Caption" autoFocus />
              <div className="muted tiny-text right">{caption.length}/2,200</div>
              <label className="detail-row"><input placeholder="Add location" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Location" /><I.Location size={18} /></label>
              <label className="detail-row"><span>Also share to your story</span><input type="checkbox" checked={alsoStory} onChange={(e) => setAlsoStory(e.target.checked)} /></label>
              {error && <p className="form-error">{error}</p>}
            </div>
          )}
        </div>
      )}

      {step === 'sharing' && <div className="dropzone"><Spinner /><p>Sharing…</p></div>}
      {step === 'done' && (
        <div className="dropzone">
          <span className="done-ring"><I.Check size={48} strokeWidth={2.4} /></span>
          <p className="big">Your post has been shared.</p>
          <button className="btn btn-blue" onClick={onClose}>Done</button>
        </div>
      )}

      {confirmClose && (
        <Modal onClose={() => setConfirmClose(false)} className="confirm" label="Discard post?" closeButton={false}>
          <div className="confirm-text"><b className="big">Discard post?</b><p className="muted">If you leave, your edits won't be saved.</p></div>
          <button className="confirm-btn danger" onClick={onClose}>Discard</button>
          <button className="confirm-btn" onClick={() => setConfirmClose(false)}>Cancel</button>
        </Modal>
      )}
    </Modal>
  );
}
