import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CourseAttachmentDeleteInput,
  CourseAttachmentStorage,
  CourseAttachmentUploadInput,
  CourseAttachmentUploadResult,
} from './course-attachment-storage.contract';
import {
  toAttachmentUploadResult,
  toOneDriveDeleteRequest,
  toOneDriveUploadRequest,
} from './onedrive-course-attachment.contract';

interface OneDriveUploadApiResponse {
  id?: string;
  name?: string;
  size?: number;
  webUrl?: string;
  parentReference?: {
    path?: string;
  };
}

interface OneDriveCreateChildResponse {
  id?: string;
  name?: string;
}

interface OneDriveTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface OneDriveApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

@Injectable()
export class OneDriveCourseAttachmentStorageService implements CourseAttachmentStorage {
  constructor(private readonly configService: ConfigService) {}

  // อัปโหลดไฟล์แนบหลักสูตรขึ้น OneDrive แล้วคืนค่า metadata กลางของระบบ
  async uploadAttachment(
    input: CourseAttachmentUploadInput,
  ): Promise<CourseAttachmentUploadResult> {
    const request = toOneDriveUploadRequest(input);
    const accessToken = await this.getAccessToken();
    const folderId = this.getRequiredEnv('ONEDRIVE_FOLDER_ID');
    const storedFileName = this.buildStoredFileName(
      input.kind,
      request.fileName,
    );
    const contentType = request.mimeType.trim() || 'application/octet-stream';

    const folderPath = this.buildCourseFolderPath(
      input.courseName,
      input.startDate,
    );
    const encodedFolderPath = folderPath
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    const encodedUploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${encodedFolderPath}/${encodeURIComponent(storedFileName)}:/content`;
    let response = await this.uploadBinary(
      encodedUploadUrl,
      accessToken,
      contentType,
      request.buffer,
    );

    if (!response.ok) {
      const parsedError = await this.readErrorPayload(response);
      if (parsedError.error?.code === 'invalidRequest') {
        const plainUploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${folderPath}/${storedFileName}:/content`;
        response = await this.uploadBinary(
          plainUploadUrl,
          accessToken,
          contentType,
          request.buffer,
        );

        if (!response.ok) {
          const childFileId = await this.createChildFile(
            folderId,
            storedFileName,
            accessToken,
          );
          response = await this.uploadBinaryToItem(
            childFileId,
            accessToken,
            contentType,
            request.buffer,
          );
        }
      } else {
        throw new InternalServerErrorException(
          `OneDrive upload failed: ${this.toErrorMessage(parsedError, response)}`,
        );
      }
    }

    if (!response.ok) {
      const parsedError = await this.readErrorPayload(response);
      throw new InternalServerErrorException(
        `OneDrive upload failed: ${this.toErrorMessage(parsedError, response)}`,
      );
    }

    const payload = await this.parseJson<OneDriveUploadApiResponse>(response);
    const fileId = payload.id;

    if (!fileId) {
      throw new InternalServerErrorException(
        'OneDrive upload failed: missing file id in response',
      );
    }

    const fileName = payload.name ?? storedFileName;
    const filePath = payload.parentReference?.path
      ? `${payload.parentReference.path}/${fileName}`
      : fileName;

    return toAttachmentUploadResult({
      fileId,
      fileName,
      mimeType: request.mimeType,
      fileSize:
        typeof payload.size === 'number' ? payload.size : request.fileSize,
      webViewLink: payload.webUrl ?? null,
      filePath,
    });
  }

  // ลบไฟล์แนบหลักสูตรจาก OneDrive ด้วย file id ที่ระบบเก็บไว้
  async deleteAttachment(input: CourseAttachmentDeleteInput): Promise<void> {
    const request = toOneDriveDeleteRequest(input);
    const accessToken = await this.getAccessToken();
    const deleteUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${request.fileId}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 404) {
      return;
    }

    if (!response.ok) {
      const errorMessage = await this.readErrorMessage(response);
      throw new InternalServerErrorException(
        `OneDrive delete failed: ${errorMessage}`,
      );
    }
  }

  // ขอ access token จาก Microsoft OAuth ด้วย refresh token ของบัญชีกลาง
  private async getAccessToken(): Promise<string> {
    const clientId = this.getRequiredEnv('ONEDRIVE_CLIENT_ID');
    const clientSecret = this.getRequiredEnv('ONEDRIVE_CLIENT_SECRET');
    const refreshToken = this.getRequiredEnv('ONEDRIVE_REFRESH_TOKEN');
    const scope =
      this.configService.get<string>('ONEDRIVE_SCOPE') ??
      'offline_access Files.ReadWrite';

    const tokenEndpoint =
      this.configService.get<string>('ONEDRIVE_TOKEN_ENDPOINT') ??
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const payload = await this.parseJson<OneDriveTokenResponse>(response);

    if (!response.ok || !payload.access_token) {
      const details =
        payload.error_description ?? payload.error ?? 'unknown error';
      throw new InternalServerErrorException(
        `OneDrive auth failed: ${details}`,
      );
    }

    return payload.access_token;
  }

  // อ่านค่า environment ที่จำเป็นและหยุดทันทีเมื่อยังไม่ได้ตั้งค่า
  private getRequiredEnv(key: string): string {
    const rawValue = this.configService.get<string>(key);
    const value = rawValue?.trim();
    if (!value) {
      throw new InternalServerErrorException(`Missing required env: ${key}`);
    }

    return value;
  }

  // สร้าง Path ของโฟลเดอร์สำหรับเก็บไฟล์คอร์สโดยเฉพาะ (รูปแบบ: ปีพ.ศ./วัน-เดือน-ปี-ชื่อคอร์ส)
  private buildCourseFolderPath(
    courseName: string,
    startDate: Date | string,
  ): string {
    const dateObj =
      typeof startDate === 'string' ? new Date(startDate) : startDate;
    const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

    const beYear = validDate.getFullYear() + 543;
    const day = String(validDate.getDate()).padStart(2, '0');
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const formattedDate = `${day}-${month}-${beYear}`;

    const sanitizedName = courseName.replace(/[\\/:*?"<>|]/g, '_').trim();
    const safeName = sanitizedName.length > 0 ? sanitizedName : 'Course';

    return `${beYear}/${formattedDate}-${safeName}`;
  }

  // แปลงชื่อไฟล์ให้ปลอดภัยและเติม prefix เพื่อเลี่ยงชื่อชนกันในโฟลเดอร์เดียวกัน
  private buildStoredFileName(kind: string, originalName: string): string {
    const sanitizedName = originalName.replace(/[\\/:*?"<>|]/g, '_').trim();
    const safeName =
      sanitizedName.length > 0 ? sanitizedName : 'attachment.bin';
    const timestamp = Date.now();
    return `${kind}-${timestamp}-${safeName}`;
  }

  // ส่งคำขออัปโหลดไบนารีไปยัง Microsoft Graph ตาม URL เป้าหมาย
  private async uploadBinary(
    uploadUrl: string,
    accessToken: string,
    contentType: string,
    buffer: Buffer,
  ): Promise<Response> {
    return await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body: new Uint8Array(buffer),
    });
  }

  // ส่งคำขออัปโหลดไบนารีไปยัง item id ที่สร้างไว้แล้วบน OneDrive
  private async uploadBinaryToItem(
    itemId: string,
    accessToken: string,
    contentType: string,
    buffer: Buffer,
  ): Promise<Response> {
    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`;
    return await this.uploadBinary(uploadUrl, accessToken, contentType, buffer);
  }

  // สร้างไฟล์เปล่าใต้โฟลเดอร์ปลายทางเพื่อใช้เป็น fallback ก่อนอัปโหลดเนื้อหา
  private async createChildFile(
    folderId: string,
    fileName: string,
    accessToken: string,
  ): Promise<string> {
    const createUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: fileName,
        file: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    });

    if (!response.ok) {
      const parsedError = await this.readErrorPayload(response);
      throw new InternalServerErrorException(
        `OneDrive upload failed: ${this.toErrorMessage(parsedError, response)}`,
      );
    }

    const payload = await this.parseJson<OneDriveCreateChildResponse>(response);
    const fileId = payload.id?.trim();
    if (!fileId) {
      throw new InternalServerErrorException(
        'OneDrive upload failed: missing file id from create child response',
      );
    }

    return fileId;
  }

  // อ่าน payload error ของ Microsoft Graph เพื่อใช้ตัดสินใจ retry และแสดงผล
  private async readErrorPayload(
    response: Response,
  ): Promise<OneDriveApiErrorResponse> {
    try {
      return await this.parseJson<OneDriveApiErrorResponse>(response);
    } catch {
      return {};
    }
  }

  // แปลง error payload ของ Graph ให้เป็นข้อความที่อ่านง่ายพร้อมสถานะตอบกลับ
  private toErrorMessage(
    payload: OneDriveApiErrorResponse,
    response: Response,
  ): string {
    const code = payload.error?.code?.trim();
    const message = payload.error?.message?.trim();

    if (code && message) {
      return `${code}: ${message}`;
    }
    if (message) {
      return message;
    }

    return `${response.status} ${response.statusText}`;
  }

  // อ่านข้อความผิดพลาดจาก response ของ OneDrive ให้พร้อมใช้งานใน log/exception
  private async readErrorMessage(response: Response): Promise<string> {
    try {
      const payload = await this.parseJson<OneDriveApiErrorResponse>(response);
      return this.toErrorMessage(payload, response);
    } catch {
      return `${response.status} ${response.statusText}`;
    }
  }

  // แปลง response เป็น JSON แบบ type-safe สำหรับใช้ใน service นี้
  private async parseJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }
}
