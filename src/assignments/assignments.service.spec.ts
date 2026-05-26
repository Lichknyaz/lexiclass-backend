import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AssignmentsService(prisma as unknown as PrismaService);
  });

  it('creates an assignment for an owned class and word set', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.wordSet.findUnique.mockResolvedValue({
      id: 'word-set-1',
      teacherId: 'teacher-1',
    });
    prisma.assignment.upsert.mockResolvedValue(createAssignmentRecord());

    const result = await service.createAssignment('teacher-1', {
      classId: 'class-1',
      wordSetId: 'word-set-1',
    });

    expect(prisma.assignment.upsert).toHaveBeenCalledWith({
      where: {
        classId_wordSetId: {
          classId: 'class-1',
          wordSetId: 'word-set-1',
        },
      },
      create: {
        classId: 'class-1',
        wordSetId: 'word-set-1',
      },
      update: {},
    });
    expect(result).toEqual({
      id: 'assignment-1',
      classId: 'class-1',
      wordSetId: 'word-set-1',
      assignedAt: '2026-05-26T10:00:00.000Z',
    });
  });

  it('returns existing assignment for duplicate creation', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.wordSet.findUnique.mockResolvedValue({
      id: 'word-set-1',
      teacherId: 'teacher-1',
    });
    prisma.assignment.upsert.mockResolvedValue(createAssignmentRecord());

    const result = await service.createAssignment('teacher-1', {
      classId: 'class-1',
      wordSetId: 'word-set-1',
    });

    expect(result.id).toBe('assignment-1');
  });

  it('rejects assignment creation for another teacher class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-2',
    });
    prisma.wordSet.findUnique.mockResolvedValue({
      id: 'word-set-1',
      teacherId: 'teacher-1',
    });

    await expect(
      service.createAssignment('teacher-1', {
        classId: 'class-1',
        wordSetId: 'word-set-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found when class is missing', async () => {
    prisma.class.findUnique.mockResolvedValue(null);

    await expect(
      service.createAssignment('teacher-1', {
        classId: 'missing',
        wordSetId: 'word-set-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists assignments owned by the teacher with optional filters', async () => {
    prisma.assignment.findMany.mockResolvedValue([createAssignmentRecord()]);

    const result = await service.listTeacherAssignments('teacher-1', {
      classId: 'class-1',
      wordSetId: 'word-set-1',
    });

    expect(prisma.assignment.findMany).toHaveBeenCalledWith({
      where: {
        classId: 'class-1',
        wordSetId: 'word-set-1',
        class: {
          teacherId: 'teacher-1',
        },
        wordSet: {
          teacherId: 'teacher-1',
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'assignment-1',
        classId: 'class-1',
        wordSetId: 'word-set-1',
        assignedAt: '2026-05-26T10:00:00.000Z',
      },
    ]);
  });

  it('lists only assignments for classes joined by the student', async () => {
    prisma.assignment.findMany.mockResolvedValue([
      createStudentAssignmentRecord(),
    ]);

    const result = await service.listStudentAssignments('student-1');

    expect(prisma.assignment.findMany).toHaveBeenCalledWith({
      where: {
        class: {
          enrollments: {
            some: {
              studentId: 'student-1',
            },
          },
        },
      },
      include: expect.any(Object),
      orderBy: { assignedAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'assignment-1',
        classId: 'class-1',
        className: 'English A2',
        title: 'Travel',
        words: 2,
        completedWords: 0,
        progress: 0,
        dueLabel: 'No due date',
      },
    ]);
  });

  it('returns student word-set details by accessible assignment id', async () => {
    prisma.assignment.findFirst.mockResolvedValue(createStudentWordSetRecord());

    const result = await service.getStudentWordSetDetails(
      'student-1',
      'assignment-1',
    );

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
      include: expect.any(Object),
    });
    expect(result).toEqual({
      id: 'word-set-1',
      classId: 'class-1',
      className: 'English A2',
      title: 'Travel',
      description: 'Airport vocabulary',
      words: 1,
      assignedStudents: 2,
      averageProgress: 0,
      createdAt: '2026-05-26T10:00:00.000Z',
      wordsList: [
        {
          id: 'word-1',
          term: 'depart',
          translation: 'leave',
          exampleSentence: 'We depart at noon.',
          transcription: null,
          masteryLevel: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
        },
      ],
    });
  });

  it('rejects student word-set details for inaccessible assignments', async () => {
    prisma.assignment.findFirst.mockResolvedValue(null);

    await expect(
      service.getStudentWordSetDetails('student-1', 'assignment-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

interface MockPrisma {
  class: {
    findUnique: jest.Mock;
  };
  wordSet: {
    findUnique: jest.Mock;
  };
  assignment: {
    upsert: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
}

function createMockPrisma(): MockPrisma {
  return {
    class: {
      findUnique: jest.fn(),
    },
    wordSet: {
      findUnique: jest.fn(),
    },
    assignment: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };
}

function createAssignmentRecord() {
  return {
    id: 'assignment-1',
    classId: 'class-1',
    wordSetId: 'word-set-1',
    assignedAt: new Date('2026-05-26T10:00:00.000Z'),
  };
}

function createStudentAssignmentRecord() {
  return {
    id: 'assignment-1',
    classId: 'class-1',
    wordSetId: 'word-set-1',
    assignedAt: new Date('2026-05-26T10:00:00.000Z'),
    class: {
      id: 'class-1',
      name: 'English A2',
    },
    wordSet: {
      title: 'Travel',
      words: [{ id: 'word-1' }, { id: 'word-2' }],
    },
  };
}

function createStudentWordSetRecord() {
  return {
    id: 'assignment-1',
    classId: 'class-1',
    wordSetId: 'word-set-1',
    assignedAt: new Date('2026-05-26T10:00:00.000Z'),
    class: {
      id: 'class-1',
      name: 'English A2',
      enrollments: [{ studentId: 'student-1' }, { studentId: 'student-2' }],
    },
    wordSet: {
      id: 'word-set-1',
      title: 'Travel',
      description: 'Airport vocabulary',
      createdAt: new Date('2026-05-26T10:00:00.000Z'),
      words: [
        {
          id: 'word-1',
          term: 'depart',
          translation: 'leave',
          exampleSentence: 'We depart at noon.',
          transcription: null,
        },
      ],
    },
  };
}
