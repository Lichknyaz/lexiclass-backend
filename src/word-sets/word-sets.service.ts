import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WordSet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWordSetDto } from './dto/create-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import { AddWordsDto, BulkDeleteWordsDto, WordInputDto } from './dto/word.dto';

interface WordSetSummaryRecord {
  id: string;
  title: string;
  description: string;
  _count: {
    words: number;
    assignments: number;
  };
}

interface WordSetDetailsRecord extends WordSet {
  words: Array<{
    id: string;
    term: string;
    translation: string;
    exampleSentence: string;
    transcription: string | null;
  }>;
  assignments: Array<{
    class: {
      enrollments: unknown[];
    };
  }>;
}

interface WordRecord {
  id: string;
  term: string;
  translation: string;
  exampleSentence: string;
  transcription: string | null;
}

export interface WordSetSummaryDto {
  id: string;
  title: string;
  description: string;
  words: number;
  assignedClasses: number;
}

export interface WordDto {
  id: string;
  term: string;
  translation: string;
  exampleSentence: string;
  transcription?: string | null;
  masteryLevel: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export interface WordSetDetailsDto {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  words: number;
  assignedStudents: number;
  averageProgress: number;
  createdAt: string;
  wordsList: WordDto[];
}

@Injectable()
export class WordSetsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWordSets(teacherId: string): Promise<WordSetSummaryDto[]> {
    const wordSets = await this.prisma.wordSet.findMany({
      where: { teacherId },
      include: wordSetSummaryInclude,
      orderBy: { createdAt: 'desc' },
    });

    return wordSets.map(mapWordSetSummary);
  }

  async createWordSet(
    teacherId: string,
    input: CreateWordSetDto,
  ): Promise<WordSetSummaryDto> {
    const wordSet = await this.prisma.wordSet.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        teacherId,
      },
      include: wordSetSummaryInclude,
    });

    return mapWordSetSummary(wordSet);
  }

  async getWordSetDetails(
    teacherId: string,
    wordSetId: string,
  ): Promise<WordSetDetailsDto> {
    const wordSet = await this.getOwnedWordSetDetails(teacherId, wordSetId);

    return mapWordSetDetails(wordSet);
  }

  async updateWordSet(
    teacherId: string,
    wordSetId: string,
    input: UpdateWordSetDto,
  ): Promise<WordSetDetailsDto> {
    await this.assertTeacherOwnsWordSet(teacherId, wordSetId);

    const wordSet = await this.prisma.wordSet.update({
      where: { id: wordSetId },
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        tag: input.tag.trim(),
      },
      include: wordSetDetailsInclude,
    });

    return mapWordSetDetails(wordSet);
  }

  async deleteWordSet(teacherId: string, wordSetId: string) {
    await this.assertTeacherOwnsWordSet(teacherId, wordSetId);
    await this.prisma.wordSet.delete({
      where: { id: wordSetId },
    });

    return { id: wordSetId };
  }

  async addWords(
    teacherId: string,
    wordSetId: string,
    input: AddWordsDto,
  ): Promise<WordDto[]> {
    await this.assertTeacherOwnsWordSet(teacherId, wordSetId);

    const words = await Promise.all(
      input.words.map((word) =>
        this.prisma.word.create({
          data: {
            wordSetId,
            ...mapWordInput(word),
          },
        }),
      ),
    );

    return words.map(mapWord);
  }

  async updateWord(
    teacherId: string,
    wordSetId: string,
    wordId: string,
    input: WordInputDto,
  ): Promise<WordDto> {
    await this.assertTeacherOwnsWordSet(teacherId, wordSetId);
    await this.getWordInSetOrThrow(wordSetId, wordId);

    const word = await this.prisma.word.update({
      where: { id: wordId },
      data: mapWordInput(input),
    });

    return mapWord(word);
  }

  async deleteWord(teacherId: string, wordSetId: string, wordId: string) {
    await this.assertTeacherOwnsWordSet(teacherId, wordSetId);
    await this.getWordInSetOrThrow(wordSetId, wordId);
    await this.prisma.word.delete({
      where: { id: wordId },
    });

    return { wordId };
  }

  async bulkDeleteWords(
    teacherId: string,
    wordSetId: string,
    input: BulkDeleteWordsDto,
  ) {
    await this.assertTeacherOwnsWordSet(teacherId, wordSetId);
    const words = await this.prisma.word.findMany({
      where: {
        id: { in: input.wordIds },
        wordSetId,
      },
      select: {
        id: true,
      },
    });
    const foundIds = new Set(words.map((word) => word.id));
    const missingWordId = input.wordIds.find((wordId) => !foundIds.has(wordId));

    if (missingWordId) {
      throw new NotFoundException('Word not found');
    }

    await this.prisma.word.deleteMany({
      where: {
        id: { in: input.wordIds },
        wordSetId,
      },
    });

    return { wordIds: input.wordIds };
  }

  private async assertTeacherOwnsWordSet(
    teacherId: string,
    wordSetId: string,
  ) {
    const wordSet = await this.prisma.wordSet.findUnique({
      where: { id: wordSetId },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!wordSet) {
      throw new NotFoundException('Word set not found');
    }

    if (wordSet.teacherId !== teacherId) {
      throw new ForbiddenException('You cannot access this word set');
    }
  }

  private async getOwnedWordSetDetails(teacherId: string, wordSetId: string) {
    const wordSet = await this.prisma.wordSet.findUnique({
      where: { id: wordSetId },
      include: wordSetDetailsInclude,
    });

    if (!wordSet) {
      throw new NotFoundException('Word set not found');
    }

    if (wordSet.teacherId !== teacherId) {
      throw new ForbiddenException('You cannot access this word set');
    }

    return wordSet;
  }

  private async getWordInSetOrThrow(wordSetId: string, wordId: string) {
    const word = await this.prisma.word.findFirst({
      where: {
        id: wordId,
        wordSetId,
      },
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }
}

const wordSetSummaryInclude = {
  _count: {
    select: {
      words: true,
      assignments: true,
    },
  },
};

const wordSetDetailsInclude = {
  words: {
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
  assignments: {
    include: {
      class: {
        include: {
          enrollments: true,
        },
      },
    },
  },
};

function mapWordSetSummary(
  wordSet: WordSetSummaryRecord,
): WordSetSummaryDto {
  return {
    id: wordSet.id,
    title: wordSet.title,
    description: wordSet.description,
    words: wordSet._count.words,
    assignedClasses: wordSet._count.assignments,
  };
}

function mapWordSetDetails(wordSet: WordSetDetailsRecord): WordSetDetailsDto {
  return {
    id: wordSet.id,
    classId: '',
    className: '',
    title: wordSet.title,
    description: wordSet.description,
    words: wordSet.words.length,
    assignedStudents: countAssignedStudents(wordSet),
    averageProgress: 0,
    createdAt: wordSet.createdAt.toISOString(),
    wordsList: wordSet.words.map(mapWord),
  };
}

function mapWord(word: WordRecord): WordDto {
  return {
    id: word.id,
    term: word.term,
    translation: word.translation,
    exampleSentence: word.exampleSentence,
    transcription: word.transcription,
    masteryLevel: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  };
}

function mapWordInput(word: WordInputDto) {
  return {
    term: word.term.trim(),
    translation: word.translation.trim(),
    exampleSentence: word.exampleSentence.trim(),
    transcription: word.transcription ? word.transcription.trim() : null,
  };
}

function countAssignedStudents(wordSet: WordSetDetailsRecord) {
  const studentIds = new Set<string>();

  for (const assignment of wordSet.assignments) {
    for (const enrollment of assignment.class.enrollments) {
      if (
        typeof enrollment === 'object' &&
        enrollment !== null &&
        'studentId' in enrollment &&
        typeof enrollment.studentId === 'string'
      ) {
        studentIds.add(enrollment.studentId);
      }
    }
  }

  return studentIds.size;
}
