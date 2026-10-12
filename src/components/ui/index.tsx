'use client';

import { LoaderCircle, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { forwardRef, useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/** Joins class names; later Tailwind classes win over earlier ones (so `className` can override defaults). */
const cx = (...c: (string | false | null | undefined)[]) => twMerge(c.filter(Boolean).join(' '));
export { cx };

// ── Buttons ────────────────────────────────────────────────

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
};

const variants = {
  primary: 'bg-violet-500 text-white shadow-[0_3px_0_var(--color-violet-700)] hover:bg-violet-400 active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-violet-700)]',
  success: 'bg-mint-600 text-white shadow-[0_3px_0_var(--color-mint-800)] hover:bg-mint-700 active:translate-y-[2px] active:shadow-none',
  secondary: 'bg-white text-ink border-2 border-ink-200 hover:border-violet-200 hover:bg-violet-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  danger: 'bg-white text-coral-700 border-2 border-coral-100 hover:bg-coral-50',
};

/** The one button. Chunky "pressable" look matches the mobile app. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-55',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-5 text-[15px]',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

// ── Form fields ────────────────────────────────────────────

type FieldProps = { label: string; error?: string; hint?: string; className?: string; children: (id: string, describedBy?: string) => ReactNode };

export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} className="animate-rise text-[13px] font-semibold text-coral-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const control = (invalid?: boolean) =>
  cx(
    'w-full rounded-xl border-2 bg-white px-3.5 text-[15px] font-medium text-ink outline-none transition placeholder:text-ink-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100',
    invalid ? 'border-coral-500' : 'border-ink-200',
  );

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; wrapperClassName?: string };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, wrapperClassName, className, ...props }, ref) {
  return (
    <Field label={label} error={error} hint={hint} className={wrapperClassName}>
      {(id, describedBy) => <input ref={ref} id={id} aria-invalid={!!error || undefined} aria-describedby={describedBy} className={cx(control(!!error), 'h-11', className)} {...props} />}
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string; wrapperClassName?: string; options: { value: string; label: string }[]; placeholder?: string };
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, hint, wrapperClassName, className, options, placeholder, ...props }, ref) {
  return (
    <Field label={label} error={error} hint={hint} className={wrapperClassName}>
      {(id, describedBy) => (
        <select ref={ref} id={id} aria-invalid={!!error || undefined} aria-describedby={describedBy} className={cx(control(!!error), 'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2718%27%20height%3D%2718%27%20fill%3D%27none%27%20stroke%3D%27%235A5680%27%20stroke-width%3D%272.5%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-[position:right_12px_center] bg-no-repeat pr-10', className)} {...props}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string; wrapperClassName?: string };
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, wrapperClassName, className, ...props }, ref) {
  return (
    <Field label={label} error={error} hint={hint} className={wrapperClassName}>
      {(id, describedBy) => <textarea ref={ref} id={id} aria-invalid={!!error || undefined} aria-describedby={describedBy} className={cx(control(!!error), 'min-h-24 py-2.5', className)} {...props} />}
    </Field>
  );
}
);

// ── Layout pieces ──────────────────────────────────────────

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-2xl border border-ink-100 bg-white p-5 shadow-card', className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-ink sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] text-ink-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

const badgeTones = {
  violet: 'bg-violet-50 text-violet-700',
  mint: 'bg-mint-50 text-mint-800',
  sun: 'bg-sun-100 text-sun-800',
  coral: 'bg-coral-100 text-coral-700',
  sky: 'bg-sky-100 text-sky-800',
  ink: 'bg-ink-100 text-ink-700',
};
export type Tone = keyof typeof badgeTones;
export function Badge({ tone = 'ink', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap', badgeTones[tone])}>{children}</span>;
}

export function Stat({ label, value, hint, tone = 'violet', icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-ink-500">{label}</span>
        {icon ? <span className={cx('grid size-9 place-items-center rounded-xl', badgeTones[tone])}>{icon}</span> : null}
      </div>
      <div className="font-display text-[30px] leading-none font-extrabold">{value}</div>
      {hint ? <div className="text-[13px] text-ink-500">{hint}</div> : null}
    </Card>
  );
}

export function Empty({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      {icon ? <div className="grid size-14 place-items-center rounded-2xl bg-violet-50 text-violet-500">{icon}</div> : null}
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {message ? <p className="max-w-md text-[15px] text-ink-500">{message}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-ink-100', className)} />;
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral-100 bg-coral-50 p-4 text-coral-700">
      <span className="font-semibold">{error instanceof Error ? error.message : 'Something went wrong.'}</span>
      {onRetry ? (
        <Button size="sm" variant="danger" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Notice({ tone = 'sky', title, children, action }: { tone?: Tone; title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={cx('flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4', badgeTones[tone])}>
      <div className="min-w-0 flex-1">
        {title ? <div className="font-extrabold">{title}</div> : null}
        <div className="text-[14px] opacity-90">{children}</div>
      </div>
      {action}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────

export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card', className)}>
      <table className="w-full min-w-[560px] text-left text-[14px]">
        <thead className="bg-paper text-[12px] font-extrabold tracking-wide text-ink-500 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

// ── Dialog ─────────────────────────────────────────────────

/** Native <dialog>: focus trap, Escape to close and a backdrop for free. */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx('m-auto w-[calc(100%-32px)] rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink-900/40 backdrop:backdrop-blur-sm open:animate-pop', wide ? 'max-w-3xl' : 'max-w-lg')}
    >
      {open ? (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-4">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-xl text-ink-500 hover:bg-ink-100">
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 px-6 py-4">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

// ── Tabs ───────────────────────────────────────────────────

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (t: T) => void; tabs: { value: T; label: string; icon?: ReactNode }[] }) {
  return (
    <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-card">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold whitespace-nowrap transition', value === t.value ? 'bg-violet-500 text-white' : 'text-ink-700 hover:bg-violet-50')}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const colors = ['bg-violet-500', 'bg-mint-600', 'bg-coral-500', 'bg-sky-600', 'bg-sun-600'];
  const hash = [...name].reduce((n, c) => n + c.charCodeAt(0), 0);
  const letters = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold text-white', colors[hash % colors.length], className)}>{letters}</span>;
}
