import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ example: 'cmat1teacher0001' })
  id!: string;

  @ApiProperty({ example: 'Teacher Demo' })
  name!: string;

  @ApiProperty({ example: 'teacher@example.com' })
  email!: string;

  @ApiProperty({ enum: ['teacher', 'student'], example: 'teacher' })
  role!: 'teacher' | 'student';
}

export class AuthSessionResponseDto {
  @ApiProperty({ type: AuthUserResponseDto })
  user!: AuthUserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;
}

export class DeleteIdResponseDto {
  @ApiProperty({ example: 'cmat1class0001' })
  id!: string;
}

export class DeleteStudentResponseDto {
  @ApiProperty({ example: 'cmat1student0001' })
  studentId!: string;
}

export class DeleteWordResponseDto {
  @ApiProperty({ example: 'cmat1word0001' })
  wordId!: string;
}

export class BulkDeleteWordsResponseDto {
  @ApiProperty({ example: ['cmat1word0001', 'cmat1word0002'] })
  wordIds!: string[];
}

export class ClassSummaryResponseDto {
  @ApiProperty({ example: 'cmat1class0001' })
  id!: string;

  @ApiProperty({ example: 'English A2' })
  name!: string;

  @ApiProperty({ example: 12 })
  students!: number;

  @ApiProperty({ example: 2 })
  wordSets!: number;

  @ApiProperty({ example: 48 })
  progress!: number;
}

export class StudentResponseDto {
  @ApiProperty({ example: 'cmat1student0001' })
  id!: string;

  @ApiProperty({ example: 'Student Demo' })
  name!: string;

  @ApiProperty({ example: 'student@example.com' })
  email!: string;

  @ApiProperty({ example: 42 })
  progress!: number;

  @ApiProperty({ example: 8 })
  correctAnswers!: number;

  @ApiProperty({ example: 3 })
  wrongAnswers!: number;

  @ApiPropertyOptional({
    example: '2026-05-26T10:00:00.000Z',
    nullable: true,
  })
  lastPracticedAt!: string | null;
}

export class AssignedWordSetResponseDto {
  @ApiProperty({ example: 'cmat1assignment0001' })
  id!: string;

  @ApiProperty({ example: 'cmat1class0001' })
  classId!: string;

  @ApiProperty({ example: 'English A2' })
  className!: string;

  @ApiProperty({ example: 'Travel vocabulary' })
  title!: string;

  @ApiProperty({ example: 15 })
  words!: number;

  @ApiProperty({ example: 7 })
  completedWords!: number;

  @ApiProperty({ example: 47 })
  progress!: number;

  @ApiProperty({ example: 'No due date' })
  dueLabel!: string;
}

export class ProblemWordResponseDto {
  @ApiProperty({ example: 'cmat1word0001' })
  id!: string;

  @ApiProperty({ example: 'journey' })
  term!: string;

  @ApiProperty({ example: 'подорож' })
  translation!: string;

  @ApiProperty({ example: 5 })
  wrongAnswers!: number;

  @ApiProperty({ example: 2 })
  correctAnswers!: number;

  @ApiProperty({ example: 3 })
  affectedStudents!: number;
}

export class ReviewWordResponseDto {
  @ApiProperty({ example: 'cmat1word0001' })
  wordId!: string;

  @ApiProperty({ example: 'arrive' })
  term!: string;

  @ApiProperty({ example: 'to arrive' })
  translation!: string;

  @ApiPropertyOptional({ example: 'uh-RYV', nullable: true })
  transcription!: string | null;

  @ApiProperty({ example: 'We arrive at the airport at 9 AM.' })
  exampleSentence!: string;

  @ApiProperty({ example: 'cmat1wordset0001' })
  sourceWordSetId!: string;

  @ApiProperty({ example: 'Travel Basics' })
  sourceWordSetTitle!: string;

  @ApiProperty({ example: 3 })
  wrongAnswers!: number;

  @ApiProperty({ example: 2 })
  correctAnswers!: number;

  @ApiProperty({ example: 2 })
  affectedStudents!: number;

  @ApiProperty({ example: 60 })
  wrongRate!: number;
}

export class ClassAssignedWordSetResponseDto {
  @ApiProperty({ example: 'cmat1assignment0001' })
  id!: string;

  @ApiProperty({ example: 'cmat1class0001' })
  classId!: string;

  @ApiProperty({ example: 'Travel vocabulary' })
  title!: string;

  @ApiProperty({ example: 'Words for airport and hotel situations.' })
  description!: string;

  @ApiProperty({ example: 15 })
  words!: number;

  @ApiProperty({ example: 12 })
  assignedStudents!: number;

  @ApiProperty({ example: 48 })
  averageProgress!: number;
}

export class ClassDetailsResponseDto extends ClassSummaryResponseDto {
  @ApiProperty({ example: 'A2-7KQ9' })
  inviteCode!: string;

  @ApiProperty({ example: 'A2' })
  level!: string;

  @ApiProperty({ example: 'General English vocabulary group.' })
  description!: string;

  @ApiProperty({ type: [StudentResponseDto] })
  studentsList!: StudentResponseDto[];

  @ApiProperty({ type: [ClassAssignedWordSetResponseDto] })
  wordSetsList!: ClassAssignedWordSetResponseDto[];

  @ApiProperty({ type: [ProblemWordResponseDto] })
  problemWords!: ProblemWordResponseDto[];
}

export class StudentClassResponseDto {
  @ApiProperty({ example: 'cmat1class0001' })
  id!: string;

  @ApiProperty({ example: 'English A2' })
  name!: string;

  @ApiProperty({ example: 'Teacher Demo' })
  teacherName!: string;

  @ApiProperty({ example: 'A2' })
  level!: string;

  @ApiProperty({ example: 48 })
  progress!: number;

  @ApiProperty({ type: [AssignedWordSetResponseDto] })
  wordSets!: AssignedWordSetResponseDto[];
}

export class WordSetSummaryResponseDto {
  @ApiProperty({ example: 'cmat1wordset0001' })
  id!: string;

  @ApiProperty({ example: 'Travel vocabulary' })
  title!: string;

  @ApiProperty({ example: 'Words for airport and hotel situations.' })
  description!: string;

  @ApiProperty({ example: 15 })
  words!: number;

  @ApiProperty({ example: 2 })
  assignedClasses!: number;
}

export class WordResponseDto {
  @ApiProperty({ example: 'cmat1word0001' })
  id!: string;

  @ApiProperty({ example: 'journey' })
  term!: string;

  @ApiProperty({ example: 'подорож' })
  translation!: string;

  @ApiProperty({ example: 'The journey took three hours.' })
  exampleSentence!: string;

  @ApiPropertyOptional({ example: '/ˈdʒɜːrni/', nullable: true })
  transcription?: string | null;

  @ApiProperty({ example: 67 })
  masteryLevel!: number;

  @ApiProperty({ example: 4 })
  correctAnswers!: number;

  @ApiProperty({ example: 2 })
  wrongAnswers!: number;
}

export class WordSetDetailsResponseDto {
  @ApiProperty({ example: 'cmat1wordset0001' })
  id!: string;

  @ApiProperty({ example: 'cmat1class0001' })
  classId!: string;

  @ApiProperty({ example: 'English A2' })
  className!: string;

  @ApiProperty({ example: 'Travel vocabulary' })
  title!: string;

  @ApiProperty({ example: 'Words for airport and hotel situations.' })
  description!: string;

  @ApiProperty({ example: 15 })
  words!: number;

  @ApiProperty({ example: 12 })
  assignedStudents!: number;

  @ApiProperty({ example: 48 })
  averageProgress!: number;

  @ApiProperty({ example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: [WordResponseDto] })
  wordsList!: WordResponseDto[];
}

export class AssignmentResponseDto {
  @ApiProperty({ example: 'cmat1assignment0001' })
  id!: string;

  @ApiProperty({ example: 'cmat1class0001' })
  classId!: string;

  @ApiProperty({ example: 'cmat1wordset0001' })
  wordSetId!: string;

  @ApiProperty({ example: '2026-05-26T10:00:00.000Z' })
  assignedAt!: string;
}

export class CreateReviewWordSetResponseDto {
  @ApiProperty({ type: WordSetSummaryResponseDto })
  wordSet!: WordSetSummaryResponseDto;

  @ApiPropertyOptional({ type: AssignmentResponseDto, nullable: true })
  assignment!: AssignmentResponseDto | null;
}

export class PracticeWordResultResponseDto {
  @ApiProperty({ example: 'cmat1word0001' })
  wordId!: string;

  @ApiProperty({ example: 1 })
  correctAnswers!: number;

  @ApiProperty({ example: 0 })
  wrongAnswers!: number;
}

export class PracticeSessionResultResponseDto {
  @ApiProperty({ example: 'cmat1assignment0001' })
  assignmentId!: string;

  @ApiProperty({ example: 'cmat1student0001' })
  studentId!: string;

  @ApiProperty({
    enum: ['flashcard', 'multiple_choice', 'writing'],
    example: 'multiple_choice',
  })
  mode!: 'flashcard' | 'multiple_choice' | 'writing';

  @ApiProperty({ example: 8 })
  correctAnswers!: number;

  @ApiProperty({ example: 2 })
  wrongAnswers!: number;

  @ApiProperty({ type: [PracticeWordResultResponseDto] })
  wordResults!: PracticeWordResultResponseDto[];
}

export class StudentProgressWordResponseDto {
  @ApiProperty({ example: 'cmat1word0001' })
  id!: string;

  @ApiProperty({ example: 'cmat1assignment0001' })
  assignmentId!: string;

  @ApiProperty({ example: 'journey' })
  term!: string;

  @ApiProperty({ example: 'подорож' })
  translation!: string;

  @ApiProperty({ example: 67 })
  masteryLevel!: number;

  @ApiProperty({ example: 4 })
  correctCount!: number;

  @ApiProperty({ example: 2 })
  wrongCount!: number;

  @ApiPropertyOptional({
    example: '2026-05-26T10:00:00.000Z',
    nullable: true,
  })
  lastPracticedAt!: string | null;
}

export class TeacherAnalyticsResponseDto {
  @ApiProperty({ example: 18 })
  totalStudents!: number;

  @ApiProperty({ example: 4 })
  totalWordSets!: number;

  @ApiProperty({ example: 52 })
  averageProgress!: number;

  @ApiProperty({ type: [ClassDetailsResponseDto] })
  classProgress!: ClassDetailsResponseDto[];

  @ApiProperty({ type: [ProblemWordResponseDto] })
  problemWords!: ProblemWordResponseDto[];
}
