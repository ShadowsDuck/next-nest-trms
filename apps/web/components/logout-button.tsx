'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@workspace/ui/components/button'
import { toast } from 'sonner'
import { deleteSession } from '@/lib/session'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogout = () => {
    startTransition(async () => {
      await deleteSession()

      toast.success('ออกจากระบบสำเร็จ')
      router.push('/auth/login')
    })
  }

  return (
    <Button onClick={handleLogout} disabled={isPending}>
      {isPending ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
    </Button>
  )
}
