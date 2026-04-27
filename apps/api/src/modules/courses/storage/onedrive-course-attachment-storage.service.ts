import { InternalServerErrorException, Injectable } from '@nestjs/common';
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

interface OneDriveTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

@Injectable()
export class OneDriveCourseAttachmentStorageService
  implements CourseAttachmentStorage
{
  constructor(private readonly configService: ConfigService) {}

  // อัปโหลดไฟล์แนบหลักสูตรขึ้น OneDrive แล้วคืนค่า metadata กลางของระบบ
  async uploadAttachment(
    input: CourseAttachmentUploadInput,
  ): Promise<CourseAttachmentUploadResult> {
    const request = toOneDriveUploadRequest(input);
    const accessToken = await this.getAccessToken();
    const folderId = this.getRequiredEnv('ONEDRIVE_FOLDER_ID');
    const storedFileName = this.buildStoredFileName(input.kind, request.fileName);

    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${encodeURIComponent(storedFileName)}:/content`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': request.mimeType,
      },
      body: new Uint8Array(request.buffer),
    });

    if (!response.ok) {
      const errorMessage = await this.readErrorMessage(response);
      throw new InternalServerErrorException(
        `OneDrive upload failed: ${errorMessage}`,
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
      fileSize: typeof payload.size === 'number' ? payload.size : request.fileSize,
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
      const details = payload.error_description ?? payload.error ?? 'unknown error';
      throw new InternalServerErrorException(
        `OneDrive auth failed: ${details}`,
      );
    }

    return payload.access_token;
  }

  // อ่านค่า environment ที่จำเป็นและหยุดทันทีเมื่อยังไม่ได้ตั้งค่า
  private getRequiredEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(
        `Missing required env: ${key}`,
      );
    }

    return value;
  }

  // แปลงชื่อไฟล์ให้ปลอดภัยและเติม prefix เพื่อเลี่ยงชื่อชนกันในโฟลเดอร์เดียวกัน
  private buildStoredFileName(kind: string, originalName: string): string {
    const sanitizedName = originalName.replace(/[\\/:*?"<>|]/g, '_').trim();
    const safeName = sanitizedName.length > 0 ? sanitizedName : 'attachment.bin';
    const timestamp = Date.now();
    return `${kind}-${timestamp}-${safeName}`;
  }

  // อ่านข้อความผิดพลาดจาก response ของ OneDrive ให้พร้อมใช้งานใน log/exception
  private async readErrorMessage(response: Response): Promise<string> {
    try {
      const payload = await this.parseJson<{
        error?: {
          message?: string;
        };
      }>(response);
      return payload.error?.message ?? `${response.status} ${response.statusText}`;
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

