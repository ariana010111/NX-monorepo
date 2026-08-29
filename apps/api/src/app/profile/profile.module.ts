import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository, PrismaProfileRepository } from './profile.repository';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, { provide: ProfileRepository, useClass: PrismaProfileRepository }],
  exports: [ProfileService],
})
export class ProfileModule {}
