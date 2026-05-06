import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { COURSE_ATTACHMENT_STORAGE } from './storage/course-attachment-storage.contract';
import { OneDriveCourseAttachmentStorageService } from './storage/onedrive-course-attachment-storage.service';

@Module({
  imports: [AuditLogsModule],
  controllers: [CoursesController],
  providers: [
    CoursesService,
    OneDriveCourseAttachmentStorageService,
    {
      provide: COURSE_ATTACHMENT_STORAGE,
      useExisting: OneDriveCourseAttachmentStorageService,
    },
  ],
  exports: [CoursesService, COURSE_ATTACHMENT_STORAGE],
})
export class CoursesModule {}
