'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/button'
import { authClient } from '@/lib/auth-client'

export default function HomePage() {
  const { data: session, isPending: isLoading } = authClient.useSession()
  const router = useRouter()

  if (isLoading) {
    return <div className="text-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <main>
      <div className="mx-auto max-w-7xl p-4">
        <h1 className="mb-4 text-2xl font-bold">Home Page</h1>
        <p>You are logged in as: {session.user.name}</p>
        <Button
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push('/auth/login')
                },
              },
            })
          }
        >
          Logout
        </Button>
      </div>
    </main>
  )
}
