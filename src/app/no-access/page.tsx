'use client';

import { useRouter } from 'next/navigation';

import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/** Parents, students and tuck-shop staff use the mobile app; this dashboard is for schools and Overwatch. */
export default function NoAccess() {
  const router = useRouter();
  const { user, clear } = useAuth();
  return (
    <AuthShell title="This dashboard is for schools" subtitle={`${user ? `Hi ${user.firstName}. ` : ''}Parents, students and tuck-shop staff use the Nexus mobile app. If your school added you as staff, ask them to check your email address.`}>
      <Button
        variant="secondary"
        onClick={() => {
          clear();
          router.replace('/login');
        }}
      >
        Sign in with another account
      </Button>
    </AuthShell>
  );
}
