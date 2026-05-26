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
}
