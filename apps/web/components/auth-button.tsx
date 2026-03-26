import Link from 'next/link'
import React from 'react'
import { getSession } from '@/lib/session'
import { LogoutButton } from './logout-button'

export async function AuthButton() {
  const session = await getSession()

  return (
    <div className="ml-auto flex items-center gap-2">
      {!session ? (
        <>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/sign-up">Sign Up</Link>
        </>
      ) : (
        <>
          <p>Welcome, {session.email}!</p>
          <LogoutButton />
        </>
      )}
    </div>
  )
}
