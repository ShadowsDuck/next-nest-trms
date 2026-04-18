'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type Icon } from '@tabler/icons-react'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'

export function NavReport({
  items,
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>รายงาน</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link
                  href={item.url}
                  className={
                    pathname === item.url || pathname.startsWith(`${item.url}/`)
                      ? 'bg-accent text-primary'
                      : ''
                  }
                >
                  <item.icon
                    className={
                      pathname === item.url ||
                      pathname.startsWith(`${item.url}/`)
                        ? 'text-primary'
                        : undefined
                    }
                  />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
