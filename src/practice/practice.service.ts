import { Injectable, NotFoundException } from '@nestjs/common';
import { AnswerStatus, PracticeMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnswerStatusDto,
  PracticeModeDto,
  PracticeSessionDto,
} from './dto/practice-session.dto';

export interface PracticeSessionResultDto {
  assignmentId: string;
  studentId: string;
  mode: PracticeModeDto;
  correctAnswers: number;
  wrongAnswers: number;
  wordResults: Array<{
    wordId: string;
    correctAnswers: number;
    wrongAnswers: number;
  }>;
}

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async savePracticeSession(
    studentId: string,
    input: PracticeSessionDto,
  ): Promise<PracticeSessionResultDto> {
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: input.assignmentId,
        class: {
          enrollments: {
            some: {
              studentId,
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

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const validWordIds = new Set(
      assignment.wordSet.words.map((word) => word.id),
    );
    const invalidAttempt = input.attempts.find(
      (attempt) => !validWordIds.has(attempt.wordId),
    );

    if (invalidAttempt) {
      throw new NotFoundException('Word not found in assignment');
    }

    await this.prisma.practiceAttempt.createMany({
      data: input.attempts.map((attempt) => ({
        assignmentId: input.assignmentId,
        studentId,
        wordId: attempt.wordId,
        status: toPrismaAnswerStatus(attempt.status),
        mode: toPrismaPracticeMode(input.mode),
        answeredAt: new Date(attempt.answeredAt),
      })),
    });

    return mapPracticeSessionResult(studentId, input);
  }
}

function mapPracticeSessionResult(
  studentId: string,
  input: PracticeSessionDto,
): PracticeSessionResultDto {
  const wordResults = new Map<
    string,
    { wordId: string; correctAnswers: number; wrongAnswers: number }
  >();
  let correctAnswers = 0;
  let wrongAnswers = 0;

  for (const attempt of input.attempts) {
    const existing = wordResults.get(attempt.wordId) ?? {
      wordId: attempt.wordId,
      correctAnswers: 0,
      wrongAnswers: 0,
    };

    if (attempt.status === 'correct') {
      existing.correctAnswers += 1;
      correctAnswers += 1;
    } else {
      existing.wrongAnswers += 1;
      wrongAnswers += 1;
    }

    wordResults.set(attempt.wordId, existing);
  }

  return {
    assignmentId: input.assignmentId,
    studentId,
    mode: input.mode,
    correctAnswers,
    wrongAnswers,
    wordResults: Array.from(wordResults.values()),
  };
}

function toPrismaAnswerStatus(status: AnswerStatusDto): AnswerStatus {
  return status === 'correct' ? AnswerStatus.CORRECT : AnswerStatus.WRONG;
}

function toPrismaPracticeMode(mode: PracticeModeDto): PracticeMode {
  if (mode === 'multiple_choice') {
    return PracticeMode.MULTIPLE_CHOICE;
  }

  if (mode === 'writing') {
    return PracticeMode.WRITING;
  }

  return PracticeMode.FLASHCARD;
}
