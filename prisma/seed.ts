import { PrismaClient, AnswerStatus, PracticeMode, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const teacherEmail = 'teacher@example.com';
const demoPassword = 'password';

const studentSeeds = [
  { name: 'Demo Student', email: 'student@example.com' },
  { name: 'Olena Student', email: 'olena.student@example.com' },
  { name: 'Andrii Student', email: 'andrii.student@example.com' },
  { name: 'Kateryna Student', email: 'kateryna.student@example.com' },
  { name: 'Maksym Student', email: 'maksym.student@example.com' },
  { name: 'Iryna Student', email: 'iryna.student@example.com' },
  { name: 'Bohdan Student', email: 'bohdan.student@example.com' },
  { name: 'Sofia Student', email: 'sofia.student@example.com' },
  { name: 'Dmytro Student', email: 'dmytro.student@example.com' },
];

const a2StudentEmails = [
  'student@example.com',
  'olena.student@example.com',
  'andrii.student@example.com',
  'kateryna.student@example.com',
  'maksym.student@example.com',
];

const b1StudentEmails = [
  'student@example.com',
  'iryna.student@example.com',
  'bohdan.student@example.com',
  'sofia.student@example.com',
  'dmytro.student@example.com',
];

async function main() {
  const passwordHash = await hash(demoPassword, 10);

  const teacher = await prisma.user.upsert({
    where: { email: teacherEmail },
    update: {
      name: 'Demo Teacher',
      passwordHash,
      role: UserRole.TEACHER,
    },
    create: {
      name: 'Demo Teacher',
      email: teacherEmail,
      passwordHash,
      role: UserRole.TEACHER,
    },
  });

  const students = await upsertStudents(passwordHash);

  await resetTeacherDemoData(teacher.id);

  const classA2 = await prisma.class.create({
    data: {
      name: 'English A2 - Travel',
      description: 'Travel and daily action vocabulary for Ukrainian-speaking learners.',
      level: 'A2',
      inviteCode: 'A2-7KQ9',
      teacherId: teacher.id,
    },
  });
  const classB1 = await prisma.class.create({
    data: {
      name: 'English B1 - Classroom Communication',
      description: 'Classroom, feedback, and study-process vocabulary.',
      level: 'B1',
      inviteCode: 'B1-4MVP',
      teacherId: teacher.id,
    },
  });

  await enrollStudents(classA2.id, students, a2StudentEmails);
  await enrollStudents(classB1.id, students, b1StudentEmails);

  const travelSet = await createWordSet({
    teacherId: teacher.id,
    title: 'Travel Basics',
    description: 'Airport, transport, and route vocabulary.',
    tag: 'English A2',
    words: [
      {
        term: 'arrive',
        translation: 'прибувати',
        exampleSentence: 'We arrive at the airport at 9 AM.',
        transcription: 'uh-RYV',
      },
      {
        term: 'depart',
        translation: 'відправлятися',
        exampleSentence: 'The train departs at noon.',
        transcription: 'di-PAHRT',
      },
      {
        term: 'luggage',
        translation: 'багаж',
        exampleSentence: 'Her luggage is near the door.',
        transcription: 'LUH-gij',
      },
      {
        term: 'ticket',
        translation: 'квиток',
        exampleSentence: 'I bought a ticket online.',
        transcription: 'TIH-kit',
      },
      {
        term: 'platform',
        translation: 'платформа',
        exampleSentence: 'The train leaves from platform five.',
        transcription: 'PLAT-form',
      },
      {
        term: 'passport',
        translation: 'паспорт',
        exampleSentence: 'Show your passport at the desk.',
        transcription: 'PAS-port',
      },
      {
        term: 'delay',
        translation: 'затримка',
        exampleSentence: 'The flight has a short delay.',
        transcription: 'di-LAY',
      },
      {
        term: 'route',
        translation: 'маршрут',
        exampleSentence: 'This route goes through Lviv.',
        transcription: 'root',
      },
    ],
  });

  const dailyActionsSet = await createWordSet({
    teacherId: teacher.id,
    title: 'Daily Actions',
    description: 'Common verbs for lessons and homework.',
    tag: 'English A2',
    words: [
      {
        term: 'explain',
        translation: 'пояснювати',
        exampleSentence: 'Can you explain your answer?',
        transcription: 'ik-SPLAYN',
      },
      {
        term: 'compare',
        translation: 'порівнювати',
        exampleSentence: 'Compare the two short texts.',
        transcription: 'kuhm-PAIR',
      },
      {
        term: 'improve',
        translation: 'покращувати',
        exampleSentence: 'Practice helps improve pronunciation.',
        transcription: 'im-PROOV',
      },
      {
        term: 'repeat',
        translation: 'повторювати',
        exampleSentence: 'Please repeat the sentence.',
        transcription: 'ri-PEET',
      },
      {
        term: 'choose',
        translation: 'обирати',
        exampleSentence: 'Choose the correct answer.',
        transcription: 'chooz',
      },
      {
        term: 'remember',
        translation: "пам'ятати",
        exampleSentence: 'Try to remember five new words.',
        transcription: 'ri-MEM-ber',
      },
      {
        term: 'write down',
        translation: 'записувати',
        exampleSentence: 'Write down the new vocabulary.',
        transcription: 'ryt down',
      },
      {
        term: 'ask',
        translation: 'запитувати',
        exampleSentence: 'Ask your partner a question.',
        transcription: 'ask',
      },
    ],
  });

  const classroomSet = await createWordSet({
    teacherId: teacher.id,
    title: 'Classroom Language',
    description: 'Vocabulary for assignments, feedback, and class discussion.',
    tag: 'English B1',
    words: [
      {
        term: 'assignment',
        translation: 'завдання',
        exampleSentence: 'The assignment is due on Friday.',
        transcription: 'uh-SYN-muhnt',
      },
      {
        term: 'deadline',
        translation: 'термін виконання',
        exampleSentence: 'The deadline is tomorrow morning.',
        transcription: 'DED-lyn',
      },
      {
        term: 'feedback',
        translation: 'відгук',
        exampleSentence: 'The teacher gave helpful feedback.',
        transcription: 'FEED-bak',
      },
      {
        term: 'mistake',
        translation: 'помилка',
        exampleSentence: 'It is normal to make a mistake.',
        transcription: 'mi-STAYK',
      },
      {
        term: 'progress',
        translation: 'прогрес',
        exampleSentence: 'Your progress is clear this week.',
        transcription: 'PROG-res',
      },
      {
        term: 'discussion',
        translation: 'обговорення',
        exampleSentence: 'We had a short discussion in class.',
        transcription: 'di-SKUH-shun',
      },
      {
        term: 'instruction',
        translation: 'інструкція',
        exampleSentence: 'Read the instruction before you start.',
        transcription: 'in-STRUK-shun',
      },
      {
        term: 'example',
        translation: 'приклад',
        exampleSentence: 'Can you give one more example?',
        transcription: 'ig-ZAM-puhl',
      },
    ],
  });

  const travelAssignment = await createAssignment(classA2.id, travelSet.id);
  const dailyActionsAssignment = await createAssignment(classA2.id, dailyActionsSet.id);
  const classroomAssignment = await createAssignment(classB1.id, classroomSet.id);

  await createPracticeAttempts({
    students,
    assignments: {
      travel: travelAssignment.id,
      dailyActions: dailyActionsAssignment.id,
      classroom: classroomAssignment.id,
    },
    words: {
      travel: travelSet.words,
      dailyActions: dailyActionsSet.words,
      classroom: classroomSet.words,
    },
  });

  console.log('Seed data ready');
  console.log(`Teacher: ${teacherEmail} / ${demoPassword}`);
  console.log(`Student: student@example.com / ${demoPassword}`);
  console.log('Invite codes: A2-7KQ9, B1-4MVP');
}

async function upsertStudents(passwordHash: string) {
  const students = new Map<string, { id: string; name: string; email: string }>();

  for (const student of studentSeeds) {
    const savedStudent = await prisma.user.upsert({
      where: { email: student.email },
      update: {
        name: student.name,
        passwordHash,
        role: UserRole.STUDENT,
      },
      create: {
        ...student,
        passwordHash,
        role: UserRole.STUDENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    students.set(savedStudent.email, savedStudent);
  }

  return students;
}

async function resetTeacherDemoData(teacherId: string) {
  await prisma.practiceAttempt.deleteMany({
    where: {
      assignment: {
        OR: [{ class: { teacherId } }, { wordSet: { teacherId } }],
      },
    },
  });
  await prisma.classEnrollment.deleteMany({
    where: {
      class: {
        teacherId,
      },
    },
  });
  await prisma.assignment.deleteMany({
    where: {
      OR: [{ class: { teacherId } }, { wordSet: { teacherId } }],
    },
  });
  await prisma.wordSet.deleteMany({
    where: {
      teacherId,
    },
  });
  await prisma.class.deleteMany({
    where: {
      teacherId,
    },
  });
}

async function enrollStudents(
  classId: string,
  students: Map<string, { id: string }>,
  emails: string[],
) {
  await prisma.classEnrollment.createMany({
    data: emails.map((email) => ({
      classId,
      studentId: getStudent(students, email).id,
    })),
    skipDuplicates: true,
  });
}

async function createWordSet(input: {
  teacherId: string;
  title: string;
  description: string;
  tag: string;
  words: Array<{
    term: string;
    translation: string;
    exampleSentence: string;
    transcription: string;
  }>;
}) {
  const wordSet = await prisma.wordSet.create({
    data: {
      teacherId: input.teacherId,
      title: input.title,
      description: input.description,
      tag: input.tag,
      words: {
        create: input.words,
      },
    },
    include: {
      words: true,
    },
  });

  return {
    ...wordSet,
    words: new Map(wordSet.words.map((word) => [word.term, word])),
  };
}

async function createAssignment(classId: string, wordSetId: string) {
  return prisma.assignment.create({
    data: {
      classId,
      wordSetId,
    },
  });
}

async function createPracticeAttempts(input: {
  students: Map<string, { id: string }>;
  assignments: {
    travel: string;
    dailyActions: string;
    classroom: string;
  };
  words: {
    travel: WordMap;
    dailyActions: WordMap;
    classroom: WordMap;
  };
}) {
  const attempts = [
    ...travelPractice(input.students, input.assignments.travel, input.words.travel),
    ...dailyActionsPractice(
      input.students,
      input.assignments.dailyActions,
      input.words.dailyActions,
    ),
    ...classroomPractice(
      input.students,
      input.assignments.classroom,
      input.words.classroom,
    ),
  ];

  await prisma.practiceAttempt.createMany({
    data: attempts,
  });
}

type WordMap = Map<string, { id: string }>;

function travelPractice(
  students: Map<string, { id: string }>,
  assignmentId: string,
  words: WordMap,
) {
  return [
    ...attemptRow({
      students,
      assignmentId,
      email: 'student@example.com',
      timestamp: '2026-06-04T13:00:00.000Z',
      answers: [
        ['arrive', AnswerStatus.WRONG],
        ['depart', AnswerStatus.CORRECT],
        ['luggage', AnswerStatus.CORRECT],
        ['ticket', AnswerStatus.CORRECT],
        ['platform', AnswerStatus.WRONG],
        ['passport', AnswerStatus.CORRECT],
        ['delay', AnswerStatus.WRONG],
        ['route', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'olena.student@example.com',
      timestamp: '2026-06-04T13:08:00.000Z',
      answers: [
        ['arrive', AnswerStatus.CORRECT],
        ['depart', AnswerStatus.CORRECT],
        ['luggage', AnswerStatus.CORRECT],
        ['ticket', AnswerStatus.CORRECT],
        ['platform', AnswerStatus.CORRECT],
        ['passport', AnswerStatus.CORRECT],
        ['delay', AnswerStatus.WRONG],
        ['route', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'andrii.student@example.com',
      timestamp: '2026-06-04T13:16:00.000Z',
      answers: [
        ['arrive', AnswerStatus.WRONG],
        ['depart', AnswerStatus.CORRECT],
        ['luggage', AnswerStatus.WRONG],
        ['ticket', AnswerStatus.CORRECT],
        ['platform', AnswerStatus.WRONG],
        ['passport', AnswerStatus.CORRECT],
        ['delay', AnswerStatus.WRONG],
        ['route', AnswerStatus.WRONG],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'kateryna.student@example.com',
      timestamp: '2026-06-03T15:25:00.000Z',
      answers: [
        ['arrive', AnswerStatus.WRONG],
        ['depart', AnswerStatus.CORRECT],
        ['luggage', AnswerStatus.CORRECT],
        ['ticket', AnswerStatus.CORRECT],
        ['platform', AnswerStatus.CORRECT],
        ['passport', AnswerStatus.CORRECT],
        ['delay', AnswerStatus.CORRECT],
        ['route', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'maksym.student@example.com',
      timestamp: '2026-06-02T09:20:00.000Z',
      answers: [
        ['arrive', AnswerStatus.CORRECT],
        ['depart', AnswerStatus.CORRECT],
        ['luggage', AnswerStatus.CORRECT],
        ['ticket', AnswerStatus.CORRECT],
        ['platform', AnswerStatus.CORRECT],
        ['passport', AnswerStatus.CORRECT],
        ['delay', AnswerStatus.CORRECT],
        ['route', AnswerStatus.CORRECT],
      ],
      words,
    }),
  ];
}

function dailyActionsPractice(
  students: Map<string, { id: string }>,
  assignmentId: string,
  words: WordMap,
) {
  return [
    ...attemptRow({
      students,
      assignmentId,
      email: 'student@example.com',
      timestamp: '2026-06-03T10:00:00.000Z',
      answers: [
        ['explain', AnswerStatus.CORRECT],
        ['compare', AnswerStatus.CORRECT],
        ['improve', AnswerStatus.CORRECT],
        ['repeat', AnswerStatus.CORRECT],
        ['choose', AnswerStatus.CORRECT],
        ['remember', AnswerStatus.WRONG],
        ['write down', AnswerStatus.CORRECT],
        ['ask', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'olena.student@example.com',
      timestamp: '2026-06-03T10:12:00.000Z',
      answers: [
        ['explain', AnswerStatus.CORRECT],
        ['compare', AnswerStatus.CORRECT],
        ['improve', AnswerStatus.CORRECT],
        ['repeat', AnswerStatus.CORRECT],
        ['choose', AnswerStatus.CORRECT],
        ['remember', AnswerStatus.CORRECT],
        ['write down', AnswerStatus.CORRECT],
        ['ask', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'andrii.student@example.com',
      timestamp: '2026-06-02T12:30:00.000Z',
      answers: [
        ['explain', AnswerStatus.WRONG],
        ['compare', AnswerStatus.CORRECT],
        ['improve', AnswerStatus.WRONG],
        ['repeat', AnswerStatus.CORRECT],
        ['choose', AnswerStatus.CORRECT],
        ['remember', AnswerStatus.WRONG],
        ['write down', AnswerStatus.CORRECT],
        ['ask', AnswerStatus.CORRECT],
      ],
      words,
    }),
  ];
}

function classroomPractice(
  students: Map<string, { id: string }>,
  assignmentId: string,
  words: WordMap,
) {
  return [
    ...attemptRow({
      students,
      assignmentId,
      email: 'student@example.com',
      timestamp: '2026-06-04T14:00:00.000Z',
      answers: [
        ['assignment', AnswerStatus.CORRECT],
        ['deadline', AnswerStatus.WRONG],
        ['feedback', AnswerStatus.WRONG],
        ['mistake', AnswerStatus.CORRECT],
        ['progress', AnswerStatus.CORRECT],
        ['discussion', AnswerStatus.CORRECT],
        ['instruction', AnswerStatus.WRONG],
        ['example', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'iryna.student@example.com',
      timestamp: '2026-06-04T14:12:00.000Z',
      answers: [
        ['assignment', AnswerStatus.CORRECT],
        ['deadline', AnswerStatus.WRONG],
        ['feedback', AnswerStatus.CORRECT],
        ['mistake', AnswerStatus.CORRECT],
        ['progress', AnswerStatus.CORRECT],
        ['discussion', AnswerStatus.CORRECT],
        ['instruction', AnswerStatus.WRONG],
        ['example', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'bohdan.student@example.com',
      timestamp: '2026-06-03T16:20:00.000Z',
      answers: [
        ['assignment', AnswerStatus.CORRECT],
        ['deadline', AnswerStatus.WRONG],
        ['feedback', AnswerStatus.WRONG],
        ['mistake', AnswerStatus.CORRECT],
        ['progress', AnswerStatus.CORRECT],
        ['discussion', AnswerStatus.WRONG],
        ['instruction', AnswerStatus.WRONG],
        ['example', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'sofia.student@example.com',
      timestamp: '2026-06-02T11:45:00.000Z',
      answers: [
        ['assignment', AnswerStatus.CORRECT],
        ['deadline', AnswerStatus.CORRECT],
        ['feedback', AnswerStatus.WRONG],
        ['mistake', AnswerStatus.CORRECT],
        ['progress', AnswerStatus.CORRECT],
        ['discussion', AnswerStatus.CORRECT],
        ['instruction', AnswerStatus.CORRECT],
        ['example', AnswerStatus.CORRECT],
      ],
      words,
    }),
    ...attemptRow({
      students,
      assignmentId,
      email: 'dmytro.student@example.com',
      timestamp: '2026-05-20T08:40:00.000Z',
      answers: [
        ['assignment', AnswerStatus.CORRECT],
        ['deadline', AnswerStatus.CORRECT],
        ['feedback', AnswerStatus.CORRECT],
        ['mistake', AnswerStatus.CORRECT],
        ['progress', AnswerStatus.CORRECT],
        ['discussion', AnswerStatus.CORRECT],
        ['instruction', AnswerStatus.CORRECT],
        ['example', AnswerStatus.CORRECT],
      ],
      words,
    }),
  ];
}

function attemptRow(input: {
  students: Map<string, { id: string }>;
  assignmentId: string;
  email: string;
  timestamp: string;
  answers: Array<[term: string, status: AnswerStatus]>;
  words: WordMap;
}) {
  return input.answers.map(([term, status], index) => ({
    assignmentId: input.assignmentId,
    studentId: getStudent(input.students, input.email).id,
    wordId: getWord(input.words, term).id,
    status,
    mode: modeForIndex(index),
    answeredAt: addMinutes(input.timestamp, index),
  }));
}

function getStudent(students: Map<string, { id: string }>, email: string) {
  const student = students.get(email);

  if (!student) {
    throw new Error(`Missing seed student: ${email}`);
  }

  return student;
}

function getWord(words: WordMap, term: string) {
  const word = words.get(term);

  if (!word) {
    throw new Error(`Missing seed word: ${term}`);
  }

  return word;
}

function addMinutes(timestamp: string, minutes: number) {
  const date = new Date(timestamp);
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

function modeForIndex(index: number) {
  const modes = [
    PracticeMode.WRITING,
    PracticeMode.MULTIPLE_CHOICE,
    PracticeMode.FLASHCARD,
  ];

  return modes[index % modes.length];
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
