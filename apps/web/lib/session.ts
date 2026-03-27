import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { authClient } from './auth-client'

export const authSession = cache(async () => {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  })

  return session
})

export const authIsRequired = cache(async () => {
  const session = await authSession()

  if (!session) {
    redirect('/auth/login')
  }

  return session
})
