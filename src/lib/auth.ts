'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Role = 'PLATFORM_ADMIN' | 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'TUTOR' | 'TUCK_SHOP';
export type Membership = { id: string; role: Role; schoolId: string | null; schoolName: string | null };
export type SessionUser = { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; memberships: Membership[] };
export type Session = { accessToken: string; refreshToken: string; user: SessionUser };

export const SCHOOL_ROLES: Role[] = ['SCHOOL_OWNER', 'SCHOOL_ADMIN', 'TEACHER'];

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  /** The school chosen by someone who works at more than one. */
  schoolId: string | null;
  signIn: (s: Session) => void;
  setSchool: (id: string) => void;
  clear: () => void;
};

/** Web session, kept in localStorage. Access tokens are short-lived and refreshed by the API client. */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      schoolId: null,
      signIn: ({ accessToken, refreshToken, user }) => {
        const schools = user.memberships.filter((m) => m.schoolId && SCHOOL_ROLES.includes(m.role)).map((m) => m.schoolId!);
        const current = get().schoolId;
        set({ accessToken, refreshToken, user, schoolId: current && schools.includes(current) ? current : (schools[0] ?? null) });
      },
      setSchool: (id) => set({ schoolId: id }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null, schoolId: null }),
    }),
    { name: 'nexus-web-auth', storage: createJSONStorage(() => localStorage) },
  ),
);

/** Where someone lands after signing in. */
export function homeFor(user: SessionUser | null): '/overwatch' | '/dashboard' | '/no-access' | '/login' {
  if (!user) return '/login';
  const roles = user.memberships.map((m) => m.role);
  if (roles.includes('PLATFORM_ADMIN')) return '/overwatch';
  if (roles.some((r) => SCHOOL_ROLES.includes(r))) return '/dashboard';
  return '/no-access';
}
