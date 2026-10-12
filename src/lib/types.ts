/** Shapes returned by the Nexus API's /school routes. Money is kobo as a string. */
export type Level = 'NURSERY' | 'PRIMARY' | 'JUNIOR_SECONDARY' | 'SENIOR_SECONDARY';
export type TermName = 'FIRST' | 'SECOND' | 'THIRD';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AssessmentType = 'CLASSWORK' | 'ASSIGNMENT' | 'QUIZ' | 'TEST' | 'EXAM';
export type Person = { id: string; firstName: string; lastName: string };

export type Overview = {
  school: { id: string; name: string; status: string; logoUrl: string | null; brandColor: string | null; address: string | null; state: string | null; lga: string | null; email: string | null; phone: string | null; tuckShopRequirePin: boolean };
  me: { role: 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'TEACHER'; isAdmin: boolean };
  year: { id: string; name: string } | null;
  term: { id: string; name: TermName; startDate: string; endDate: string } | null;
  counts: { students: number; staff: number; classes: number };
  attendanceToday: { marked: number; present: number };
  fees: { invoices: number; billedKobo: string; paidKobo: string } | null;
  reportsThisWeek: number;
  setup: { hasYear: boolean; hasSubjects: boolean; hasClasses: boolean; hasClassSubjects: boolean; hasStudents: boolean };
};

export type Year = { id: string; name: string; isCurrent: boolean; startDate: string; endDate: string; terms: { id: string; name: TermName; startDate: string; endDate: string }[] };
export type Subject = { id: string; name: string };
export type SchoolClass = {
  id: string;
  name: string;
  level: Level;
  gradeName: string;
  armName: string | null;
  formTeacher: Person | null;
  studentCount: number;
  subjects: { id: string; subjectId: string; name: string; teacher: Person | null }[];
};
export type StaffMember = { membershipId: string; role: 'SCHOOL_OWNER' | 'SCHOOL_ADMIN' | 'TEACHER' | 'TUCK_SHOP'; status: string; id: string; firstName: string; lastName: string; email: string | null; phone: string | null; hasSignedIn: boolean };
export type StudentRow = { id: string; firstName: string; lastName: string; admissionNo: string | null; shopCode: string; username: string | null; className: string; classId: string; parents: { name: string; email: string | null; phone: string | null }[] };
export type StudentDetail = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  username: string | null;
  admissionNo: string | null;
  shopCode: string;
  level: Level;
  class: { id: string; name: string } | null;
  xp: number;
  streak: number;
  parents: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; relationship: string; hasSignedIn: boolean; status: 'ACTIVE' | 'INVITED' | 'AWAITING_PARENT' }[];
  attendance: { present: number; late: number; absent: number; excused: number };
  results: { id: string; subject: string; title: string; type: AssessmentType; score: number; maxScore: number; heldOn: string }[];
  notes: { id: string; category: string; body: string; visibleToParent: boolean; createdAt: string; author: string }[];
  invoices: { id: string; term: string; totalKobo: string; paidKobo: string; status: string; dueDate: string }[];
  latestReport: { weekStart: string; headline: string | null; summary: string | null } | null;
};
export type Invoice = {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string | null;
  className: string;
  items: { label: string; amountKobo: string }[];
  totalKobo: string;
  paidKobo: string;
  status: 'UNPAID' | 'PART_PAID' | 'PAID' | 'VOID';
  dueDate: string;
};
