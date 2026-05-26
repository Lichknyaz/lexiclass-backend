import { PrismaClient, AnswerStatus, PracticeMode, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('password', 10);

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {
      name: 'Demo Teacher',
      passwordHash,
      role: UserRole.TEACHER,
    },
    create: {
      name: 'Demo Teacher',
      email: 'teacher@example.com',
      passwordHash,
      role: UserRole.TEACHER,
    },
  });
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {
      name: 'Demo Student',
      passwordHash,
      role: UserRole.STUDENT,
    },
    create: {
      name: 'Demo Student',
      email: 'student@example.com',
      passwordHash,
      role: UserRole.STUDENT,
    },
  });
  const secondStudent = await prisma.user.upsert({
    where: { email: 'olena.student@example.com' },
    update: {
      name: 'Olena Student',
      passwordHash,
      role: UserRole.STUDENT,
    },
    create: {
      name: 'Olena Student',
      email: 'olena.student@example.com',
      passwordHash,
      role: UserRole.STUDENT,
    },
  });

  const classA2 = await prisma.class.upsert({
    where: { inviteCode: 'A2-7KQ9' },
    update: {
      name: 'English A2',
      description: 'Core vocabulary for travel and everyday communication.',
      level: 'A2',
      teacherId: teacher.id,
    },
    create: {
      name: 'English A2',
      description: 'Core vocabulary for travel and everyday communication.',
      level: 'A2',
      inviteCode: 'A2-7KQ9',
      teacherId: teacher.id,
    },
  });
  const classB1 = await prisma.class.upsert({
    where: { inviteCode: 'B1-4MVP' },
    update: {
      name: 'English B1',
      description: 'Intermediate vocabulary for school discussions.',
      level: 'B1',
      teacherId: teacher.id,
    },
    create: {
      name: 'English B1',
      description: 'Intermediate vocabulary for school discussions.',
      level: 'B1',
      inviteCode: 'B1-4MVP',
      teacherId: teacher.id,
    },
  });

  await upsertEnrollment(classA2.id, student.id);
  await upsertEnrollment(classA2.id, secondStudent.id);
  await upsertEnrollment(classB1.id, student.id);

  const travelSet = await upsertWordSet({
    teacherId: teacher.id,
    title: 'Travel basics',
    description: 'Airport, hotel, and route vocabulary.',
    tag: 'A2',
  });
  const schoolSet = await upsertWordSet({
    teacherId: teacher.id,
    title: 'School discussions',
    description: 'Vocabulary for classroom opinions and projects.',
    tag: 'B1',
  });

  const travelWords = await upsertWords(travelSet.id, [
    {
      term: 'depart',
      translation: 'to leave',
      exampleSentence: 'The train departs at noon.',
      transcription: 'di-PAHRT',
    },
    {
      term: 'arrive',
      translation: 'to come to a place',
      exampleSentence: 'We arrive in Prague tomorrow.',
      transcription: 'uh-RYV',
    },
    {
      term: 'luggage',
      translation: 'bags for travel',
      exampleSentence: 'Her luggage is near the door.',
      transcription: 'LUH-gij',
    },
  ]);
  const schoolWords = await upsertWords(schoolSet.id, [
    {
      term: 'explain',
      translation: 'to make something clear',
      exampleSentence: 'Can you explain your answer?',
      transcription: 'ik-SPLAYN',
    },
    {
      term: 'compare',
      translation: 'to find similarities and differences',
      exampleSentence: 'Compare the two short texts.',
      transcription: 'kuhm-PAIR',
    },
    {
      term: 'improve',
      translation: 'to make better',
      exampleSentence: 'Practice helps improve pronunciation.',
      transcription: 'im-PROOV',
    },
  ]);

  const travelAssignment = await upsertAssignment(classA2.id, travelSet.id);
  const schoolAssignment = await upsertAssignment(classB1.id, schoolSet.id);

  await prisma.practiceAttempt.deleteMany({
    where: {
      assignmentId: {
        in: [travelAssignment.id, schoolAssignment.id],
      },
    },
  });
  await prisma.practiceAttempt.createMany({
    data: [
      {
        assignmentId: travelAssignment.id,
        studentId: student.id,
        wordId: travelWords[0].id,
        status: AnswerStatus.CORRECT,
        mode: PracticeMode.WRITING,
        answeredAt: new Date('2026-05-26T09:00:00.000Z'),
      },
      {
        assignmentId: travelAssignment.id,
        studentId: student.id,
        wordId: travelWords[1].id,
        status: AnswerStatus.WRONG,
        mode: PracticeMode.WRITING,
        answeredAt: new Date('2026-05-26T09:02:00.000Z'),
      },
      {
        assignmentId: travelAssignment.id,
        studentId: secondStudent.id,
        wordId: travelWords[1].id,
        status: AnswerStatus.WRONG,
        mode: PracticeMode.MULTIPLE_CHOICE,
        answeredAt: new Date('2026-05-26T09:05:00.000Z'),
      },
      {
        assignmentId: travelAssignment.id,
        studentId: secondStudent.id,
        wordId: travelWords[2].id,
        status: AnswerStatus.CORRECT,
        mode: PracticeMode.MULTIPLE_CHOICE,
        answeredAt: new Date('2026-05-26T09:06:00.000Z'),
      },
      {
        assignmentId: schoolAssignment.id,
        studentId: student.id,
        wordId: schoolWords[0].id,
        status: AnswerStatus.CORRECT,
        mode: PracticeMode.FLASHCARD,
        answeredAt: new Date('2026-05-26T10:00:00.000Z'),
      },
    ],
  });

  console.log('Seed data ready');
}

async function upsertEnrollment(classId: string, studentId: string) {
  return prisma.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId,
        studentId,
      },
    },
    update: {},
    create: {
      classId,
      studentId,
    },
  });
}

async function upsertWordSet(input: {
  teacherId: string;
  title: string;
  description: string;
  tag: string;
}) {
  const existing = await prisma.wordSet.findFirst({
    where: {
      teacherId: input.teacherId,
      title: input.title,
    },
  });

  if (existing) {
    return prisma.wordSet.update({
      where: { id: existing.id },
      data: {
        description: input.description,
        tag: input.tag,
      },
    });
  }

  return prisma.wordSet.create({
    data: input,
  });
}

async function upsertWords(
  wordSetId: string,
  words: Array<{
    term: string;
    translation: string;
    exampleSentence: string;
    transcription: string;
  }>,
) {
  const result = [];

  for (const word of words) {
    result.push(
      await prisma.word.upsert({
        where: {
          wordSetId_term: {
            wordSetId,
            term: word.term,
          },
        },
        update: {
          translation: word.translation,
          exampleSentence: word.exampleSentence,
          transcription: word.transcription,
        },
        create: {
          wordSetId,
          ...word,
        },
      }),
    );
  }

  return result;
}

async function upsertAssignment(classId: string, wordSetId: string) {
  return prisma.assignment.upsert({
    where: {
      classId_wordSetId: {
        classId,
        wordSetId,
      },
    },
    update: {},
    create: {
      classId,
      wordSetId,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
