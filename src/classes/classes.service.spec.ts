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

  it('adds a student to an owned class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'student-1',
      name: 'Student',
      email: 'student@example.com',
    });
    prisma.classEnrollment.upsert.mockResolvedValue({
      student: {
        id: 'student-1',
        name: 'Student',
        email: 'student@example.com',
      },
    });

    const result = await service.addStudent('teacher-1', 'class-1', {
      name: 'Student',
      email: 'student@example.com',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Student',
        email: 'student@example.com',
        role: 'STUDENT',
      }),
    });
    expect(prisma.classEnrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          classId_studentId: {
            classId: 'class-1',
            studentId: 'student-1',
          },
        },
      }),
    );
    expect(result).toEqual({
      id: 'student-1',
      name: 'Student',
      email: 'student@example.com',
      progress: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      lastPracticedAt: null,
    });
  });

  it('updates an enrolled student in an owned class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.classEnrollment.findUnique.mockResolvedValue({
      studentId: 'student-1',
    });
    prisma.user.update.mockResolvedValue({
      id: 'student-1',
      name: 'Updated Student',
      email: 'updated@example.com',
    });

    const result = await service.updateStudent(
      'teacher-1',
      'class-1',
      'student-1',
      {
        name: 'Updated Student',
        email: 'updated@example.com',
      },
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: {
        name: 'Updated Student',
        email: 'updated@example.com',
      },
    });
    expect(result.email).toBe('updated@example.com');
  });

  it('removes a student enrollment from an owned class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.classEnrollment.findUnique.mockResolvedValue({
      studentId: 'student-1',
    });
    prisma.classEnrollment.delete.mockResolvedValue({
      studentId: 'student-1',
    });

    await expect(
      service.removeStudent('teacher-1', 'class-1', 'student-1'),
    ).resolves.toEqual({ studentId: 'student-1' });
  });

  it('returns only classes joined by the student', async () => {
    prisma.class.findMany.mockResolvedValue([
      createStudentClassRecord({
        id: 'class-1',
        name: 'English A2',
        teacherName: 'Teacher',
      }),
    ]);

    const result = await service.listStudentClasses('student-1');

    expect(prisma.class.findMany).toHaveBeenCalledWith({
      where: {
        enrollments: {
          some: {
            studentId: 'student-1',
          },
        },
      },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'class-1',
        name: 'English A2',
        teacherName: 'Teacher',
        level: 'A2',
        progress: 0,
        wordSets: [
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
        ],
      },
    ]);
  });

  it('joins a class by invite code', async () => {
    prisma.class.findUnique.mockResolvedValue(
      createStudentClassRecord({
        id: 'class-1',
        name: 'English A2',
        teacherName: 'Teacher',
      }),
    );
    prisma.classEnrollment.upsert.mockResolvedValue({});

    const result = await service.joinClass('student-1', {
      inviteCode: ' abc-123 ',
    });

    expect(prisma.class.findUnique).toHaveBeenCalledWith({
      where: { inviteCode: 'ABC-123' },
      include: expect.any(Object),
    });
    expect(prisma.classEnrollment.upsert).toHaveBeenCalledWith({
      where: {
        classId_studentId: {
          classId: 'class-1',
          studentId: 'student-1',
        },
      },
      create: {
        classId: 'class-1',
        studentId: 'student-1',
      },
      update: {},
    });
    expect(result.id).toBe('class-1');
  });

  it('returns the existing joined class for duplicate joins', async () => {
    prisma.class.findUnique.mockResolvedValue(
      createStudentClassRecord({
        id: 'class-1',
        name: 'English A2',
        teacherName: 'Teacher',
      }),
    );
    prisma.classEnrollment.upsert.mockResolvedValue({});

    const result = await service.joinClass('student-1', {
      inviteCode: 'ABC-123',
    });

    expect(result.name).toBe('English A2');
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
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  classEnrollment: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
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
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    classEnrollment: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
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

function createStudentClassRecord(input: {
  id: string;
  name: string;
  teacherName: string;
}) {
  return {
    id: input.id,
    name: input.name,
    description: 'Core vocabulary',
    level: 'A2',
    inviteCode: 'ABC-123',
    teacherId: 'teacher-1',
    teacher: {
      name: input.teacherName,
    },
    assignments: [
      {
        id: 'assignment-1',
        wordSet: {
          title: 'Travel',
          words: [{ id: 'word-1' }, { id: 'word-2' }],
        },
      },
    ],
  };
}
