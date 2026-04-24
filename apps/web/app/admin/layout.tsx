import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { AppSidebar } from '@/shared/components/sidebar/app-sidebar'
import { SiteHeader } from '@/shared/components/sidebar/site-header'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 64)',
            '--sidebar-width-icon': 'calc(var(--spacing) * 10)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-1 flex-col gap-4 px-4 py-3 md:gap-6 lg:px-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
