import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PracticeService } from './practice.service';

describe('PracticeService', () => {
  let service: PracticeService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PracticeService(prisma as unknown as PrismaService);
  });

  it('persists per-word attempts for an accessible assignment', async () => {
    prisma.assignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      wordSet: {
        words: [{ id: 'word-1' }, { id: 'word-2' }],
      },
    });
    prisma.practiceAttempt.createMany.mockResolvedValue({ count: 2 });

    const result = await service.savePracticeSession('student-1', {
      assignmentId: 'assignment-1',
      mode: 'writing',
      attempts: [
        {
          wordId: 'word-1',
          status: 'correct',
          answeredAt: '2026-05-26T10:00:00.000Z',
        },
        {
          wordId: 'word-2',
          status: 'wrong',
          answeredAt: '2026-05-26T10:01:00.000Z',
        },
      ],
    });

    expect(prisma.assignment.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'assignment-1',
        class: {
          enrollments: {
            some: {
              studentId: 'student-1',
            },
          },
        },
      },
      include: {
        wordSet: {
          include: {
            words: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
    expect(prisma.practiceAttempt.createMany).toHaveBeenCalledWith({
      data: [
        {
          assignmentId: 'assignment-1',
          studentId: 'student-1',
          wordId: 'word-1',
          status: 'CORRECT',
          mode: 'WRITING',
          answeredAt: new Date('2026-05-26T10:00:00.000Z'),
        },
        {
          assignmentId: 'assignment-1',
          studentId: 'student-1',
          wordId: 'word-2',
          status: 'WRONG',
          mode: 'WRITING',
          answeredAt: new Date('2026-05-26T10:01:00.000Z'),
        },
      ],
    });
    expect(result).toEqual({
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      mode: 'writing',
      correctAnswers: 1,
      wrongAnswers: 1,
      wordResults: [
        {
          wordId: 'word-1',
          correctAnswers: 1,
          wrongAnswers: 0,
        },
        {
          wordId: 'word-2',
          correctAnswers: 0,
          wrongAnswers: 1,
        },
      ],
    });
  });

  it('rejects practice sessions for inaccessible assignments', async () => {
    prisma.assignment.findFirst.mockResolvedValue(null);

    await expect(
      service.savePracticeSession('student-1', {
        assignmentId: 'assignment-1',
        mode: 'writing',
        attempts: [
          {
            wordId: 'word-1',
            status: 'correct',
            answeredAt: '2026-05-26T10:00:00.000Z',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects attempts for words outside the assignment word set', async () => {
    prisma.assignment.findFirst.mockResolvedValue({
      id: 'assignment-1',
      wordSet: {
        words: [{ id: 'word-1' }],
      },
    });

    await expect(
      service.savePracticeSession('student-1', {
        assignmentId: 'assignment-1',
        mode: 'writing',
        attempts: [
          {
            wordId: 'word-2',
            status: 'correct',
            answeredAt: '2026-05-26T10:00:00.000Z',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns student word progress aggregated from attempts', async () => {
    prisma.practiceAttempt.findMany.mockResolvedValue([
      createPracticeAttemptRecord({
        id: 'attempt-1',
        wordId: 'word-1',
        status: 'CORRECT',
        answeredAt: new Date('2026-05-26T10:00:00.000Z'),
      }),
      createPracticeAttemptRecord({
        id: 'attempt-2',
        wordId: 'word-1',
        status: 'WRONG',
        answeredAt: new Date('2026-05-26T10:05:00.000Z'),
      }),
      createPracticeAttemptRecord({
        id: 'attempt-3',
        wordId: 'word-2',
        status: 'CORRECT',
        answeredAt: new Date('2026-05-26T10:10:00.000Z'),
        word: {
          id: 'word-2',
          term: 'arrive',
          translation: 'come',
        },
      }),
    ]);

    const result = await service.listStudentWordProgress('student-1');

    expect(prisma.practiceAttempt.findMany).toHaveBeenCalledWith({
      where: { studentId: 'student-1' },
      include: {
        word: {
          select: {
            id: true,
            term: true,
            translation: true,
          },
        },
      },
      orderBy: { answeredAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'word-2',
        assignmentId: 'assignment-1',
        term: 'arrive',
        translation: 'come',
        masteryLevel: 100,
        correctCount: 1,
        wrongCount: 0,
        lastPracticedAt: '2026-05-26T10:10:00.000Z',
      },
      {
        id: 'word-1',
        assignmentId: 'assignment-1',
        term: 'depart',
        translation: 'leave',
        masteryLevel: 50,
        correctCount: 1,
        wrongCount: 1,
        lastPracticedAt: '2026-05-26T10:05:00.000Z',
      },
    ]);
  });
});

interface MockPrisma {
  assignment: {
    findFirst: jest.Mock;
  };
  practiceAttempt: {
    createMany: jest.Mock;
    findMany: jest.Mock;
  };
}

function createMockPrisma(): MockPrisma {
  return {
    assignment: {
      findFirst: jest.fn(),
    },
    practiceAttempt: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

function createPracticeAttemptRecord(input: {
  id: string;
  assignmentId?: string;
  wordId: string;
  status: 'CORRECT' | 'WRONG';
  answeredAt: Date;
  word?: {
    id: string;
    term: string;
    translation: string;
  };
}) {
  return {
    id: input.id,
    assignmentId: input.assignmentId ?? 'assignment-1',
    wordId: input.wordId,
    status: input.status,
    answeredAt: input.answeredAt,
    word: input.word ?? {
      id: 'word-1',
      term: 'depart',
      translation: 'leave',
    },
  };
}
