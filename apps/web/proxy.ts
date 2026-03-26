import { NextRequest, NextResponse } from 'next/server'
import { getSession, refreshSession } from './lib/session'

export async function proxy(request: NextRequest) {
  const session = await getSession()

  if (session) {
    return NextResponse.next()
  }

  // access_token หมดอายุหรือไม่มี — ลองใช้ refresh_token
  const refreshToken = request.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    // ไม่มี refresh_token เลย → ไป login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const newCookies = await refreshSession(refreshToken)

  if (!newCookies) {
    // refresh token หมดอายุหรือ invalid → ไป login
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // อัปเดต request.cookies ให้ Server Component เห็น cookie ใหม่
  newCookies.forEach((cookieStr) => {
    const nameValue = cookieStr.split(';')[0]
    if (!nameValue) return

    const splitIndex = nameValue.indexOf('=')
    if (splitIndex === -1) return

    const name = nameValue.substring(0, splitIndex).trim()
    const value = nameValue.substring(splitIndex + 1).trim()

    if (name && value) {
      request.cookies.set(name, value)
    }
  })

  // สร้าง response เดียว พร้อมส่ง request ที่อัปเดตแล้วไปให้ Server Component
  const finalResponse = NextResponse.next({
    request: { headers: request.headers },
  })

  // แปะ Set-Cookie เต็มๆ ให้ฝั่ง Browser (HttpOnly, Secure ครบ)
  newCookies.forEach((cookieStr) => {
    finalResponse.headers.append('Set-Cookie', cookieStr)
  })

  return finalResponse
}

export const config = {
  matcher: ['/((?!auth|_next/static|_next/image|favicon.ico).*)'],
}
