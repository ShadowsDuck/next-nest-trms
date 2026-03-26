import { cookies } from 'next/headers'
import { API_URL } from './constants'

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set('Cookie', `access_token=${accessToken}`)
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // ถ้าเกิด 401 ตรงนี้ แปลว่าทั้ง Access และ Refresh Token หมดอายุ
  // (เพราะถ้า Refresh ยังรอด Middleware จะต่ออายุให้ตั้งแต่ก่อนเข้าฟังก์ชันนี้แล้ว)
  if (res.status === 401) {
    throw new UnauthorizedError('Session expired. Please login again.')
  }

  if (res.status === 403) {
    throw new ForbiddenError('Access denied. Please check your permissions.')
  }

  return res
}
