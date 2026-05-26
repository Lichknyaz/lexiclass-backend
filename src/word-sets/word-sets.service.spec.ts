import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordSetsService } from './word-sets.service';

describe('WordSetsService', () => {
  let service: WordSetsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new WordSetsService(prisma as unknown as PrismaService);
  });

  it('returns only word sets owned by the teacher', async () => {
    prisma.wordSet.findMany.mockResolvedValue([
      {
        id: 'word-set-1',
        title: 'Travel',
        description: 'Airport vocabulary',
        _count: {
          words: 8,
          assignments: 2,
        },
      },
    ]);

    const result = await service.listWordSets('teacher-1');

    expect(prisma.wordSet.findMany).toHaveBeenCalledWith({
      where: { teacherId: 'teacher-1' },
      include: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'word-set-1',
        title: 'Travel',
        description: 'Airport vocabulary',
        words: 8,
        assignedClasses: 2,
      },
    ]);
  });

  it('creates a word set owned by the teacher', async () => {
    prisma.wordSet.create.mockResolvedValue({
      id: 'word-set-1',
      title: 'Travel',
      description: 'Airport vocabulary',
      _count: {
        words: 0,
        assignments: 0,
      },
    });

    const result = await service.createWordSet('teacher-1', {
      title: ' Travel ',
      description: ' Airport vocabulary ',
    });

    expect(prisma.wordSet.create).toHaveBeenCalledWith({
      data: {
        title: 'Travel',
        description: 'Airport vocabulary',
        teacherId: 'teacher-1',
      },
      include: expect.any(Object),
    });
    expect(result.words).toBe(0);
  });

  it('returns word-set details for an owned word set', async () => {
    prisma.wordSet.findUnique.mockResolvedValue(createWordSetDetailsRecord());

    const result = await service.getWordSetDetails('teacher-1', 'word-set-1');

    expect(result).toEqual({
      id: 'word-set-1',
      classId: '',
      className: '',
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

  it('rejects details for another teacher word set', async () => {
    prisma.wordSet.findUnique.mockResolvedValue({
      ...createWordSetDetailsRecord(),
      teacherId: 'teacher-2',
    });

    await expect(
      service.getWordSetDetails('teacher-1', 'word-set-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws not found for missing word sets', async () => {
    prisma.wordSet.findUnique.mockResolvedValue(null);

    await expect(
      service.getWordSetDetails('teacher-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an owned word set', async () => {
    prisma.wordSet.findUnique.mockResolvedValue({
      id: 'word-set-1',
      teacherId: 'teacher-1',
    });
    prisma.wordSet.update.mockResolvedValue(createWordSetDetailsRecord());

    const result = await service.updateWordSet('teacher-1', 'word-set-1', {
      title: 'Updated Travel',
      description: 'Updated description',
      tag: 'A2',
    });

    expect(prisma.wordSet.update).toHaveBeenCalledWith({
      where: { id: 'word-set-1' },
      data: {
        title: 'Updated Travel',
        description: 'Updated description',
        tag: 'A2',
      },
      include: expect.any(Object),
    });
    expect(result.id).toBe('word-set-1');
  });

  it('deletes an owned word set', async () => {
    prisma.wordSet.findUnique.mockResolvedValue({
      id: 'word-set-1',
      teacherId: 'teacher-1',
    });
    prisma.wordSet.delete.mockResolvedValue({ id: 'word-set-1' });

    await expect(
      service.deleteWordSet('teacher-1', 'word-set-1'),
    ).resolves.toEqual({ id: 'word-set-1' });
  });
});

interface MockPrisma {
  wordSet: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
}

function createMockPrisma(): MockPrisma {
  return {
    wordSet: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

function createWordSetDetailsRecord() {
  return {
    id: 'word-set-1',
    title: 'Travel',
    description: 'Airport vocabulary',
    tag: 'A2',
    teacherId: 'teacher-1',
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
    assignments: [
      {
        class: {
          enrollments: [{ studentId: 'student-1' }, { studentId: 'student-2' }],
        },
      },
    ],
  };
}
