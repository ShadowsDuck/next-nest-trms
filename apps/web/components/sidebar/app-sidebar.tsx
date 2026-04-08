'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'
import { NavMain } from '@/components/sidebar/nav-main'
import { NavSetting } from '@/components/sidebar/nav-setting'
import { NavUser } from '@/components/sidebar/nav-user'
import { data } from '@/lib/constant'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <Image
                  src="https://thesvg.org/icons/azure-log-streaming/default.svg"
                  alt="Logo"
                  width={24}
                  height={24}
                />
                <span className="text-base font-semibold">TRMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSetting items={data.setting} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
