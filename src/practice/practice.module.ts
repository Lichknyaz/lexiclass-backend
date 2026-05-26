import { Module } from '@nestjs/common';
import {
  PracticeController,
  StudentProgressController,
} from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  controllers: [PracticeController, StudentProgressController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
