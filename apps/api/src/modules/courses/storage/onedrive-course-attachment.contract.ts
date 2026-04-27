import {
  CourseAttachmentDeleteInput,
  CourseAttachmentUploadInput,
  CourseAttachmentUploadResult,
} from './course-attachment-storage.contract';

export interface OneDriveUploadRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
}

export interface OneDriveUploadResponse {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  webViewLink: string | null;
  filePath: string | null;
}

export interface OneDriveDeleteRequest {
  fileId: string;
}

export interface OneDriveCourseAttachmentProvider {
  upload(request: OneDriveUploadRequest): Promise<OneDriveUploadResponse>;
  delete(request: OneDriveDeleteRequest): Promise<void>;
}

// แปลงข้อมูลแนบหลักสูตรเป็นคำขออัปโหลดของ OneDrive
export function toOneDriveUploadRequest(
  input: CourseAttachmentUploadInput,
): OneDriveUploadRequest {
  return {
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    buffer: input.buffer,
  };
}

// แปลงผลลัพธ์อัปโหลด OneDrive ให้เป็นรูปแบบ metadata กลางของระบบ
export function toAttachmentUploadResult(
  response: OneDriveUploadResponse,
): CourseAttachmentUploadResult {
  return {
    provider: 'onedrive',
    fileId: response.fileId,
    fileName: response.fileName,
    mimeType: response.mimeType,
    fileSize: response.fileSize,
    webViewLink: response.webViewLink,
    filePath: response.filePath,
  };
}

// แปลงคำขอลบไฟล์จากระบบเป็นรูปแบบคำขอ OneDrive
export function toOneDriveDeleteRequest(
  input: CourseAttachmentDeleteInput,
): OneDriveDeleteRequest {
  return {
    fileId: input.fileId,
  };
}
