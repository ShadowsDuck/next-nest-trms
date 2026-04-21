import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { authClient } from './auth-client'

export const authSession = cache(async () => {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  })

  return session
})

export const requireUser = cache(async () => {
  const session = await authSession()

  if (!session) {
    redirect('/login')
  }

  return session
})

export const requireAdmin = cache(async () => {
  const session = await authSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'Admin') {
    redirect('/not-admin')
  }

  return session
})
