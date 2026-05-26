import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { PrismaModule } from './prisma/prisma.module';
import { WordSetsModule } from './word-sets/word-sets.module';

@Module({
  imports: [PrismaModule, AuthModule, ClassesModule, WordSetsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
