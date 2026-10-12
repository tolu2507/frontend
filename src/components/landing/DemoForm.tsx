'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { brand } from '@/config/brand';

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];
const ROLES = ['Proprietor / Owner', 'Principal / Head teacher', 'Administrator / Bursar', 'Teacher', 'Other'];
const SIZES = ['Under 100', '100–300', '300–700', '700–1,500', 'Over 1,500'];
const LEVELS = [
  { value: 'NURSERY', label: 'Nursery' },
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'JUNIOR_SECONDARY', label: 'JSS' },
  { value: 'SENIOR_SECONDARY', label: 'SSS' },
] as const;

const schema = z.object({
  contactName: z.string().trim().min(2, 'Enter your name.'),
  role: z.string().min(1, 'Choose your role.'),
  schoolName: z.string().trim().min(2, 'Enter your school’s name.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{10,18}$/, 'Enter a phone number we can call or WhatsApp.'),
  email: z.email('Enter a valid email.'),
  state: z.string().optional(),
  studentCount: z.string().optional(),
  levels: z.array(z.enum(['NURSERY', 'PRIMARY', 'JUNIOR_SECONDARY', 'SENIOR_SECONDARY'])),
  message: z.string().max(1000).optional(),
  website: z.string().optional(),
});
type Values = z.infer<typeof schema>;

const CONFETTI = ['#5B3DF5', '#FFC53D', '#19C39C', '#FF6B4A', '#2FA8FF'];

export function DemoForm() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: '', levels: [], state: '', studentCount: '' },
  });

  const onSubmit = async (values: Values) => {
    setServerError(null);
    try {
      const res = await fetch(`${brand.apiUrl}/schools/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          state: values.state || undefined,
          studentCount: values.studentCount || undefined,
          message: values.message?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = Array.isArray(body.message) ? body.message[0] : body.message;
        throw new Error(msg || 'Something went wrong.');
      }
      setDone(true);
    } catch (e) {
      setServerError(
        e instanceof TypeError
          ? 'We couldn’t reach our server. Check your connection and try again.'
          : `${(e as Error).message} Please try again.`,
      );
    }
  };

  if (done) {
    return (
      <div className="lp-form" role="status" aria-live="polite">
        <div className="lp-success">
          <span className="lp-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => {
              const angle = (i / 18) * Math.PI * 2;
              const dist = 90 + (i % 3) * 30;
              return (
                <i
                  key={i}
                  style={
                    {
                      background: CONFETTI[i % CONFETTI.length],
                      '--x': `${Math.cos(angle) * dist}px`,
                      '--y': `${Math.sin(angle) * dist + 40}px`,
                      '--r': `${(i * 67) % 360}deg`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </span>
          <span className="lp-success-badge">
            <Check size={44} strokeWidth={3} />
          </span>
          <h3>You’re on the list!</h3>
          <p>Thanks for your interest. We’ll call or WhatsApp you within one working day to book a time that suits your school.</p>
        </div>
      </div>
    );
  }

  const field = (name: keyof Values) => `lp-field${errors[name] ? ' invalid' : ''}`;
  const err = (name: keyof Values) =>
    errors[name] ? (
      <span id={`${name}-error`} className="lp-field-error">
        {errors[name]?.message as string}
      </span>
    ) : null;
  const aria = (name: keyof Values) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form className="lp-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="lp-form-row">
        <div className={field('contactName')}>
          <label htmlFor="contactName">Your name</label>
          <input id="contactName" autoComplete="name" {...register('contactName')} {...aria('contactName')} />
          {err('contactName')}
        </div>
        <div className={field('role')}>
          <label htmlFor="role">Your role</label>
          <select id="role" {...register('role')} {...aria('role')}>
            <option value="" disabled>
              Choose one
            </option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          {err('role')}
        </div>
      </div>
      <div className={field('schoolName')}>
        <label htmlFor="schoolName">School name</label>
        <input id="schoolName" autoComplete="organization" {...register('schoolName')} {...aria('schoolName')} />
        {err('schoolName')}
      </div>
      <div className="lp-form-row">
        <div className={field('phone')}>
          <label htmlFor="phone">Phone / WhatsApp</label>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 000 0000" {...register('phone')} {...aria('phone')} />
          {err('phone')}
        </div>
        <div className={field('email')}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" {...register('email')} {...aria('email')} />
          {err('email')}
        </div>
      </div>
      <div className="lp-form-row">
        <div className="lp-field">
          <label htmlFor="state">State</label>
          <select id="state" {...register('state')}>
            <option value="">Choose a state</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="lp-field">
          <label htmlFor="studentCount">Number of students</label>
          <select id="studentCount" {...register('studentCount')}>
            <option value="">Choose a range</option>
            {SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="lp-field">
        <fieldset>
          <legend>Which levels do you run?</legend>
          <div className="lp-toggles">
            {LEVELS.map((l) => (
              <label key={l.value} className="lp-toggle">
                <input type="checkbox" value={l.value} {...register('levels')} />
                <span>{l.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="lp-field">
        <label htmlFor="message">Anything we should know? (optional)</label>
        <textarea id="message" placeholder="e.g. We want to start before next term." {...register('message')} />
      </div>
      <div className="lp-hp" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>
      {serverError ? (
        <div className="lp-banner" role="alert">
          {serverError}
        </div>
      ) : null}
      <button type="submit" className="lp-btn" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle size={20} className="lp-spin" /> Sending…
          </>
        ) : (
          <>
            Book my free demo <ArrowRight size={20} className="arrow" />
          </>
        )}
      </button>
      <p className="lp-form-foot">We’ll only use these details to arrange your demo.</p>
    </form>
  );
}
