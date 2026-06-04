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
      enrollments: [],
      assignments: [],
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
        enrollments: [],
        assignments: [],
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

  it('maps teacher class progress from saved practice attempts', async () => {
    prisma.class.findUnique.mockResolvedValue(
      createClassDetailsRecord({
        enrollments: [
          {
            student: {
              id: 'student-1',
              name: 'Test',
              email: 'test@test.test',
            },
          },
          {
            student: {
              id: 'student-2',
              name: 'Demo Student',
              email: 'student@example.com',
            },
          },
        ],
        assignments: [
          {
            id: 'assignment-1',
            wordSet: {
              id: 'word-set-1',
              title: 'Test',
              description: 'test',
              words: [
                {
                  id: 'word-1',
                  term: 'depart',
                  translation: 'leave',
                },
                {
                  id: 'word-2',
                  term: 'arrive',
                  translation: 'come',
                },
              ],
            },
            class: {
              enrollments: [{ studentId: 'student-1' }, { studentId: 'student-2' }],
            },
            practiceAttempts: [
              {
                studentId: 'student-1',
                wordId: 'word-1',
                status: 'CORRECT',
                answeredAt: new Date('2026-05-29T14:49:48.886Z'),
              },
              {
                studentId: 'student-1',
                wordId: 'word-2',
                status: 'WRONG',
                answeredAt: new Date('2026-05-29T14:50:48.886Z'),
              },
            ],
          },
        ],
      }),
    );

    const result = await service.getClassDetails('teacher-1', 'class-1');

    expect(result.progress).toBe(50);
    expect(result.studentsList).toEqual([
      expect.objectContaining({
        id: 'student-1',
        progress: 100,
        correctAnswers: 1,
        wrongAnswers: 1,
        lastPracticedAt: '2026-05-29T14:50:48.886Z',
      }),
      expect.objectContaining({
        id: 'student-2',
        progress: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        lastPracticedAt: null,
      }),
    ]);
    expect(result.wordSetsList[0]).toEqual(
      expect.objectContaining({
        averageProgress: 50,
      }),
    );
    expect(result.problemWords).toEqual([
      {
        id: 'word-2',
        term: 'arrive',
        translation: 'come',
        wrongAnswers: 1,
        correctAnswers: 0,
        affectedStudents: 1,
      },
    ]);
  });

  it('maps teacher class overview progress from saved practice attempts', async () => {
    prisma.class.findMany.mockResolvedValue([
      {
        id: 'class-1',
        name: 'English B1',
        enrollments: [
          { student: { id: 'student-1' } },
          { student: { id: 'student-2' } },
        ],
        assignments: [
          {
            wordSet: {
              words: [{ id: 'word-1' }, { id: 'word-2' }],
            },
            practiceAttempts: [
              {
                studentId: 'student-1',
                wordId: 'word-1',
                status: 'CORRECT',
              },
              {
                studentId: 'student-1',
                wordId: 'word-2',
                status: 'WRONG',
              },
            ],
          },
        ],
        _count: {
          enrollments: 2,
          assignments: 1,
        },
      },
    ]);

    const result = await service.listClasses('teacher-1');

    expect(result[0]).toEqual(
      expect.objectContaining({
        progress: 50,
      }),
    );
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

  it('maps joined class and nested word-set progress from saved practice attempts', async () => {
    prisma.class.findMany.mockResolvedValue([
      createStudentClassRecord({
        id: 'class-1',
        name: 'English A2',
        teacherName: 'Teacher',
        assignments: [
          {
            id: 'assignment-1',
            wordSet: {
              title: 'Travel',
              words: [{ id: 'word-1' }, { id: 'word-2' }],
            },
            practiceAttempts: [
              {
                studentId: 'student-1',
                wordId: 'word-1',
                status: 'CORRECT',
              },
            ],
          },
        ],
      }),
    ]);

    const result = await service.listStudentClasses('student-1');

    expect(result[0]).toEqual(
      expect.objectContaining({
        progress: 50,
        wordSets: [
          expect.objectContaining({
            completedWords: 1,
            progress: 50,
          }),
        ],
      }),
    );
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

  it('returns weak review words for an owned class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.practiceAttempt.findMany.mockResolvedValue([
      createReviewAttempt({
        wordId: 'word-1',
        studentId: 'student-1',
        status: 'WRONG',
      }),
      createReviewAttempt({
        wordId: 'word-1',
        studentId: 'student-2',
        status: 'CORRECT',
      }),
      createReviewAttempt({
        wordId: 'word-1',
        studentId: 'student-2',
        status: 'WRONG',
      }),
    ]);

    const result = await service.listClassReviewWords('teacher-1', 'class-1', {
      source: 'weak',
      problemWordWindow: '14',
    });

    expect(prisma.practiceAttempt.findMany).toHaveBeenCalledWith({
      where: {
        assignment: {
          classId: 'class-1',
          class: {
            teacherId: 'teacher-1',
          },
        },
        answeredAt: expect.objectContaining({
          gte: expect.any(Date),
        }),
      },
      include: expect.any(Object),
    });
    expect(result).toEqual([
      {
        wordId: 'word-1',
        term: 'arrive',
        translation: 'прибувати',
        transcription: 'uh-RYV',
        exampleSentence: 'We arrive at the airport.',
        sourceWordSetId: 'word-set-1',
        sourceWordSetTitle: 'Travel Basics',
        wrongAnswers: 2,
        correctAnswers: 1,
        affectedStudents: 2,
        wrongRate: 67,
      },
    ]);
  });

  it('returns all assigned words for an owned class', async () => {
    prisma.class.findUnique.mockResolvedValue(
      createClassDetailsRecord({
        assignments: [
          {
            id: 'assignment-1',
            wordSet: {
              id: 'word-set-1',
              title: 'Travel Basics',
              description: 'Travel words',
              words: [
                {
                  id: 'word-2',
                  term: 'depart',
                  translation: 'відправлятися',
                  transcription: 'di-PAHRT',
                  exampleSentence: 'The train departs at noon.',
                },
                {
                  id: 'word-1',
                  term: 'arrive',
                  translation: 'прибувати',
                  transcription: 'uh-RYV',
                  exampleSentence: 'We arrive at the airport.',
                },
              ],
            },
            class: {
              enrollments: [],
            },
            practiceAttempts: [],
          },
        ],
      }),
    );

    const result = await service.listClassReviewWords('teacher-1', 'class-1', {
      source: 'all',
    });

    expect(result).toEqual([
      expect.objectContaining({
        wordId: 'word-1',
        term: 'arrive',
        sourceWordSetTitle: 'Travel Basics',
        wrongAnswers: 0,
        correctAnswers: 0,
        affectedStudents: 0,
        wrongRate: 0,
      }),
      expect.objectContaining({
        wordId: 'word-2',
        term: 'depart',
        sourceWordSetTitle: 'Travel Basics',
      }),
    ]);
  });

  it('rejects review words for another teacher class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-2',
    });

    await expect(
      service.listClassReviewWords('teacher-1', 'class-1', {
        source: 'all',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates and assigns a review word set from selected class words', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.word.findMany.mockResolvedValue([
      {
        id: 'word-1',
        term: 'arrive',
        translation: 'прибувати',
        transcription: 'uh-RYV',
        exampleSentence: 'We arrive at the airport.',
      },
      {
        id: 'word-2',
        term: 'delay',
        translation: 'затримка',
        transcription: 'di-LAY',
        exampleSentence: 'The flight has a delay.',
      },
    ]);
    prisma.wordSet.create.mockResolvedValue({
      id: 'review-set-1',
      title: 'Review: English A2 - Travel',
      description: 'Review set',
      _count: {
        words: 2,
        assignments: 0,
      },
    });
    prisma.assignment.upsert.mockResolvedValue({
      id: 'assignment-1',
      classId: 'class-1',
      wordSetId: 'review-set-1',
      assignedAt: new Date('2026-06-04T12:00:00.000Z'),
    });

    const result = await service.createClassReviewWordSet(
      'teacher-1',
      'class-1',
      {
        title: 'Review: English A2 - Travel',
        description: 'Review set',
        tag: 'A2',
        wordIds: ['word-1', 'word-2'],
        assignToClass: true,
      },
    );

    expect(prisma.word.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['word-1', 'word-2'],
        },
        wordSet: {
          assignments: {
            some: {
              classId: 'class-1',
              class: {
                teacherId: 'teacher-1',
              },
            },
          },
        },
      },
      orderBy: {
        term: 'asc',
      },
    });
    expect(prisma.wordSet.create).toHaveBeenCalledWith({
      data: {
        title: 'Review: English A2 - Travel',
        description: 'Review set',
        tag: 'A2',
        teacherId: 'teacher-1',
        words: {
          create: [
            {
              term: 'arrive',
              translation: 'прибувати',
              transcription: 'uh-RYV',
              exampleSentence: 'We arrive at the airport.',
            },
            {
              term: 'delay',
              translation: 'затримка',
              transcription: 'di-LAY',
              exampleSentence: 'The flight has a delay.',
            },
          ],
        },
      },
      include: expect.any(Object),
    });
    expect(prisma.assignment.upsert).toHaveBeenCalledWith({
      where: {
        classId_wordSetId: {
          classId: 'class-1',
          wordSetId: 'review-set-1',
        },
      },
      create: {
        classId: 'class-1',
        wordSetId: 'review-set-1',
      },
      update: {},
    });
    expect(result).toEqual({
      wordSet: {
        id: 'review-set-1',
        title: 'Review: English A2 - Travel',
        description: 'Review set',
        words: 2,
        assignedClasses: 0,
      },
      assignment: {
        id: 'assignment-1',
        classId: 'class-1',
        wordSetId: 'review-set-1',
        assignedAt: '2026-06-04T12:00:00.000Z',
      },
    });
  });

  it('creates a review word set without assignment when disabled', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.word.findMany.mockResolvedValue([
      {
        id: 'word-1',
        term: 'arrive',
        translation: 'прибувати',
        transcription: null,
        exampleSentence: 'We arrive at the airport.',
      },
    ]);
    prisma.wordSet.create.mockResolvedValue({
      id: 'review-set-1',
      title: 'Review',
      description: '',
      _count: {
        words: 1,
        assignments: 0,
      },
    });

    const result = await service.createClassReviewWordSet(
      'teacher-1',
      'class-1',
      {
        title: 'Review',
        description: '',
        tag: '',
        wordIds: ['word-1'],
        assignToClass: false,
      },
    );

    expect(prisma.assignment.upsert).not.toHaveBeenCalled();
    expect(result.assignment).toBeNull();
  });

  it('rejects review word set creation when selected words are outside the class', async () => {
    prisma.class.findUnique.mockResolvedValue({
      id: 'class-1',
      teacherId: 'teacher-1',
    });
    prisma.word.findMany.mockResolvedValue([
      {
        id: 'word-1',
        term: 'arrive',
        translation: 'прибувати',
        transcription: null,
        exampleSentence: 'We arrive at the airport.',
      },
    ]);

    await expect(
      service.createClassReviewWordSet('teacher-1', 'class-1', {
        title: 'Review',
        description: '',
        tag: '',
        wordIds: ['word-1', 'outside-word'],
        assignToClass: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
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
  word: {
    findMany: jest.Mock;
  };
  wordSet: {
    create: jest.Mock;
  };
  assignment: {
    upsert: jest.Mock;
  };
  practiceAttempt: {
    findMany: jest.Mock;
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
    word: {
      findMany: jest.fn(),
    },
    wordSet: {
      create: jest.fn(),
    },
    assignment: {
      upsert: jest.fn(),
    },
    practiceAttempt: {
      findMany: jest.fn(),
    },
  };
}

interface ClassDetailsTestRecord {
  id: string;
  name: string;
  description: string;
  level: string;
  inviteCode: string;
  teacherId: string;
  enrollments: Array<{
    student: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  assignments: Array<{
    id: string;
    wordSet: {
      id: string;
      title: string;
      description: string;
      words: Array<{
        id: string;
        term?: string;
        translation?: string;
        transcription?: string | null;
        exampleSentence?: string;
      }>;
    };
    class: {
      enrollments: Array<{ studentId: string }>;
    };
    practiceAttempts: Array<{
      studentId: string;
      wordId: string;
      status: 'CORRECT' | 'WRONG';
      answeredAt: Date;
    }>;
  }>;
  _count: {
    enrollments: number;
    assignments: number;
  };
}

function createReviewAttempt(input: {
  wordId: string;
  studentId: string;
  status: 'CORRECT' | 'WRONG';
}) {
  return {
    wordId: input.wordId,
    studentId: input.studentId,
    status: input.status,
    answeredAt: new Date('2026-06-04T10:00:00.000Z'),
    word: {
      id: input.wordId,
      term: 'arrive',
      translation: 'прибувати',
      transcription: 'uh-RYV',
      exampleSentence: 'We arrive at the airport.',
      wordSet: {
        id: 'word-set-1',
        title: 'Travel Basics',
      },
    },
  };
}

function createClassDetailsRecord(
  overrides: Partial<ClassDetailsTestRecord> = {},
): ClassDetailsTestRecord {
  return {
    ...createClassDetailsRecordBase(),
    ...overrides,
  };
}

function createClassDetailsRecordBase(): ClassDetailsTestRecord {
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
  assignments?: Array<{
    id: string;
    wordSet: {
      title: string;
      words: Array<{ id: string }>;
    };
    practiceAttempts?: Array<{
      studentId: string;
      wordId: string;
      status: 'CORRECT' | 'WRONG';
    }>;
  }>;
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
    assignments: input.assignments ?? [
      {
        id: 'assignment-1',
        wordSet: {
          title: 'Travel',
          words: [{ id: 'word-1' }, { id: 'word-2' }],
        },
        practiceAttempts: [],
      },
    ],
  };
}
