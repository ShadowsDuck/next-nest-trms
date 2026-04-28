export type CourseAttachmentKind = 'accreditation' | 'attendance';

export interface CourseAttachmentUploadInput {
  kind: CourseAttachmentKind;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
  // ชื่อหลักสูตรสำหรับใช้สร้าง Dynamic Folder ใน OneDrive
  courseName: string;
  // วันที่เริ่มหลักสูตรสำหรับใช้คำนวณปี พ.ศ. และสร้าง Dynamic Folder
  startDate: Date | string;
}

export interface CourseAttachmentUploadResult {
  provider: 'onedrive';
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  webViewLink: string | null;
  filePath: string | null;
}

export interface CourseAttachmentDeleteInput {
  fileId: string;
}

export interface CourseAttachmentStorage {
  uploadAttachment(
    input: CourseAttachmentUploadInput,
  ): Promise<CourseAttachmentUploadResult>;
  deleteAttachment(input: CourseAttachmentDeleteInput): Promise<void>;
}

export const COURSE_ATTACHMENT_STORAGE = Symbol('COURSE_ATTACHMENT_STORAGE');
