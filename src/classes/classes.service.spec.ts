import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClassesService', () => {
  let service: ClassesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ClassesService(prisma as unknown as PrismaService);
  });

  it('creates a class owned by the teacher', async () => {
    prisma.class.create.mockResolvedValue({
      id: 'class-1',
      name: 'English A2',
      description: '',
      level: '',
      inviteCode: 'ABC-123',
      teacherId: 'teacher-1',
      _count: {
        enrollments: 0,
        assignments: 0,
      },
    });

    const result = await service.createClass('teacher-1', {
      name: 'English A2',
    });

    expect(prisma.class.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'English A2',
        teacherId: 'teacher-1',
      }),
      include: expect.any(Object),
    });
    expect(result).toEqual({
      id: 'class-1',
      name: 'English A2',
      students: 0,
      wordSets: 0,
      progress: 0,
    });
  });

  it('returns only classes owned by the teacher', async () => {
    prisma.class.findMany.mockResolvedValue([
      {
        id: 'class-1',
        name: 'English A2',
        _count: {
          enrollments: 2,
          assignments: 1,
        },
      },
    ]);

    const result = await service.listClasses('teacher-1');

    expect(prisma.class.findMany).toHaveBeenCalledWith({
      where: { teacherId: 'teacher-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'class-1',
        name: 'English A2',
        students: 2,
        wordSets: 1,
        progress: 0,
      },
    ]);
  });

  it('rejects details for another teacher class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-2',
    });

    await expect(
      service.getClassDetails('teacher-1', 'class-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found for missing classes', async () => {
    prisma.class.findUnique.mockResolvedValue(null);

    await expect(
      service.getClassDetails('teacher-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates a class owned by the teacher', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.class.update.mockResolvedValue(createClassDetailsRecord());

    const result = await service.updateClass('teacher-1', 'class-1', {
      name: 'Updated A2',
      description: 'Updated description',
      level: 'A2',
    });

    expect(prisma.class.update).toHaveBeenCalledWith({
      where: { id: 'class-1' },
      data: {
        name: 'Updated A2',
        description: 'Updated description',
        level: 'A2',
      },
      include: expect.any(Object),
    });
    expect(result.id).toBe('class-1');
  });

  it('deletes a class owned by the teacher', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.class.delete.mockResolvedValue({ id: 'class-1' });

    await expect(
      service.deleteClass('teacher-1', 'class-1'),
    ).resolves.toEqual({ id: 'class-1' });
  });
});

interface MockPrisma {
  class: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
}

function createMockPrisma(): MockPrisma {
  return {
    class: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function createClassDetailsRecord() {
  return {
    id: 'class-1',
    name: 'English A2',
    description: 'Core vocabulary',
    level: 'A2',
    inviteCode: 'ABC-123',
    teacherId: 'teacher-1',
    enrollments: [],
    assignments: [],
    _count: {
      enrollments: 0,
      assignments: 0,
    },
  };
}
