import Link from 'next/link'
import { buttonVariants } from '@workspace/ui/components/button'
import { Navbar } from '@/components/navbar'

export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
      <Navbar />

      <div className="mx-auto max-w-7xl p-4">
        <h1 className="mb-4 text-2xl font-bold">Home Page</h1>

        <Link
          href="/dashboard"
          className={buttonVariants({ variant: 'outline' })}
        >
          Dashboard
        </Link>
      </div>
    </main>
  )
}
