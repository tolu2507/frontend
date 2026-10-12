'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button, ErrorBox, Input } from '@/components/ui';
import { api } from '@/lib/api';

const schema = z.object({ identifier: z.string().trim().min(3, 'Enter your email or phone number.') });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '' } });

  const onSubmit = handleSubmit(async ({ identifier }) => {
    setError(null);
    try {
      const id = identifier.toLowerCase();
      await api('/auth/forgot-password', { body: { identifier: id } });
      router.push(`/set-password?mode=reset&email=${encodeURIComponent(id)}`);
    } catch (e) {
      setError(e);
    }
  });

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We’ll send a 6-digit code to your email (or WhatsApp, for a phone number)."
      footer={
        <Link href="/login" className="font-bold text-violet-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input label="Email or phone number" autoComplete="username" autoFocus error={formState.errors.identifier?.message} {...register('identifier')} />
        {error ? <ErrorBox error={error} /> : null}
        <Button type="submit" loading={formState.isSubmitting} className="mt-2 h-12">
          Send me a code
        </Button>
      </form>
    </AuthShell>
  );
}
