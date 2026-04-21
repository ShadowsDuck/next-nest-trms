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
import { NavMain } from '@/shared/components/sidebar/nav-main'
import { NavReport } from '@/shared/components/sidebar/nav-report'
import { NavSetting } from '@/shared/components/sidebar/nav-setting'
import { NavUser } from '@/shared/components/sidebar/nav-user'
import { data } from '@/shared/lib/constant'

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
        <NavReport items={data.report} />
        <NavSetting items={data.setting} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
