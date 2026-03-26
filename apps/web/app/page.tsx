import Link from 'next/link'
import { buttonVariants } from '@workspace/ui/components/button'
import { AppBar } from '@/components/app-bar'

export default async function HomePage() {
  return (
    <main>
      <AppBar />
      <div className="mx-auto max-w-7xl p-4">
        <h1 className="mb-4 text-2xl font-bold">Home Page</h1>
        <Link href="/test" className={buttonVariants({ variant: 'default' })}>
          Go to Test Page
        </Link>
      </div>
    </main>
  )
}
