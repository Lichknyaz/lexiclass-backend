import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto';

interface AssignmentRecord {
  id: string;
  classId: string;
  wordSetId: string;
  assignedAt: Date;
}

interface StudentAssignmentRecord extends AssignmentRecord {
  class: {
    id: string;
    name: string;
  };
  wordSet: {
    title: string;
    words: unknown[];
  };
}

interface StudentWordSetAssignmentRecord extends AssignmentRecord {
  class: {
    id: string;
    name: string;
    enrollments: unknown[];
  };
  wordSet: {
    id: string;
    title: string;
    description: string;
    createdAt: Date;
    words: Array<{
      id: string;
      term: string;
      translation: string;
      exampleSentence: string;
      transcription: string | null;
    }>;
  };
}

export interface AssignmentDto {
  id: string;
  classId: string;
  wordSetId: string;
  assignedAt: string;
}

export interface StudentAssignedWordSetDto {
  id: string;
  classId: string;
  className: string;
  title: string;
  words: number;
  completedWords: number;
  progress: number;
  dueLabel: string;
}

export interface StudentWordDto {
  id: string;
  term: string;
  translation: string;
  exampleSentence: string;
  transcription?: string | null;
  masteryLevel: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export interface StudentWordSetDetailsDto {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  words: number;
  assignedStudents: number;
  averageProgress: number;
  createdAt: string;
  wordsList: StudentWordDto[];
}

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAssignment(
    teacherId: string,
    input: CreateAssignmentDto,
  ): Promise<AssignmentDto> {
    await this.assertTeacherOwnsClass(teacherId, input.classId);
    await this.assertTeacherOwnsWordSet(teacherId, input.wordSetId);

    const assignment = await this.prisma.assignment.upsert({
      where: {
        classId_wordSetId: {
          classId: input.classId,
          wordSetId: input.wordSetId,
        },
      },
      create: {
        classId: input.classId,
        wordSetId: input.wordSetId,
      },
      update: {},
    });

    return mapAssignment(assignment);
  }

  async listTeacherAssignments(
    teacherId: string,
    query: ListAssignmentsQueryDto,
  ): Promise<AssignmentDto[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        ...(query.classId ? { classId: query.classId } : {}),
        ...(query.wordSetId ? { wordSetId: query.wordSetId } : {}),
        class: {
          teacherId,
        },
        wordSet: {
          teacherId,
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return assignments.map(mapAssignment);
  }

  async listStudentAssignments(
    studentId: string,
  ): Promise<StudentAssignedWordSetDto[]> {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        class: {
          enrollments: {
            some: {
              studentId,
            },
          },
        },
      },
      include: studentAssignmentInclude,
      orderBy: { assignedAt: 'desc' },
    });

    return assignments.map(mapStudentAssignment);
  }

  async getStudentWordSetDetails(
    studentId: string,
    assignmentId: string,
  ): Promise<StudentWordSetDetailsDto> {
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        class: {
          enrollments: {
            some: {
              studentId,
            },
          },
        },
      },
      include: studentWordSetInclude,
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return mapStudentWordSetDetails(assignment);
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

  private async assertTeacherOwnsWordSet(teacherId: string, wordSetId: string) {
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
}

const studentAssignmentInclude = {
  class: {
    select: {
      id: true,
      name: true,
    },
  },
  wordSet: {
    include: {
      words: true,
    },
  },
};

const studentWordSetInclude = {
  class: {
    include: {
      enrollments: true,
    },
  },
  wordSet: {
    include: {
      words: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
    },
  },
};

function mapAssignment(assignment: AssignmentRecord): AssignmentDto {
  return {
    id: assignment.id,
    classId: assignment.classId,
    wordSetId: assignment.wordSetId,
    assignedAt: assignment.assignedAt.toISOString(),
  };
}

function mapStudentAssignment(
  assignment: StudentAssignmentRecord,
): StudentAssignedWordSetDto {
  return {
    id: assignment.id,
    classId: assignment.class.id,
    className: assignment.class.name,
    title: assignment.wordSet.title,
    words: assignment.wordSet.words.length,
    completedWords: 0,
    progress: 0,
    dueLabel: 'No due date',
  };
}

function mapStudentWordSetDetails(
  assignment: StudentWordSetAssignmentRecord,
): StudentWordSetDetailsDto {
  return {
    id: assignment.wordSet.id,
    classId: assignment.class.id,
    className: assignment.class.name,
    title: assignment.wordSet.title,
    description: assignment.wordSet.description,
    words: assignment.wordSet.words.length,
    assignedStudents: assignment.class.enrollments.length,
    averageProgress: 0,
    createdAt: assignment.wordSet.createdAt.toISOString(),
    wordsList: assignment.wordSet.words.map(mapStudentWord),
  };
}

function mapStudentWord(
  word: StudentWordSetAssignmentRecord['wordSet']['words'][number],
): StudentWordDto {
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
