import { Module } from '@nestjs/common';
import { WordSetsController } from './word-sets.controller';
import { WordSetsService } from './word-sets.service';

@Module({
  controllers: [WordSetsController],
  providers: [WordSetsService],
  exports: [WordSetsService],
})
export class WordSetsModule {}
