import { env } from '@/shared/lib/env'

const API_URL = env.NEXT_PUBLIC_API_URL

type QueryParamValue = string | number | boolean | null | undefined
type JsonBody = Record<string, unknown>
type FetcherBody = RequestInit['body'] | JsonBody

export type FetcherOptions = Omit<RequestInit, 'body'> & {
  body?: FetcherBody
  params?: Record<string, QueryParamValue>
}

function buildUrl(endpoint: string, params?: FetcherOptions['params']): string {
  const base = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  if (!params) return base

  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  )
  if (entries.length === 0) return base

  const searchParams = new URLSearchParams()
  for (const [key, value] of entries) {
    searchParams.set(key, String(value))
  }

  return `${base}?${searchParams.toString()}`
}

async function parseErrorMessage(response: Response): Promise<string> {
  const fallback = `API Error: ${response.status}`

  try {
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      return text || fallback
    }

    const errorData = (await response.json()) as {
      message?: string | string[]
      error?: string
    }

    if (Array.isArray(errorData.message)) return errorData.message.join(', ')
    if (typeof errorData.message === 'string') return errorData.message
    if (typeof errorData.error === 'string') return errorData.error
    return fallback
  } catch {
    return fallback
  }
}

function isJsonBody(value: unknown): value is JsonBody {
  return (
    value != null &&
    typeof value === 'object' &&
    !(value instanceof FormData) &&
    !(value instanceof URLSearchParams) &&
    !(value instanceof Blob) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  )
}

const fetcher = async <T>(
  endpoint: string,
  options: FetcherOptions = {}
): Promise<T> => {
  const { params, body, ...restOptions } = options

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
  const mergedHeaders = new Headers(restOptions.headers)

  // 3. แนบ Cookie เพื่อส่งต่อไปให้ NestJS ตรวจสอบ Session
  if (cookieHeader) {
    mergedHeaders.set('cookie', cookieHeader)
  }

  // 4. กำหนด Content-Type อัตโนมัติ เฉพาะเมื่อมี Body และไม่ใช่ FormData
  const shouldAutoSerializeBody = isJsonBody(body)

  if (shouldAutoSerializeBody && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  // 5. รวม base URL กับ endpoint และ query params
  const url = buildUrl(endpoint, params)

  // 6. ตรวจว่ารันอยู่ฝั่ง Server หรือ Client
  const isServer = typeof window === 'undefined'

  // 7. ยิง Request ไปหา NestJS
  // - Server: ส่ง Cookie ผ่าน header (ที่ดึงมาจาก next/headers ข้างบน)
  // - Client: ใช้ credentials: 'include' ให้เบราว์เซอร์แนบ Cookie ไปอัตโนมัติ
  const response = await fetch(url, {
    ...restOptions,
    headers: mergedHeaders,
    body: shouldAutoSerializeBody ? JSON.stringify(body) : (body as BodyInit),
    credentials: isServer ? (options.credentials ?? 'same-origin') : 'include',
  })

  // 8. ดักจับ Error ถ้า NestJS ตอบกลับมาเป็น 4xx หรือ 5xx
  if (!response.ok) {
    const errorMessage = await parseErrorMessage(response)
    throw new Error(errorMessage)
  }

  // 9. คืนค่า (กรณี 204 หรือ response ว่าง ให้คืน empty object)
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return (await response.text()) as unknown as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get<T>(endpoint: string, options?: Omit<FetcherOptions, 'method' | 'body'>) {
    return fetcher<T>(endpoint, { ...options, method: 'GET' })
  },
  post<T>(
    endpoint: string,
    body?: FetcherBody,
    options?: Omit<FetcherOptions, 'method' | 'body'>
  ) {
    return fetcher<T>(endpoint, { ...options, method: 'POST', body })
  },
  put<T>(
    endpoint: string,
    body?: FetcherBody,
    options?: Omit<FetcherOptions, 'method' | 'body'>
  ) {
    return fetcher<T>(endpoint, { ...options, method: 'PUT', body })
  },
  patch<T>(
    endpoint: string,
    body?: FetcherBody,
    options?: Omit<FetcherOptions, 'method' | 'body'>
  ) {
    return fetcher<T>(endpoint, { ...options, method: 'PATCH', body })
  },
  delete<T>(
    endpoint: string,
    options?: Omit<FetcherOptions, 'method' | 'body'>
  ) {
    return fetcher<T>(endpoint, { ...options, method: 'DELETE' })
  },
}
