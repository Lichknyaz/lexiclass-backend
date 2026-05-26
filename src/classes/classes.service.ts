import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Class } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

interface ClassSummaryRecord {
  id: string;
  name: string;
  _count: {
    enrollments: number;
    assignments: number;
  };
}

interface ClassDetailsRecord extends Class {
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
      words: unknown[];
    };
    class: {
      enrollments: unknown[];
    };
    practiceAttempts: Array<{
      status: 'CORRECT' | 'WRONG';
    }>;
  }>;
  _count: {
    enrollments: number;
    assignments: number;
  };
}

export interface ClassSummaryDto {
  id: string;
  name: string;
  students: number;
  wordSets: number;
  progress: number;
}

export interface ClassDetailsDto extends ClassSummaryDto {
  inviteCode: string;
  level: string;
  description: string;
  studentsList: Array<{
    id: string;
    name: string;
    email: string;
    progress: number;
    correctAnswers: number;
    wrongAnswers: number;
    lastPracticedAt: string | null;
  }>;
  wordSetsList: Array<{
    id: string;
    classId: string;
    title: string;
    description: string;
    words: number;
    assignedStudents: number;
    averageProgress: number;
  }>;
  problemWords: Array<{
    id: string;
    term: string;
    translation: string;
    wrongAnswers: number;
    correctAnswers: number;
    affectedStudents: number;
  }>;
}

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async listClasses(teacherId: string): Promise<ClassSummaryDto[]> {
    const classes = await this.prisma.class.findMany({
      where: { teacherId },
      include: classSummaryInclude,
      orderBy: { createdAt: 'desc' },
    });

    return classes.map(mapClassSummary);
  }

  async createClass(
    teacherId: string,
    input: CreateClassDto,
  ): Promise<ClassSummaryDto> {
    const createdClass = await this.prisma.class.create({
      data: {
        name: input.name.trim(),
        teacherId,
        inviteCode: createInviteCode(),
      },
      include: classSummaryInclude,
    });

    return mapClassSummary(createdClass);
  }

  async getClassDetails(
    teacherId: string,
    classId: string,
  ): Promise<ClassDetailsDto> {
    const classDetails = await this.getOwnedClassDetails(teacherId, classId);

    return mapClassDetails(classDetails);
  }

  async updateClass(
    teacherId: string,
    classId: string,
    input: UpdateClassDto,
  ): Promise<ClassDetailsDto> {
    await this.assertTeacherOwnsClass(teacherId, classId);

    const updatedClass = await this.prisma.class.update({
      where: { id: classId },
      data: {
        name: input.name.trim(),
        description: input.description.trim(),
        level: input.level.trim(),
      },
      include: classDetailsInclude,
    });

    return mapClassDetails(updatedClass);
  }

  async deleteClass(teacherId: string, classId: string) {
    await this.assertTeacherOwnsClass(teacherId, classId);
    await this.prisma.class.delete({
      where: { id: classId },
    });

    return { id: classId };
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

  private async getOwnedClassDetails(teacherId: string, classId: string) {
    const classDetails = await this.prisma.class.findUnique({
      where: { id: classId },
      include: classDetailsInclude,
    });

    if (!classDetails) {
      throw new NotFoundException('Class not found');
    }

    if (classDetails.teacherId !== teacherId) {
      throw new ForbiddenException('You cannot access this class');
    }

    return classDetails;
  }
}

const classSummaryInclude = {
  _count: {
    select: {
      enrollments: true,
      assignments: true,
    },
  },
};

const classDetailsInclude = {
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

function mapClassSummary(classItem: ClassSummaryRecord): ClassSummaryDto {
  return {
    id: classItem.id,
    name: classItem.name,
    students: classItem._count.enrollments,
    wordSets: classItem._count.assignments,
    progress: 0,
  };
}

function mapClassDetails(classItem: ClassDetailsRecord): ClassDetailsDto {
  return {
    ...mapClassSummary(classItem),
    inviteCode: classItem.inviteCode,
    level: classItem.level,
    description: classItem.description,
    studentsList: classItem.enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      progress: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      lastPracticedAt: null,
    })),
    wordSetsList: classItem.assignments.map((assignment) => ({
      id: assignment.id,
      classId: classItem.id,
      title: assignment.wordSet.title,
      description: assignment.wordSet.description,
      words: assignment.wordSet.words.length,
      assignedStudents: assignment.class.enrollments.length,
      averageProgress: 0,
    })),
    problemWords: [],
  };
}

function createInviteCode() {
  const prefix = Math.random().toString(36).slice(2, 5).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}
