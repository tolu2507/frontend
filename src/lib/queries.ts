'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from './api';
import { useAuth } from './auth';
import type { Overview, SchoolClass, StaffMember, Subject, Year } from './types';

/** Every school query is keyed by the selected school so switching schools never shows stale data. */
export const useSchoolKey = () => useAuth((s) => s.schoolId) ?? 'none';

export function useOverview() {
  const school = useSchoolKey();
  return useQuery({ queryKey: [school, 'overview'], queryFn: () => api<Overview>('/school') });
}
export function useClasses() {
  const school = useSchoolKey();
  return useQuery({ queryKey: [school, 'classes'], queryFn: () => api<SchoolClass[]>('/school/classes') });
}
export function useSubjects() {
  const school = useSchoolKey();
  return useQuery({ queryKey: [school, 'subjects'], queryFn: () => api<Subject[]>('/school/subjects') });
}
export function useStaff(enabled = true) {
  const school = useSchoolKey();
  return useQuery({ queryKey: [school, 'staff'], queryFn: () => api<StaffMember[]>('/school/staff'), enabled });
}
export function useYears() {
  const school = useSchoolKey();
  return useQuery({ queryKey: [school, 'years'], queryFn: () => api<Year[]>('/school/years') });
}
