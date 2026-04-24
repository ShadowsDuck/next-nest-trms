'use client'

import { usePathname } from 'next/navigation'
import { Separator } from '@workspace/ui/components/separator'
import { SidebarTrigger } from '@workspace/ui/components/sidebar'
import { data } from '@/shared/lib/constant'

export function SiteHeader() {
  const pathname = usePathname()
  const allNavItems = [...data.navMain, ...data.report, ...data.setting]
  const currentPage = allNavItems.find((item) => pathname === item.url)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-4.5 ml-3" />
        {currentPage && (
          <p className="text-xl font-bold">{currentPage.title}</p>
        )}
      </div>
    </header>
  )
}
