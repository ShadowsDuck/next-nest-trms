import { Navbar } from '@/components/navbar'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
      <Navbar />
      {children}
    </main>
  )
}
