'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

export function useSignOut() {
  const router = useRouter()

  const handleSignOut = async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/')
          toast.success('ออกจากระบบสำเร็จ')
        },
        onError: () => {
          toast.error('เกิดข้อผิดพลาดในการออกจากระบบ')
        },
      },
    })
  }

  return handleSignOut
}
