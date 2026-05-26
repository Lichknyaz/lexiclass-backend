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
