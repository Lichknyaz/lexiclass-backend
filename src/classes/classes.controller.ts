import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUserDto } from '../auth/types';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
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
  listClasses(@CurrentUser() user: AuthUserDto) {
    return this.classesService.listClasses(user.id);
  }

  @Post()
  createClass(@CurrentUser() user: AuthUserDto, @Body() input: CreateClassDto) {
    return this.classesService.createClass(user.id, input);
  }

  @Get(':classId')
  getClassDetails(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
  ) {
    return this.classesService.getClassDetails(user.id, classId);
  }

  @Put(':classId')
  updateClass(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Body() input: UpdateClassDto,
  ) {
    return this.classesService.updateClass(user.id, classId, input);
  }

  @Delete(':classId')
  deleteClass(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
  ) {
    return this.classesService.deleteClass(user.id, classId);
  }

  @Post(':classId/students')
  addStudent(
    @CurrentUser() user: AuthUserDto,
    @Param('classId') classId: string,
    @Body() input: StudentDto,
  ) {
    return this.classesService.addStudent(user.id, classId, input);
  }

  @Put(':classId/students/:studentId')
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
  listClasses(@CurrentUser() user: AuthUserDto) {
    return this.classesService.listStudentClasses(user.id);
  }

  @Post('join')
  joinClass(@CurrentUser() user: AuthUserDto, @Body() input: JoinClassDto) {
    return this.classesService.joinClass(user.id, input);
  }
}
