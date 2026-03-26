'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { API_URL } from './constants'

export type Session = {
  sub: string
  email: string
  role: string
}

const secretKey = process.env.JWT_SECRET!
const encodedKey = new TextEncoder().encode(secretKey)

export async function getSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return null
  }

  try {
    const { payload } = await jwtVerify(accessToken, encodedKey, {
      algorithms: ['HS256'],
    })

    return payload as Session
  } catch (error) {
    console.error('Token invalid or expired:', error)
    return null // return null แทน redirect ตรงนี้ เพื่อให้ Middleware เป็นคนจัดการแทน
  }
}

export async function refreshSession(refreshToken: string) {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      // ส่ง refresh_token ผ่าน Cookie header ไปหา NestJS
      headers: {
        Cookie: `refresh_token=${refreshToken}`,
      },
    })

    if (!response.ok) return null

    // คืน Set-Cookie headers กลับมาให้ middleware เอาไปใช้ต่อ
    return response.headers.getSetCookie()
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (accessToken) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        // ส่งเป็น Cookie header ให้ตรงกับที่ JwtStrategy อ่าน
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      })
    } catch (error) {
      console.error('Failed to logout from backend:', error)
    }
  }

  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')

  redirect('/auth/login')
}
