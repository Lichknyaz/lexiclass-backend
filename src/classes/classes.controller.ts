import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
  ClassDetailsResponseDto,
  ClassSummaryResponseDto,
  DeleteIdResponseDto,
  DeleteStudentResponseDto,
  StudentClassResponseDto,
  StudentResponseDto,
} from '../swagger/api-response.dto';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateReviewWordSetDto } from './dto/create-review-word-set.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { ReviewWordsQueryDto } from './dto/review-words-query.dto';
import { StudentDto } from './dto/student.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
@ApiTags('Teacher Classes')
@ApiBearerAuth()
@Controller('teacher/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List classes owned by the teacher' })
  @ApiOkResponse({ type: [ClassSummaryResponseDto] })
  listClasses(@CurrentUser() user: AuthUserDto) {
    return this.classesService.listClasses(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a teacher class' })
  @ApiCreatedResponse({ type: ClassSummaryResponseDto })
  createClass(@CurrentUser() user: AuthUserDto, @Body() input: CreateClassDto) {
    return this.classesService.createClass(user.id, input);
  }

  @Get(':classId/review-words')
  @ApiOperation({ summary: 'List class words available for review set creation' })
  @ApiOkResponse({ type: [Object] })
  listClassReviewWords(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Query() query: ReviewWordsQueryDto,
  ) {
    return this.classesService.listClassReviewWords(user.id, classId, query);
  }

  @Post(':classId/review-word-sets')
  @ApiOperation({ summary: 'Create a review word set from class words' })
  @ApiCreatedResponse({ type: Object })
  createClassReviewWordSet(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Body() input: CreateReviewWordSetDto,
  ) {
    return this.classesService.createClassReviewWordSet(user.id, classId, input);
  }

  @Get(':classId')
  @ApiOperation({ summary: 'Get teacher class details' })
  @ApiOkResponse({ type: ClassDetailsResponseDto })
  getClassDetails(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
  ) {
    return this.classesService.getClassDetails(user.id, classId);
  }

  @Put(':classId')
  @ApiOperation({ summary: 'Update class overview fields' })
  @ApiOkResponse({ type: ClassDetailsResponseDto })
  updateClass(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Body() input: UpdateClassDto,
  ) {
    return this.classesService.updateClass(user.id, classId, input);
  }

  @Delete(':classId')
  @ApiOperation({ summary: 'Delete a teacher class' })
  @ApiOkResponse({ type: DeleteIdResponseDto })
  deleteClass(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
  ) {
    return this.classesService.deleteClass(user.id, classId);
  }

  @Post(':classId/students')
  @ApiOperation({ summary: 'Add a student to a teacher class' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  addStudent(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Body() input: StudentDto,
  ) {
    return this.classesService.addStudent(user.id, classId, input);
  }

  @Put(':classId/students/:studentId')
  @ApiOperation({ summary: 'Update a student in a teacher class' })
  @ApiOkResponse({ type: StudentResponseDto })
  updateStudent(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() input: StudentDto,
  ) {
    return this.classesService.updateStudent(
      user.id,
      classId,
      studentId,
      input,
    );
  }

  @Delete(':classId/students/:studentId')
  @ApiOperation({ summary: 'Remove a student from a teacher class' })
  @ApiOkResponse({ type: DeleteStudentResponseDto })
  removeStudent(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.removeStudent(user.id, classId, studentId);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
@ApiTags('Student Classes')
@ApiBearerAuth()
@Controller('student/classes')
export class StudentClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'List classes joined by the student' })
  @ApiOkResponse({ type: [StudentClassResponseDto] })
  listClasses(@CurrentUser() user: AuthUserDto) {
    return this.classesService.listStudentClasses(user.id);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a class by invite code' })
  @ApiCreatedResponse({ type: StudentClassResponseDto })
  joinClass(@CurrentUser() user: AuthUserDto, @Body() input: JoinClassDto) {
    return this.classesService.joinClass(user.id, input);
  }
}
