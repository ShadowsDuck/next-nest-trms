import { redirect } from 'next/navigation'
import { authSession } from '@/lib/session'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await authSession()

  if (session) {
    redirect('/')
  }

  return <>{children}</>
}
