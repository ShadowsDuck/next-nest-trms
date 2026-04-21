import { env } from '@/shared/lib/env'

const API_URL = env.NEXT_PUBLIC_API_URL

export const fetcher = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // 1. ดึง Cookie จาก Request ปัจจุบัน (จำเป็นสำหรับ Server Components / Actions)
  // ใช้ dynamic import เพื่อไม่ให้ next/headers ถูก bundle ใน Client context
  let cookieHeader: string | null = null
  try {
    const { headers } = await import('next/headers')
    const requestHeaders = await headers()
    cookieHeader = requestHeaders.get('cookie')
  } catch {
    // กรณีเรียกจาก Client context หรือนอก Request Context
  }

  // 2. รวม Headers โดยนำ options.headers เป็นฐาน
  const mergedHeaders = new Headers(options.headers)

  // 3. แนบ Cookie เพื่อส่งต่อไปให้ NestJS ตรวจสอบ Session
  if (cookieHeader) {
    mergedHeaders.set('cookie', cookieHeader)
  }

  // 4. กำหนด Content-Type อัตโนมัติ เฉพาะเมื่อมี Body และไม่ใช่ FormData
  if (
    options.body &&
    !mergedHeaders.has('Content-Type') &&
    !(options.body instanceof FormData)
  ) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  // 5. รวม base URL กับ endpoint (รองรับทั้งที่มีและไม่มี /api นำหน้า)
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  // 6. ตรวจว่ารันอยู่ฝั่ง Server หรือ Client
  const isServer = typeof window === 'undefined'

  // 7. ยิง Request ไปหา NestJS
  // - Server: ส่ง Cookie ผ่าน header (ที่ดึงมาจาก next/headers ข้างบน)
  // - Client: ใช้ credentials: 'include' ให้เบราว์เซอร์แนบ Cookie ไปอัตโนมัติ
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
    credentials: isServer ? (options.credentials ?? 'same-origin') : 'include',
  })

  // 7. ดักจับ Error ถ้า NestJS ตอบกลับมาเป็น 4xx หรือ 5xx
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`
    try {
      const errorData = (await response.json()) as {
        message?: string | string[]
      }
      // NestJS validation errors จะส่ง message มาเป็น array
      if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(', ')
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch {
      // กรณี response ไม่ใช่ JSON ให้ใช้ข้อความ fallback
    }
    throw new Error(errorMessage)
  }

  // 8. คืนค่า (กรณี 204 No Content ให้คืน empty object)
  if (response.status === 204) return {} as T
  return response.json() as Promise<T>
}
