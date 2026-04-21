'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@workspace/ui/components/button'
import { authClient } from '@/shared/lib/auth-client'

export function GoogleButton() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Button
      variant="outline"
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        })
        setIsLoading(false)
      }}
    >
      <Image
        src="https://thesvg.org/icons/google/default.svg"
        alt="Google"
        width={18}
        height={18}
      />
      {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
    </Button>
  )
}
