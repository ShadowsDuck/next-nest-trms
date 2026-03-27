'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, buttonVariants } from '@workspace/ui/components/button'
import { toast } from 'sonner'
import { signOut } from '@/lib/auth-client'
import { ThemeToggle } from './theme-toggle'

export function Navbar() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('ออกจากระบบสำเร็จ')
          router.replace('/')
        },
        onError: (error) => {
          toast.error(error.error.message || 'เกิดข้อผิดพลาดในการออกจากระบบ')
          setIsSigningOut(false)
        },
      },
    })
  }

  return (
    <nav className="flex items-center justify-between w-full py-5">
      <div className="flex items-center gap-8">
        <Link href="/">
          <h1 className="text-3xl font-bold">
            Next<span className="text-blue-500">Pro</span>
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/" className={buttonVariants({ variant: 'ghost' })}>
            Home
          </Link>
          <Link href="/blog" className={buttonVariants({ variant: 'ghost' })}>
            Blog
          </Link>
          <Link href="/create" className={buttonVariants({ variant: 'ghost' })}>
            Create
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button disabled={isSigningOut} onClick={handleSignOut}>
          {isSigningOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
        </Button>

        <Link
          className={buttonVariants({ variant: 'outline' })}
          href="/auth/login"
        >
          เข้าสู่ระบบ
        </Link>

        <ThemeToggle />
      </div>
    </nav>
  )
}
