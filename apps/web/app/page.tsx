import Link from 'next/link'
import { buttonVariants } from '@workspace/ui/components/button'
import { Navbar } from '@/shared/components/navbar'

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
      <Navbar />

      <div className="mx-auto max-w-7xl p-4">
        <h1 className="mb-4 text-2xl font-bold">Home Page</h1>

        <Link href="/admin" className={buttonVariants({ variant: 'outline' })}>
          Dashboard
        </Link>
      </div>
    </main>
  )
}
