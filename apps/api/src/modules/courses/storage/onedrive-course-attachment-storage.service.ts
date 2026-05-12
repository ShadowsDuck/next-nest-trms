import { env } from '../../../env';
import {
  CourseAttachmentDeleteInput,
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
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface OneDriveApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

// แคช access token เพื่อลดจำนวน OAuth request ซ้ำซ้อน
let cachedToken: { token: string; expiresAt: number } | null = null;
// แคช folder ID ด้วย Promise dedup เพื่อป้องกัน request ซ้ำจาก parallel upload
const folderCache = new Map<string, Promise<string>>();

// อัปโหลดไฟล์แนบหลักสูตรขึ้น OneDrive แล้วคืนค่า metadata กลางของระบบ
export async function uploadAttachment(
  input: CourseAttachmentUploadInput,
): Promise<CourseAttachmentUploadResult> {
  const request = toOneDriveUploadRequest(input);
  const accessToken = await getAccessToken();
  const folderId = env.ONEDRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error('Missing required env: ONEDRIVE_FOLDER_ID');
  }
  const storedFileName = buildStoredFileName(input.kind, request.fileName);
  const contentType = request.mimeType.trim() || 'application/octet-stream';

  const folderNames = buildCourseFolderNames(input.courseName, input.startDate);

  // สร้าง/ค้นหาโฟลเดอร์ปี พ.ศ. และโฟลเดอร์หลักสูตรตามลำดับ
  const yearFolderId = await ensureFolderExists(
    folderId,
    folderNames.yearFolder,
    accessToken,
  );
  const courseFolderId = await ensureFolderExists(
    yearFolderId,
    folderNames.courseFolder,
    accessToken,
  );

  // สร้างไฟล์เปล่าแล้วอัปโหลดเนื้อหาเข้าไป (ใช้ item ID ตรง ๆ เร็วกว่า path-based URL)
  const childFileId = await createChildFile(
    courseFolderId,
    storedFileName,
    accessToken,
  );
  const response = await uploadBinaryToItem(
    childFileId,
    accessToken,
    contentType,
    request.buffer,
  );

  if (!response.ok) {
    const parsedError = await readErrorPayload(response);
    throw new Error(
      `OneDrive upload failed: ${toErrorMessage(parsedError, response)}`,
    );
  }

  const payload = await parseJson<OneDriveUploadApiResponse>(response);
  const fileId = payload.id;

  if (!fileId) {
    throw new Error('OneDrive upload failed: missing file id in response');
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
export async function deleteAttachment(
  input: CourseAttachmentDeleteInput,
): Promise<void> {
  const request = toOneDriveDeleteRequest(input);
  const accessToken = await getAccessToken();
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
    const errorMessage = await readErrorMessage(response);
    throw new Error(`OneDrive delete failed: ${errorMessage}`);
  }
}

// ขอ access token จาก Microsoft OAuth ด้วย refresh token ของบัญชีกลาง (แคชไว้จนกว่าจะหมดอายุ)
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = env.ONEDRIVE_CLIENT_ID;
  const clientSecret = env.ONEDRIVE_CLIENT_SECRET;
  const refreshToken = env.ONEDRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push('ONEDRIVE_CLIENT_ID');
    if (!clientSecret) missing.push('ONEDRIVE_CLIENT_SECRET');
    if (!refreshToken) missing.push('ONEDRIVE_REFRESH_TOKEN');
    throw new Error(`Missing required env: ${missing.join(', ')}`);
  }

  const scope = env.ONEDRIVE_SCOPE;
  const tokenEndpoint = env.ONEDRIVE_TOKEN_ENDPOINT;

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

  const payload = await parseJson<OneDriveTokenResponse>(response);

  if (!response.ok || !payload.access_token) {
    const details =
      payload.error_description ?? payload.error ?? 'unknown error';
    throw new Error(`OneDrive auth failed: ${details}`);
  }

  const expiresInMs = ((payload.expires_in ?? 3600) - 300) * 1000;
  cachedToken = {
    token: payload.access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  return payload.access_token;
}

// สร้าง Path ของโฟลเดอร์สำหรับเก็บไฟล์คอร์สโดยเฉพาะ (รูปแบบ: ปีพ.ศ./วัน-เดือน-ปี-ชื่อคอร์ส)
function buildCourseFolderNames(
  courseName: string,
  startDate: Date | string,
): { yearFolder: string; courseFolder: string } {
  const dateObj =
    typeof startDate === 'string' ? new Date(startDate) : startDate;
  const validDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const beYear = validDate.getFullYear() + 543;
  const day = String(validDate.getDate()).padStart(2, '0');
  const month = String(validDate.getMonth() + 1).padStart(2, '0');
  const formattedDate = `${day}-${month}-${beYear}`;

  const sanitizedName = courseName.replace(/[\\/:*?"<>|]/g, '_').trim();
  const safeName = sanitizedName.length > 0 ? sanitizedName : 'Course';

  return {
    yearFolder: `${beYear}`,
    courseFolder: `${formattedDate}-${safeName}`,
  };
}

// ตรวจสอบและสร้างโฟลเดอร์หากยังไม่มีอยู่ (ใช้ Promise cache เพื่อ dedup request ที่ยิงพร้อมกัน)
function ensureFolderExists(
  parentFolderId: string,
  folderName: string,
  accessToken: string,
): Promise<string> {
  const cacheKey = `${parentFolderId}:${folderName}`;
  const cached = folderCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const promise = resolveFolder(parentFolderId, folderName, accessToken);
  folderCache.set(cacheKey, promise);

  promise.catch(() => folderCache.delete(cacheKey));

  return promise;
}

// ค้นหาหรือสร้างโฟลเดอร์ใน OneDrive จริง ๆ (POST-first เพื่อลด call สำหรับ folder ใหม่)
async function resolveFolder(
  parentFolderId: string,
  folderName: string,
  accessToken: string,
): Promise<string> {
  // พยายามสร้างก่อน — ถ้า folder ใหม่จะสำเร็จทันทีใน 1 call
  const createUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'fail',
    }),
  });

  if (createRes.ok || createRes.status === 201) {
    const data = await parseJson<OneDriveUploadApiResponse>(createRes);
    if (data.id) return data.id;
  }

  // 409 = folder มีอยู่แล้ว → ดึง ID กลับมา
  if (createRes.status === 409) {
    const getUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}:/${encodeURIComponent(folderName)}:`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (getRes.ok) {
      const data = await parseJson<OneDriveUploadApiResponse>(getRes);
      if (data.id) return data.id;
    }
  }

  throw new Error(`Failed to ensure folder exists: ${folderName}`);
}

// แปลงชื่อไฟล์ให้ปลอดภัยและเติม prefix เพื่อเลี่ยงชื่อชนกันในโฟลเดอร์เดียวกัน
function buildStoredFileName(kind: string, originalName: string): string {
  const sanitizedName = originalName
    // ลบ control characters และ invisible Unicode ที่ OneDrive ไม่ยอมรับ
    .replace(
      // eslint-disable-next-line no-control-regex
      /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\uFEFF]/g,
      '',
    )
    .replace(/[\\/:*?"<>|]/g, '_')
    .trim();
  const safeName = sanitizedName.length > 0 ? sanitizedName : 'attachment.bin';
  const timestamp = Date.now();
  return `${kind}-${timestamp}-${safeName}`;
}

// ส่งคำขออัปโหลดไบนารีไปยัง Microsoft Graph ตาม URL เป้าหมาย
async function uploadBinary(
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
async function uploadBinaryToItem(
  itemId: string,
  accessToken: string,
  contentType: string,
  buffer: Buffer,
): Promise<Response> {
  const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`;
  return await uploadBinary(uploadUrl, accessToken, contentType, buffer);
}

// สร้างไฟล์เปล่าใต้โฟลเดอร์ปลายทางเพื่อใช้เป็น fallback ก่อนอัปโหลดเนื้อหา
async function createChildFile(
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
    const parsedError = await readErrorPayload(response);
    throw new Error(
      `OneDrive upload failed: ${toErrorMessage(parsedError, response)}`,
    );
  }

  const payload = await parseJson<OneDriveCreateChildResponse>(response);
  const fileId = payload.id?.trim();
  if (!fileId) {
    throw new Error(
      'OneDrive upload failed: missing file id from create child response',
    );
  }

  return fileId;
}

// อ่าน payload error ของ Microsoft Graph เพื่อใช้ตัดสินใจ retry และแสดงผล
async function readErrorPayload(
  response: Response,
): Promise<OneDriveApiErrorResponse> {
  try {
    return await parseJson<OneDriveApiErrorResponse>(response);
  } catch {
    return {};
  }
}

// แปลง error payload ของ Graph ให้เป็นข้อความที่อ่านง่ายพร้อมสถานะตอบกลับ
function toErrorMessage(
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
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await parseJson<OneDriveApiErrorResponse>(response);
    return toErrorMessage(payload, response);
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

// แปลง response เป็น JSON แบบ type-safe สำหรับใช้ใน service นี้
async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}
