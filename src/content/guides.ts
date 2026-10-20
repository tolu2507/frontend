/**
 * Parent guides: one page per thing parents search for. Text supports **bold** and [links](/guides/slug).
 * Exam rules change; keep facts to what's stable and point parents to the official body for dates and details.
 */

export type Block =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { tip: string };

export type Guide = {
  slug: string;
  /** Short name for menus and cards. */
  short: string;
  /** The page's heading. */
  title: string;
  /** For Google: under about 60 characters. */
  metaTitle: string;
  /** For Google: under about 160 characters. */
  description: string;
  /** The exam or stage, shown as a tag. */
  tag: string;
  /** When the facts were last checked (YYYY-MM-DD). */
  updated: string;
  /** One or two sentences under the heading. */
  intro: string;
  body: Block[];
  /** Closing line above the app buttons. */
  cta: string;
  /** Other guides to suggest at the end. */
  related: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-prepare-for-jamb',
    short: 'How to prepare for JAMB',
    title: 'How to prepare for JAMB UTME: a parent’s guide',
    metaTitle: 'How to Prepare for JAMB UTME: A Parent’s Guide',
    description: 'How the JAMB UTME works, how it’s scored, and a simple step-by-step plan to help your child prepare for the CBT and score high.',
    tag: 'JAMB',
    updated: '2026-10-20',
    intro: 'JAMB decides which university doors open for your child. The good news: it rewards steady practice more than last-minute cramming. Here is how it works, and how you can help.',
    body: [
      { h2: 'How the UTME works' },
      { p: 'The Unified Tertiary Matriculation Examination (UTME) is a computer-based test (CBT) set by the Joint Admissions and Matriculation Board (JAMB). Your child sits **four subjects**: **Use of English** is compulsory for everyone, and the other three depend on the course they want to study.' },
      {
        table: {
          head: ['Part', 'Questions', 'Marks'],
          rows: [
            ['Use of English', '60', '100'],
            ['Subject 2', '40', '100'],
            ['Subject 3', '40', '100'],
            ['Subject 4', '40', '100'],
            ['Total', '180', '400'],
          ],
        },
      },
      { p: 'All the questions are multiple choice, answered on a computer within about **two hours**. There is no negative marking, so your child should never leave a question blank.' },
      { tip: 'The exam is on a computer, and many children lose marks to the clock, not the questions. Timed practice on a screen is one of the most useful things they can do.' },
      { h2: 'Choose the right subjects first' },
      { p: 'The three subjects beside English must match the course and university your child is aiming for. Picking the wrong combination can mean a good score that still doesn’t qualify. See our guide to [JAMB subject combinations](/guides/jamb-subject-combinations), then confirm in JAMB’s official brochure for the exact course and school.' },
      { h2: 'A simple plan that works' },
      {
        ol: [
          '**Start early.** Six months of short daily practice beats six weeks of panic. Even 30 to 45 minutes a day adds up.',
          '**Study the syllabus, topic by topic.** JAMB publishes a syllabus for every subject. Some topics come up nearly every year; those deserve the most time.',
          '**Practise in exam conditions.** Once a week, do a full timed mock: 180 questions, about two hours, no phone.',
          '**Review every wrong answer.** A wrong answer understood is worth more than ten right answers repeated. Come back to missed questions a few days later.',
          '**Read for English.** Comprehension and vocabulary carry a big share of the marks. Reading newspapers and novels helps more than memorising word lists.',
          '**Look after sleep and health** in the final weeks. A tired child reads questions wrongly.',
        ],
      },
      { h2: 'How you can help as a parent' },
      {
        ul: [
          'Agree a fixed daily study time and protect it, like school.',
          'Ask what they practised today, not just “have you read?”.',
          'Watch the trend in mock scores, not one bad day.',
          'Make sure registration, the profile code and the exam date and centre are sorted early.',
        ],
      },
      { h2: 'Where Nexus fits in' },
      { p: 'Nexus gives your child JAMB practice topic by topic, from easy to hard, with worked answers after every round and a timed mock every Friday that feels like the real CBT. Questions are original and never repeat, and you get a short report every week showing what they did and where they’re improving.' },
    ],
    cta: 'Start your child’s JAMB practice today.',
    related: ['jamb-subject-combinations', 'waec-neco-guide'],
  },
  {
    slug: 'jamb-subject-combinations',
    short: 'JAMB subject combinations',
    title: 'JAMB subject combinations for popular courses',
    metaTitle: 'JAMB Subject Combinations for Popular Courses',
    description: 'The usual JAMB subject combinations for medicine, engineering, law, accounting and more, and how to confirm the right one for your child’s university.',
    tag: 'JAMB',
    updated: '2026-10-20',
    intro: 'In JAMB, Use of English is compulsory and your child picks three more subjects. Those three must match the course they want. Here are the usual combinations for popular courses.',
    body: [
      { h2: 'Common combinations' },
      {
        table: {
          head: ['Course', 'Usual subjects (with Use of English)'],
          rows: [
            ['Medicine, Nursing, Pharmacy', 'Biology, Chemistry, Physics'],
            ['Engineering', 'Mathematics, Physics, Chemistry'],
            ['Computer Science', 'Mathematics, Physics, Chemistry'],
            ['Law', 'Literature in English, Government, History or another arts subject'],
            ['Accounting, Banking and Finance', 'Mathematics, Economics, plus Accounting or another social science'],
            ['Economics', 'Mathematics, Economics, plus Government or another social science'],
            ['Mass Communication', 'Literature in English, Government, Economics or another arts or social science subject'],
          ],
        },
      },
      { tip: 'Universities can differ for the same course. Always check the exact requirement for your child’s chosen university and course in JAMB’s official brochure before registering.' },
      { h2: 'How to choose' },
      {
        ol: [
          '**Start from the course,** not the subjects your child finds easiest.',
          '**Check two or three universities** they might apply to, so one combination covers them all.',
          '**Match WAEC or NECO too.** Most courses also need credits in related subjects at O level, including English and Mathematics. See our [WAEC and NECO guide](/guides/waec-neco-guide).',
          '**Register exactly that combination.** It can be hard to change after registration.',
        ],
      },
      { h2: 'Practise the combination they chose' },
      { p: 'In Nexus, your child picks Use of English plus their three subjects, and their practice, Friday mocks and your weekly report all follow that combination. For the exam itself, see [how to prepare for JAMB](/guides/how-to-prepare-for-jamb).' },
    ],
    cta: 'Set up your child’s JAMB combination and start practising.',
    related: ['how-to-prepare-for-jamb', 'waec-neco-guide'],
  },
  {
    slug: 'common-entrance-exam-guide',
    short: 'Common Entrance guide',
    title: 'Common Entrance (NCEE): subjects, format and how to prepare',
    metaTitle: 'Common Entrance Exam (NCEE): Subjects and How to Prepare',
    description: 'What the National Common Entrance Examination into Federal Unity Colleges tests, how admission works, and how to help your child prepare at home.',
    tag: 'Common Entrance',
    updated: '2026-10-20',
    intro: 'The Common Entrance is many children’s first big exam, usually taken in Primary 5 or 6. A calm, steady routine makes all the difference at this age.',
    body: [
      { h2: 'What it is' },
      { p: 'The **National Common Entrance Examination (NCEE)** is set by the National Examinations Council (NECO) for admission into JSS1 at Federal Government Colleges, often called Unity Schools. Many private and state secondary schools set their own entrance exams along similar lines.' },
      { h2: 'What it tests' },
      { p: 'The exact papers can change from year to year, but children are tested on these areas:' },
      {
        ul: [
          '**Mathematics:** numbers, fractions, money, measurement, shapes and simple data.',
          '**English:** comprehension, grammar, vocabulary and spelling.',
          '**Basic Science:** living things, the human body, simple science around us.',
          '**Social Studies and National Values:** family, community, Nigeria and citizenship.',
          '**Quantitative Reasoning:** number patterns and puzzles.',
          '**Verbal Reasoning:** word patterns, analogies and odd ones out.',
        ],
      },
      { tip: 'Quantitative and Verbal Reasoning are new to most children: school rarely teaches them. A few weeks of puzzle-style practice makes a big difference.' },
      { h2: 'How admission works' },
      { p: 'For Unity Schools, admission considers merit (the score), a share for each state, and a small share for special cases. NECO announces the dates, centres and results each year, so check its official site for the current timetable.' },
      { h2: 'How to help your child prepare' },
      {
        ol: [
          '**Short, daily sessions.** Twenty to thirty minutes a day suits a 10-year-old better than long weekends.',
          '**Start with the basics.** Times tables, fractions and reading carry most of the marks.',
          '**Practise reasoning puzzles** weekly, so the question types feel familiar.',
          '**Do a timed mock** every week or two in the last months, so exam day feels normal.',
          '**Praise effort,** not just scores. Confidence matters a lot at this age.',
        ],
      },
      { h2: 'Where Nexus fits in' },
      { p: 'Nexus has Common Entrance practice in Mathematics, English, Basic Science, Social Studies and both reasoning papers, starting easy and getting harder as your child improves, with a mock every Friday. Children from Primary 4 can start, and you get a weekly report on their progress.' },
    ],
    cta: 'Start your child’s Common Entrance practice.',
    related: ['bece-guide', 'nursery-learning-at-home'],
  },
  {
    slug: 'bece-guide',
    short: 'BECE guide',
    title: 'BECE (Junior WAEC): subjects and how to prepare',
    metaTitle: 'BECE (Junior WAEC): Subjects and How to Prepare',
    description: 'What the Basic Education Certificate Examination at the end of JSS3 covers, why it matters for SS1, and a simple plan to help your child prepare.',
    tag: 'BECE',
    updated: '2026-10-20',
    intro: 'Your child sits the BECE at the end of JSS3. It decides their move into senior secondary, and how well they do in key subjects often shapes which class they join in SS1.',
    body: [
      { h2: 'Who runs it' },
      { p: 'The **Basic Education Certificate Examination (BECE)**, often called Junior WAEC, is run by each state’s ministry of education, with NECO setting it directly for Unity Schools and other federal schools. Dates differ by state and year, so check with your child’s school.' },
      { h2: 'The subjects' },
      { p: 'Children usually write around ten to twelve subjects, including:' },
      {
        ul: [
          'English Language and Mathematics (the two that matter most)',
          'Basic Science and Technology',
          'National Values Education',
          'Pre-Vocational Studies',
          'Business Studies',
          'Cultural and Creative Arts',
          'Christian or Islamic Religious Studies',
          'History',
          'French or Arabic, and a Nigerian language',
        ],
      },
      { tip: 'English and Mathematics are the subjects to get right. Many schools look closely at them, and at Basic Science, when placing children in science, arts or commercial classes in SS1.' },
      { h2: 'A simple plan' },
      {
        ol: [
          '**From JSS2,** practise a little every day across subjects, not only before exams.',
          '**In JSS3,** spend more time on English, Mathematics and Basic Science.',
          '**Learn the question style** with timed objective questions.',
          '**Review mistakes** a few days later, until they stick.',
        ],
      },
      { h2: 'Where Nexus fits in' },
      { p: 'Nexus covers the BECE subjects topic by topic, from easy to hard, with worked answers, a Friday mock and a weekly report for you. When your child moves to SS1, the same app carries on with WAEC, NECO and JAMB preparation.' },
    ],
    cta: 'Start your child’s BECE practice.',
    related: ['waec-neco-guide', 'common-entrance-exam-guide'],
  },
  {
    slug: 'waec-neco-guide',
    short: 'WAEC and NECO guide',
    title: 'WAEC and NECO SSCE: grades, credits and how to prepare',
    metaTitle: 'WAEC and NECO SSCE: Grades, Credits and How to Prepare',
    description: 'How WAEC and NECO grading works, the credits universities ask for, and how to help your child prepare for the senior school certificate exams.',
    tag: 'WAEC · NECO',
    updated: '2026-10-20',
    intro: 'WAEC (WASSCE) and NECO (SSCE) are the senior school certificate exams. Together with JAMB, the result decides university admission, so the credits really count.',
    body: [
      { h2: 'WAEC and NECO, side by side' },
      { p: 'Both are taken in SS3, usually in the middle of the year, and both are accepted for admission. Many children write both. Each also has a GCE for private candidates later in the year. Check the official sites for the current timetables.' },
      { h2: 'How grading works' },
      {
        table: {
          head: ['Grade', 'Meaning'],
          rows: [
            ['A1, B2, B3', 'Distinction and very good'],
            ['C4, C5, C6', 'Credit'],
            ['D7, E8', 'Pass (not a credit)'],
            ['F9', 'Fail'],
          ],
        },
      },
      { p: 'A **credit** means C6 or better. Universities and polytechnics usually ask for **five credits including English Language and Mathematics**, in subjects related to the course. Some accept results from two sittings; others want one. Check the requirement for your child’s course.' },
      { tip: 'English and Mathematics are compulsory credits for almost every course. A child who is strong in science but fails Mathematics cannot get in, so give these two extra attention.' },
      { h2: 'How to prepare' },
      {
        ol: [
          '**Cover the whole syllabus** for each subject well before SS3 third term.',
          '**Practise objective questions** daily; they are quick to mark and build speed.',
          '**Write theory answers** too: show working in Mathematics and the sciences, and plan essays in English.',
          '**Sit timed mocks** so three-hour papers don’t feel strange.',
        ],
      },
      { h2: 'Where Nexus fits in' },
      { p: 'Nexus has WAEC and NECO practice across the core and elective subjects, topic by topic, with worked answers and a weekly report for you. Pair it with JAMB practice: see [how to prepare for JAMB](/guides/how-to-prepare-for-jamb).' },
    ],
    cta: 'Start your child’s WAEC and NECO practice.',
    related: ['how-to-prepare-for-jamb', 'jamb-subject-combinations'],
  },
  {
    slug: 'nursery-learning-at-home',
    short: 'Nursery learning at home',
    title: 'Helping your nursery child learn at home',
    metaTitle: 'Helping Your Nursery Child Learn at Home: Simple Ideas',
    description: 'Simple, playful ways to help a Nursery 1 or Nursery 2 child with numbers, letters and sounds, colours and shapes at home, in a few minutes a day.',
    tag: 'Nursery',
    updated: '2026-10-20',
    intro: 'At three to five years old, children learn best through play, talk and repetition. A few happy minutes a day at home does more than long lessons.',
    body: [
      { h2: 'What nursery children learn' },
      {
        ul: [
          '**Numbers:** counting objects, recognising numbers, more and fewer, what comes next.',
          '**Letters and sounds:** recognising letters, the first sound of words, simple rhymes.',
          '**My world:** colours, shapes, parts of the body, animals and everyday things.',
        ],
      },
      { h2: 'Easy ideas for home' },
      {
        ol: [
          '**Count everything.** Stairs, oranges in the basket, cars on the road.',
          '**Play “I spy” with sounds:** “I spy something that starts with b… ball!”',
          '**Name colours and shapes** while cooking, dressing or walking.',
          '**Read together every day,** pointing at pictures and asking questions.',
          '**Keep it short:** five to ten minutes, and stop while they’re still enjoying it.',
          '**Repeat.** Little ones love doing the same thing again; that’s how they learn.',
        ],
      },
      { tip: 'Praise trying, not just right answers. A child who feels safe to get things wrong learns faster.' },
      { h2: 'Where Nexus fits in' },
      { p: 'Nexus has picture games for Nursery 1 and 2 that read every question aloud, so your child doesn’t need to read yet. They tap big pictures, hear a cheer for every right answer, and favourite games come back to practise again. You see their progress in your weekly report.' },
    ],
    cta: 'Let your little one try the nursery games.',
    related: ['common-entrance-exam-guide', 'bece-guide'],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
