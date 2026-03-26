import Link from 'next/link'
import React, { Suspense } from 'react'
import { AuthButton } from '@/components/auth-button'

export function AppBar() {
  return (
    <div className="flex gap-3 bg-linear-to-br from-blue-400 to-cyan-400 p-2 text-white shadow-sm">
      <Link href="/">Home</Link>
      <Suspense fallback={<div>Loading...</div>}>
        <AuthButton />
      </Suspense>
    </div>
  )
}
