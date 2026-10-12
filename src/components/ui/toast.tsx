'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';
import { create } from 'zustand';

type Toast = { id: number; tone: 'success' | 'error'; message: string };
const useToasts = create<{ items: Toast[]; push: (t: Omit<Toast, 'id'>) => void; drop: (id: number) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 4500);
  },
  drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToasts.getState().push({ tone: 'success', message }),
  error: (message: string) => useToasts.getState().push({ tone: 'error', message }),
};

export function Toaster() {
  const { items, drop } = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => drop(t.id)}
          className={`pointer-events-auto flex max-w-md animate-pop items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold shadow-xl ${t.tone === 'success' ? 'bg-ink text-white' : 'bg-coral-500 text-white'}`}
        >
          {t.tone === 'success' ? <CircleCheck className="size-5 shrink-0 text-mint-400" /> : <CircleAlert className="size-5 shrink-0" />}
          {t.message}
        </button>
      ))}
    </div>
  );
}
