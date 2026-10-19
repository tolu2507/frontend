import { brand } from './brand';

/**
 * What search engines and link previews say about Nexus. The title leads with the exams parents search for;
 * keep it under about 60 characters and the description under about 160, or Google cuts them off.
 */
export const seo = {
  title: `JAMB, WAEC, BECE & Common Entrance Practice | ${brand.name}`,
  description:
    'Daily exam practice for your child from Nursery to SS3: JAMB, WAEC, NECO, BECE and Common Entrance, a CBT mock every Friday, and a weekly report for you.',
  shareTitle: `${brand.name}: help your child pass, from Nursery to JAMB`,
  locale: 'en_NG',
};

/** Logins, dashboards and Overwatch: never shown in search results. */
export const PRIVATE_PATHS = ['/login', '/forgot-password', '/set-password', '/no-access', '/dashboard', '/overwatch'];

/** The parent FAQ, shown on the landing page and given to search engines as FAQ structured data. */
export const FAQS = [
  {
    q: `Does my child’s school need to use ${brand.name}?`,
    a: 'No. You sign up yourself and add your children. If their school joins later, your reports can include school results and attendance too.',
  },
  {
    q: 'Do we need to download an app?',
    a: `Get ${brand.name} from Google Play or the App Store, or skip the download and use it in the browser on any phone, tablet or laptop.`,
  },
  {
    q: 'Which exams and classes do you cover?',
    a: 'Common Entrance, BECE, WAEC, NECO and JAMB, plus class practice for Nursery 1 and 2 and Primary 1 to 5.',
  },
  {
    q: 'Where do the questions come from?',
    a: 'We study past papers to learn what each exam tests and how, then write our own original questions to match. Answers are checked before any child sees them.',
  },
  {
    q: 'My child is in nursery and can’t read yet. Can they use it?',
    a: 'Yes. Every nursery question is read aloud, and answers are big pictures they tap. You can turn the voice off at any time.',
  },
  {
    q: 'Can I add more than one child?',
    a: 'Yes. Add all your children to one parent account. Each gets their own login, practice and weekly report.',
  },
];
