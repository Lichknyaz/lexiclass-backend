import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUserDto } from '../auth/types';
import {
  AssignedWordSetResponseDto,
  AssignmentResponseDto,
  WordSetDetailsResponseDto,
} from '../swagger/api-response.dto';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('teacher/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Assign a word set to a teacher class' })
  @ApiCreatedResponse({ type: AssignmentResponseDto })
  createAssignment(
    @CurrentUser() user: AuthUserDto,
    @Body() input: CreateAssignmentDto,
  ) {
    return this.assignmentsService.createAssignment(user.id, input);
  }

  @Get()
  @ApiOperation({ summary: 'List teacher assignment records' })
  @ApiOkResponse({ type: [AssignmentResponseDto] })
  listAssignments(
    @CurrentUser() user: AuthUserDto,
    @Query() query: ListAssignmentsQueryDto,
  ) {
    return this.assignmentsService.listTeacherAssignments(user.id, query);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@ApiTags('Assignments')
@ApiBearerAuth()
@Controller()
export class StudentAssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('student/assignments')
  @ApiOperation({ summary: 'List assignments available to the student' })
  @ApiOkResponse({ type: [AssignedWordSetResponseDto] })
  listAssignments(@CurrentUser() user: AuthUserDto) {
    return this.assignmentsService.listStudentAssignments(user.id);
  }

  @Get('student/word-sets/:assignmentId')
  @ApiOperation({ summary: 'Get student word-set details by assignment id' })
  @ApiOkResponse({ type: WordSetDetailsResponseDto })
  getWordSetDetails(
    @CurrentUser() user: AuthUserDto,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.assignmentsService.getStudentWordSetDetails(
      user.id,
      assignmentId,
    );
  }
}
