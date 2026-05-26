import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AnalyticsService(prisma as unknown as PrismaService);
  });

  it('returns teacher analytics derived from classes and attempts', async () => {
    prisma.class.findMany.mockResolvedValue([createClassRecord()]);
    prisma.practiceAttempt.findMany.mockResolvedValue([
      createAttempt({
        id: 'attempt-1',
        wordId: 'word-1',
        studentId: 'student-1',
        status: 'WRONG',
      }),
      createAttempt({
        id: 'attempt-2',
        wordId: 'word-1',
        studentId: 'student-2',
        status: 'WRONG',
      }),
      createAttempt({
        id: 'attempt-3',
        wordId: 'word-1',
        studentId: 'student-1',
        status: 'CORRECT',
      }),
      createAttempt({
        id: 'attempt-4',
        wordId: 'word-2',
        studentId: 'student-1',
        status: 'CORRECT',
        word: {
          id: 'word-2',
          term: 'arrive',
          translation: 'come',
        },
      }),
    ]);

    const result = await service.getTeacherAnalytics('teacher-1', {});

    expect(prisma.class.findMany).toHaveBeenCalledWith({
      where: { teacherId: 'teacher-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(prisma.practiceAttempt.findMany).toHaveBeenCalledWith({
      where: {
        assignment: {
          class: {
            teacherId: 'teacher-1',
          },
        },
      },
      include: {
        word: {
          select: {
            id: true,
            term: true,
            translation: true,
          },
        },
      },
    });
    expect(result).toEqual({
      totalStudents: 2,
      totalWordSets: 1,
      averageProgress: 75,
      classProgress: [
        {
          id: 'class-1',
          name: 'English A2',
          students: 2,
          wordSets: 1,
          progress: 75,
          inviteCode: 'ABC-123',
          level: 'A2',
          description: 'Core vocabulary',
          studentsList: [
            {
              id: 'student-1',
              name: 'Student One',
              email: 'one@example.com',
              progress: 100,
              correctAnswers: 2,
              wrongAnswers: 0,
              lastPracticedAt: '2026-05-26T10:00:00.000Z',
            },
            {
              id: 'student-2',
              name: 'Student Two',
              email: 'two@example.com',
              progress: 50,
              correctAnswers: 0,
              wrongAnswers: 1,
              lastPracticedAt: '2026-05-26T10:00:00.000Z',
            },
          ],
          wordSetsList: [
            {
              id: 'assignment-1',
              classId: 'class-1',
              title: 'Travel',
              description: 'Airport vocabulary',
              words: 2,
              assignedStudents: 2,
              averageProgress: 75,
            },
          ],
          problemWords: [
            {
              id: 'word-1',
              term: 'depart',
              translation: 'leave',
              wrongAnswers: 2,
              correctAnswers: 1,
              affectedStudents: 2,
            },
          ],
        },
      ],
      problemWords: [
        {
          id: 'word-1',
          term: 'depart',
          translation: 'leave',
          wrongAnswers: 2,
          correctAnswers: 1,
          affectedStudents: 2,
        },
      ],
    });
  });

  it('filters analytics to an owned class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.class.findMany.mockResolvedValue([createClassRecord()]);
    prisma.practiceAttempt.findMany.mockResolvedValue([]);

    await service.getTeacherAnalytics('teacher-1', { classId: 'class-1' });

    expect(prisma.class.findUnique).toHaveBeenCalledWith({
      where: { id: 'class-1' },
      select: {
        id: true,
        teacherId: true,
      },
    });
    expect(prisma.class.findMany).toHaveBeenCalledWith({
      where: {
        teacherId: 'teacher-1',
        id: 'class-1',
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
  });

  it('rejects analytics for another teacher class filter', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-2',
    });

    await expect(
      service.getTeacherAnalytics('teacher-1', { classId: 'class-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

interface MockPrisma {
  class: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
  practiceAttempt: {
    findMany: jest.Mock;
  };
}

function createMockPrisma(): MockPrisma {
  return {
    class: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    practiceAttempt: {
      findMany: jest.fn(),
    },
  };
}

function createClassRecord() {
  return {
    id: 'class-1',
    name: 'English A2',
    description: 'Core vocabulary',
    level: 'A2',
    inviteCode: 'ABC-123',
    teacherId: 'teacher-1',
    enrollments: [
      {
        student: {
          id: 'student-1',
          name: 'Student One',
          email: 'one@example.com',
        },
      },
      {
        student: {
          id: 'student-2',
          name: 'Student Two',
          email: 'two@example.com',
        },
      },
    ],
    assignments: [
      {
        id: 'assignment-1',
        wordSet: {
          id: 'word-set-1',
          title: 'Travel',
          description: 'Airport vocabulary',
          words: [{ id: 'word-1' }, { id: 'word-2' }],
        },
        class: {
          enrollments: [{ studentId: 'student-1' }, { studentId: 'student-2' }],
        },
        practiceAttempts: [
          {
            studentId: 'student-1',
            wordId: 'word-1',
            status: 'CORRECT',
            answeredAt: new Date('2026-05-26T10:00:00.000Z'),
          },
          {
            studentId: 'student-1',
            wordId: 'word-2',
            status: 'CORRECT',
            answeredAt: new Date('2026-05-26T10:00:00.000Z'),
          },
          {
            studentId: 'student-2',
            wordId: 'word-1',
            status: 'WRONG',
            answeredAt: new Date('2026-05-26T10:00:00.000Z'),
          },
        ],
      },
    ],
    _count: {
      enrollments: 2,
      assignments: 1,
    },
  };
}

function createAttempt(input: {
  id: string;
  wordId: string;
  studentId: string;
  status: 'CORRECT' | 'WRONG';
  word?: {
    id: string;
    term: string;
    translation: string;
  };
}) {
  return {
    id: input.id,
    wordId: input.wordId,
    studentId: input.studentId,
    status: input.status,
    word: input.word ?? {
      id: 'word-1',
      term: 'depart',
      translation: 'leave',
    },
  };
}
