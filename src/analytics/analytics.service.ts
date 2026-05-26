import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnswerStatus, Class } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

interface AnalyticsClassRecord extends Class {
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
      words: Array<{ id: string }>;
    };
    class: {
      enrollments: unknown[];
    };
    practiceAttempts: Array<{
      studentId: string;
      wordId: string;
      status: AnswerStatus;
      answeredAt: Date;
    }>;
  }>;
  _count: {
    enrollments: number;
    assignments: number;
  };
}

interface AttemptWithWordRecord {
  wordId: string;
  studentId: string;
  status: AnswerStatus;
  word: {
    id: string;
    term: string;
    translation: string;
  };
}

interface ProblemWordDto {
  id: string;
  term: string;
  translation: string;
  wrongAnswers: number;
  correctAnswers: number;
  affectedStudents: number;
}

interface StudentAnalyticsDto {
  id: string;
  name: string;
  email: string;
  progress: number;
  correctAnswers: number;
  wrongAnswers: number;
  lastPracticedAt: string | null;
}

interface ClassAnalyticsDto {
  id: string;
  name: string;
  students: number;
  wordSets: number;
  progress: number;
  inviteCode: string;
  level: string;
  description: string;
  studentsList: StudentAnalyticsDto[];
  wordSetsList: Array<{
    id: string;
    classId: string;
    title: string;
    description: string;
    words: number;
    assignedStudents: number;
    averageProgress: number;
  }>;
  problemWords: ProblemWordDto[];
}

export interface TeacherAnalyticsDto {
  totalStudents: number;
  totalWordSets: number;
  averageProgress: number;
  classProgress: ClassAnalyticsDto[];
  problemWords: ProblemWordDto[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeacherAnalytics(
    teacherId: string,
    query: AnalyticsQueryDto,
  ): Promise<TeacherAnalyticsDto> {
    if (query.classId) {
      await this.assertTeacherOwnsClass(teacherId, query.classId);
    }

    const classes = await this.prisma.class.findMany({
      where: {
        teacherId,
        ...(query.classId ? { id: query.classId } : {}),
      },
      include: analyticsClassInclude,
      orderBy: { createdAt: 'desc' },
    });
    const attempts = await this.prisma.practiceAttempt.findMany({
      where: {
        assignment: {
          class: {
            teacherId,
            ...(query.classId ? { id: query.classId } : {}),
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
    const problemWords = mapProblemWords(attempts);
    const classProgress = classes.map((classItem) =>
      mapClassAnalytics(classItem, problemWords),
    );

    return {
      totalStudents: countDistinctStudents(classes),
      totalWordSets: countDistinctWordSets(classes),
      averageProgress: average(classProgress.map((classItem) => classItem.progress)),
      classProgress,
      problemWords,
    };
  }

  private async assertTeacherOwnsClass(teacherId: string, classId: string) {
    const classItem = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        teacherId: true,
      },
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
    }

    if (classItem.teacherId !== teacherId) {
      throw new ForbiddenException('You cannot access this class');
    }
  }
}

const analyticsClassInclude = {
  enrollments: {
    include: {
      student: true,
    },
    orderBy: {
      createdAt: 'desc' as const,
    },
  },
  assignments: {
    include: {
      wordSet: {
        include: {
          words: true,
        },
      },
      class: {
        include: {
          enrollments: true,
        },
      },
      practiceAttempts: true,
    },
    orderBy: {
      assignedAt: 'desc' as const,
    },
  },
  _count: {
    select: {
      enrollments: true,
      assignments: true,
    },
  },
};

function mapClassAnalytics(
  classItem: AnalyticsClassRecord,
  allProblemWords: ProblemWordDto[],
): ClassAnalyticsDto {
  const progress = classProgressPercentage(classItem);

  return {
    id: classItem.id,
    name: classItem.name,
    students: classItem._count.enrollments,
    wordSets: classItem._count.assignments,
    progress,
    inviteCode: classItem.inviteCode,
    level: classItem.level,
    description: classItem.description,
    studentsList: classItem.enrollments.map((enrollment) =>
      mapStudentAnalytics(enrollment.student, classItem),
    ),
    wordSetsList: classItem.assignments.map((assignment) => ({
      id: assignment.id,
      classId: classItem.id,
      title: assignment.wordSet.title,
      description: assignment.wordSet.description,
      words: assignment.wordSet.words.length,
      assignedStudents: assignment.class.enrollments.length,
      averageProgress: assignmentProgressPercentage(assignment),
    })),
    problemWords: allProblemWords.filter((problemWord) =>
      classItem.assignments.some((assignment) =>
        assignment.wordSet.words.some((word) => word.id === problemWord.id),
      ),
    ),
  };
}

function mapStudentAnalytics(
  student: { id: string; name: string; email: string },
  classItem: AnalyticsClassRecord,
): StudentAnalyticsDto {
  const attempts = classItem.assignments.flatMap((assignment) =>
    assignment.practiceAttempts.filter(
      (attempt) => attempt.studentId === student.id,
    ),
  );
  const correctAnswers = attempts.filter(
    (attempt) => attempt.status === AnswerStatus.CORRECT,
  ).length;
  const wrongAnswers = attempts.filter(
    (attempt) => attempt.status === AnswerStatus.WRONG,
  ).length;
  const lastPracticedAt = attempts.reduce<Date | null>(
    (latest, attempt) =>
      !latest || attempt.answeredAt > latest ? attempt.answeredAt : latest,
    null,
  );

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    progress: studentProgressPercentage(student.id, classItem),
    correctAnswers,
    wrongAnswers,
    lastPracticedAt: lastPracticedAt?.toISOString() ?? null,
  };
}

function mapProblemWords(attempts: AttemptWithWordRecord[]): ProblemWordDto[] {
  const words = new Map<
    string,
    {
      id: string;
      term: string;
      translation: string;
      wrongAnswers: number;
      correctAnswers: number;
      affectedStudentIds: Set<string>;
    }
  >();

  for (const attempt of attempts) {
    const item = words.get(attempt.wordId) ?? {
      id: attempt.word.id,
      term: attempt.word.term,
      translation: attempt.word.translation,
      wrongAnswers: 0,
      correctAnswers: 0,
      affectedStudentIds: new Set<string>(),
    };

    if (attempt.status === AnswerStatus.WRONG) {
      item.wrongAnswers += 1;
      item.affectedStudentIds.add(attempt.studentId);
    } else {
      item.correctAnswers += 1;
    }

    words.set(attempt.wordId, item);
  }

  return Array.from(words.values())
    .filter((word) => word.wrongAnswers > 0)
    .sort((first, second) => second.wrongAnswers - first.wrongAnswers)
    .map((word) => ({
      id: word.id,
      term: word.term,
      translation: word.translation,
      wrongAnswers: word.wrongAnswers,
      correctAnswers: word.correctAnswers,
      affectedStudents: word.affectedStudentIds.size,
    }));
}

function countDistinctStudents(classes: AnalyticsClassRecord[]) {
  return new Set(
    classes.flatMap((classItem) =>
      classItem.enrollments.map((enrollment) => enrollment.student.id),
    ),
  ).size;
}

function countDistinctWordSets(classes: AnalyticsClassRecord[]) {
  return new Set(
    classes.flatMap((classItem) =>
      classItem.assignments.map((assignment) => assignment.wordSet.id),
    ),
  ).size;
}

function classProgressPercentage(classItem: AnalyticsClassRecord) {
  return average(
    classItem.assignments.map((assignment) =>
      assignmentProgressPercentage(assignment),
    ),
  );
}

function assignmentProgressPercentage(
  assignment: AnalyticsClassRecord['assignments'][number],
) {
  const totalWords = assignment.wordSet.words.length;
  const totalStudents = assignment.class.enrollments.length;

  if (totalWords === 0 || totalStudents === 0) {
    return 0;
  }

  const completedPairs = new Set(
    assignment.practiceAttempts.map(
      (attempt) => `${attempt.studentId}:${attempt.wordId}`,
    ),
  );

  return Math.round((completedPairs.size / (totalWords * totalStudents)) * 100);
}

function studentProgressPercentage(
  studentId: string,
  classItem: AnalyticsClassRecord,
) {
  const assignedWords = new Set(
    classItem.assignments.flatMap((assignment) =>
      assignment.wordSet.words.map((word) => `${assignment.id}:${word.id}`),
    ),
  );

  if (assignedWords.size === 0) {
    return 0;
  }

  const completedWords = new Set(
    classItem.assignments.flatMap((assignment) =>
      assignment.practiceAttempts
        .filter((attempt) => attempt.studentId === studentId)
        .map((attempt) => `${assignment.id}:${attempt.wordId}`),
    ),
  );

  return Math.round((completedWords.size / assignedWords.size) * 100);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}
