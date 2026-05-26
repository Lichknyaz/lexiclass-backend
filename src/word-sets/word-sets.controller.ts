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
  BulkDeleteWordsResponseDto,
  DeleteIdResponseDto,
  DeleteWordResponseDto,
  WordResponseDto,
  WordSetDetailsResponseDto,
  WordSetSummaryResponseDto,
} from '../swagger/api-response.dto';
import { CreateWordSetDto } from './dto/create-word-set.dto';
import { UpdateWordSetDto } from './dto/update-word-set.dto';
import {
  AddWordsDto,
  BulkDeleteWordsDto,
  WordInputDto,
} from './dto/word.dto';
import { WordSetsService } from './word-sets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
@ApiTags('Word Sets')
@ApiBearerAuth()
@Controller('teacher/word-sets')
export class WordSetsController {
  constructor(private readonly wordSetsService: WordSetsService) {}

  @Get()
  @ApiOperation({ summary: 'List word sets owned by the teacher' })
  @ApiOkResponse({ type: [WordSetSummaryResponseDto] })
  listWordSets(@CurrentUser() user: AuthUserDto) {
    return this.wordSetsService.listWordSets(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a teacher word set' })
  @ApiCreatedResponse({ type: WordSetSummaryResponseDto })
  createWordSet(
    @CurrentUser() user: AuthUserDto,
    @Body() input: CreateWordSetDto,
  ) {
    return this.wordSetsService.createWordSet(user.id, input);
  }

  @Get(':wordSetId')
  @ApiOperation({ summary: 'Get teacher word-set details' })
  @ApiOkResponse({ type: WordSetDetailsResponseDto })
  getWordSetDetails(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
  ) {
    return this.wordSetsService.getWordSetDetails(user.id, wordSetId);
  }

  @Put(':wordSetId')
  @ApiOperation({ summary: 'Update a teacher word set' })
  @ApiOkResponse({ type: WordSetDetailsResponseDto })
  updateWordSet(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Body() input: UpdateWordSetDto,
  ) {
    return this.wordSetsService.updateWordSet(user.id, wordSetId, input);
  }

  @Delete(':wordSetId')
  @ApiOperation({ summary: 'Delete a teacher word set' })
  @ApiOkResponse({ type: DeleteIdResponseDto })
  deleteWordSet(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
  ) {
    return this.wordSetsService.deleteWordSet(user.id, wordSetId);
  }

  @Post(':wordSetId/words')
  @ApiOperation({ summary: 'Add words to a teacher word set' })
  @ApiCreatedResponse({ type: [WordResponseDto] })
  addWords(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Body() input: AddWordsDto,
  ) {
    return this.wordSetsService.addWords(user.id, wordSetId, input);
  }

  @Put(':wordSetId/words/:wordId')
  @ApiOperation({ summary: 'Update a word in a teacher word set' })
  @ApiOkResponse({ type: WordResponseDto })
  updateWord(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Param('wordId') wordId: string,
    @Body() input: WordInputDto,
  ) {
    return this.wordSetsService.updateWord(user.id, wordSetId, wordId, input);
  }

  @Delete(':wordSetId/words/:wordId')
  @ApiOperation({ summary: 'Delete a word from a teacher word set' })
  @ApiOkResponse({ type: DeleteWordResponseDto })
  deleteWord(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Param('wordId') wordId: string,
  ) {
    return this.wordSetsService.deleteWord(user.id, wordSetId, wordId);
  }

  @Post(':wordSetId/words/bulk-delete')
  @ApiOperation({ summary: 'Delete multiple words from a teacher word set' })
  @ApiOkResponse({ type: BulkDeleteWordsResponseDto })
  bulkDeleteWords(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Body() input: BulkDeleteWordsDto,
  ) {
    return this.wordSetsService.bulkDeleteWords(user.id, wordSetId, input);
  }
}
