import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Class, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { StudentDto } from './dto/student.dto';
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

interface StudentClassRecord extends Class {
  teacher: {
    name: string;
  };
  assignments: Array<{
    id: string;
    wordSet: {
      title: string;
      words: unknown[];
    };
    practiceAttempts: PracticeAttemptRecord[];
  }>;
}

interface PracticeAttemptRecord {
  studentId: string;
  wordId: string;
  status: 'CORRECT' | 'WRONG';
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

export interface StudentClassDto {
  id: string;
  name: string;
  teacherName: string;
  level: string;
  progress: number;
  wordSets: StudentAssignedWordSetDto[];
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

  async addStudent(
    teacherId: string,
    classId: string,
    input: StudentDto,
  ): Promise<ClassDetailsDto['studentsList'][number]> {
    await this.assertTeacherOwnsClass(teacherId, classId);
    const email = normalizeEmail(input.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.role !== UserRole.STUDENT) {
      throw new ConflictException('Only student users can be added to classes');
    }

    const student =
      existingUser ??
      (await this.prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash: '',
          role: UserRole.STUDENT,
        },
      }));

    const enrollment = await this.prisma.classEnrollment.upsert({
      where: {
        classId_studentId: {
          classId,
          studentId: student.id,
        },
      },
      create: {
        classId,
        studentId: student.id,
      },
      update: {},
      include: {
        student: true,
      },
    });

    return mapStudent(enrollment.student);
  }

  async updateStudent(
    teacherId: string,
    classId: string,
    studentId: string,
    input: StudentDto,
  ): Promise<ClassDetailsDto['studentsList'][number]> {
    await this.assertTeacherOwnsClass(teacherId, classId);
    await this.getEnrollmentOrThrow(classId, studentId);
    const updatedStudent = await this.prisma.user.update({
      where: { id: studentId },
      data: {
        name: input.name.trim(),
        email: normalizeEmail(input.email),
      },
    });

    return mapStudent(updatedStudent);
  }

  async removeStudent(teacherId: string, classId: string, studentId: string) {
    await this.assertTeacherOwnsClass(teacherId, classId);
    await this.getEnrollmentOrThrow(classId, studentId);
    await this.prisma.classEnrollment.delete({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    return { studentId };
  }

  async listStudentClasses(studentId: string): Promise<StudentClassDto[]> {
    const classes = await this.prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            studentId,
          },
        },
      },
      include: createStudentClassInclude(studentId),
      orderBy: { createdAt: 'desc' },
    });

    return classes.map(mapStudentClass);
  }

  async joinClass(
    studentId: string,
    input: JoinClassDto,
  ): Promise<StudentClassDto> {
    const classItem = await this.prisma.class.findUnique({
      where: { inviteCode: normalizeInviteCode(input.inviteCode) },
      include: createStudentClassInclude(studentId),
    });

    if (!classItem) {
      throw new NotFoundException('Class not found');
    }

    await this.prisma.classEnrollment.upsert({
      where: {
        classId_studentId: {
          classId: classItem.id,
          studentId,
        },
      },
      create: {
        classId: classItem.id,
        studentId,
      },
      update: {},
    });

    return mapStudentClass(classItem);
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

  private async getEnrollmentOrThrow(classId: string, studentId: string) {
    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Student enrollment not found');
    }

    return enrollment;
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

function createStudentClassInclude(studentId: string) {
  return {
    teacher: {
      select: {
        name: true,
      },
    },
    assignments: {
      include: {
        wordSet: {
          include: {
            words: true,
          },
        },
        practiceAttempts: {
          where: {
            studentId,
          },
          select: {
            studentId: true,
            wordId: true,
            status: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc' as const,
      },
    },
  };
}

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
    studentsList: classItem.enrollments.map((enrollment) =>
      mapStudent(enrollment.student),
    ),
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

function mapStudent(student: { id: string; name: string; email: string }) {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    progress: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    lastPracticedAt: null,
  };
}

function mapStudentClass(classItem: StudentClassRecord): StudentClassDto {
  const wordSets = classItem.assignments.map((assignment) => {
    const completedWords = countPracticedWords(assignment.practiceAttempts);
    const totalWords = assignment.wordSet.words.length;

    return {
      id: assignment.id,
      classId: classItem.id,
      className: classItem.name,
      title: assignment.wordSet.title,
      words: totalWords,
      completedWords,
      progress: calculatePercentage(completedWords, totalWords),
      dueLabel: 'No due date',
    };
  });

  return {
    id: classItem.id,
    name: classItem.name,
    teacherName: classItem.teacher.name,
    level: classItem.level,
    progress: calculateAverage(wordSets.map((wordSet) => wordSet.progress)),
    wordSets,
  };
}

function countPracticedWords(attempts: PracticeAttemptRecord[]) {
  return new Set(attempts.map((attempt) => attempt.wordId)).size;
}

function calculatePercentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeInviteCode(inviteCode: string) {
  return inviteCode.trim().toUpperCase();
}

function createInviteCode() {
  const prefix = Math.random().toString(36).slice(2, 5).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}
