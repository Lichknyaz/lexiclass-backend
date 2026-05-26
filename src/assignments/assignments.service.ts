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

export interface AssignmentDto {
  id: string;
  classId: string;
  wordSetId: string;
  assignedAt: string;
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

function mapAssignment(assignment: AssignmentRecord): AssignmentDto {
  return {
    id: assignment.id,
    classId: assignment.classId,
    wordSetId: assignment.wordSetId,
    assignedAt: assignment.assignedAt.toISOString(),
  };
}
