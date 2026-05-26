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
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthUserDto } from '../auth/types';
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
@Controller('teacher/word-sets')
export class WordSetsController {
  constructor(private readonly wordSetsService: WordSetsService) {}

  @Get()
  listWordSets(@CurrentUser() user: AuthUserDto) {
    return this.wordSetsService.listWordSets(user.id);
  }

  @Post()
  createWordSet(
    @CurrentUser() user: AuthUserDto,
    @Body() input: CreateWordSetDto,
  ) {
    return this.wordSetsService.createWordSet(user.id, input);
  }

  @Get(':wordSetId')
  getWordSetDetails(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
  ) {
    return this.wordSetsService.getWordSetDetails(user.id, wordSetId);
  }

  @Put(':wordSetId')
  updateWordSet(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Body() input: UpdateWordSetDto,
  ) {
    return this.wordSetsService.updateWordSet(user.id, wordSetId, input);
  }

  @Delete(':wordSetId')
  deleteWordSet(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
  ) {
    return this.wordSetsService.deleteWordSet(user.id, wordSetId);
  }

  @Post(':wordSetId/words')
  addWords(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Body() input: AddWordsDto,
  ) {
    return this.wordSetsService.addWords(user.id, wordSetId, input);
  }

  @Put(':wordSetId/words/:wordId')
  updateWord(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Param('wordId') wordId: string,
    @Body() input: WordInputDto,
  ) {
    return this.wordSetsService.updateWord(user.id, wordSetId, wordId, input);
  }

  @Delete(':wordSetId/words/:wordId')
  deleteWord(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Param('wordId') wordId: string,
  ) {
    return this.wordSetsService.deleteWord(user.id, wordSetId, wordId);
  }

  @Post(':wordSetId/words/bulk-delete')
  bulkDeleteWords(
    @CurrentUser() user: AuthUserDto,
    @Param('wordSetId') wordSetId: string,
    @Body() input: BulkDeleteWordsDto,
  ) {
    return this.wordSetsService.bulkDeleteWords(user.id, wordSetId, input);
  }
}
