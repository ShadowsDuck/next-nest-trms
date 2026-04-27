import { Injectable } from '@nestjs/common';
import {
  CourseAttachmentDeleteInput,
  CourseAttachmentStorage,
  CourseAttachmentUploadInput,
  CourseAttachmentUploadResult,
} from './course-attachment-storage.contract';

@Injectable()
export class OneDriveCourseAttachmentStorageService implements CourseAttachmentStorage {
  // เตรียมจุดเชื่อมต่ออัปโหลดไฟล์ผ่าน OneDrive สำหรับงานใน T2
  async uploadAttachment(
    _input: CourseAttachmentUploadInput,
  ): Promise<CourseAttachmentUploadResult> {
    throw new Error('OneDrive upload is not implemented yet');
  }

  // เตรียมจุดเชื่อมต่อลบไฟล์บน OneDrive สำหรับงานใน T2
  async deleteAttachment(_input: CourseAttachmentDeleteInput): Promise<void> {
    throw new Error('OneDrive delete is not implemented yet');
  }
}
