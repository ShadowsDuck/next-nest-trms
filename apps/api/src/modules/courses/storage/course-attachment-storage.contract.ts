export type CourseAttachmentKind = 'accreditation' | 'attendance';

export interface CourseAttachmentUploadInput {
  kind: CourseAttachmentKind;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
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
