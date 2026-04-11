import { Kanit } from 'next/font/google'
import { Toaster } from '@workspace/ui/components/sonner'
import '@workspace/ui/globals.css'
import { cn } from '@workspace/ui/lib/utils'
import Provider from '@/components/provider'
import { ThemeProvider } from '@/components/theme-provider'

const fontKanit = Kanit({
  variable: '--font-kanit',
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', 'font-sans', fontKanit.variable)}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Provider>{children}</Provider>
        </ThemeProvider>
        <Toaster closeButton />
      </body>
    </html>
  )
}
