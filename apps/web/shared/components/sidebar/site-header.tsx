'use client'

import { usePathname } from 'next/navigation'
import React from 'react'
import { Separator } from '@workspace/ui/components/separator'
import { SidebarTrigger } from '@workspace/ui/components/sidebar'
import { data } from '@/shared/lib/constant'

export function SiteHeader() {
  const pathname = usePathname()

  /**
   * ฟังก์ชันสำหรับสร้างรายการ Breadcrumb จาก pathname ปัจจุบัน
   * @returns รายการข้อความสำหรับแสดงผล Breadcrumb
   */
  const getBreadcrumbs = () => {
    // ฟังก์ชันช่วยหาหน้าที่มี URL ตรงกับจุดเริ่มต้นของ pathname มากที่สุด
    const findBestMatch = (items: typeof data.navMain) => {
      return items
        .filter((i) => pathname === i.url || pathname.startsWith(`${i.url}/`))
        .sort((a, b) => b.url.length - a.url.length)[0]
    }

    const navMainItem = findBestMatch(data.navMain)
    const reportItem = findBestMatch(data.report)
    const settingItem = findBestMatch(data.setting)

    // รวบรวมและเลือกตัวเลือกที่ URL ยาวที่สุด (เฉพาะเจาะจงที่สุด)
    const candidates = [
      { item: navMainItem, label: 'เมนูหลัก' },
      { item: reportItem, label: 'รายงาน' },
      { item: settingItem, label: 'ระบบ' },
    ].filter((c) => c.item)

    const bestCandidate = candidates.sort(
      (a, b) => (b.item?.url.length || 0) - (a.item?.url.length || 0)
    )[0]

    if (!bestCandidate || !bestCandidate.item) return null

    const { item: activeItem, label: groupLabel } = bestCandidate
    const breadcrumbs = [groupLabel, activeItem.title]

    // ตรวจสอบหน้าย่อย (Sub-path) และแปลเป็นภาษาไทย
    const subPath = pathname
      .replace(activeItem.url, '')
      .split('/')
      .filter(Boolean)

    subPath.forEach((segment) => {
      // ข้ามส่วนที่เป็นตัวเลข (ID)
      if (isNaN(Number(segment))) {
        breadcrumbs.push(data.subPathMap[segment] || segment)
      }
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-4.5 ml-3" />
        {breadcrumbs && (
          <div className="flex items-center gap-2 text-sm font-medium tracking-tight">
            {breadcrumbs.map((text, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-muted-foreground/40 font-normal">
                    /
                  </span>
                )}
                <span
                  className={
                    index === breadcrumbs.length - 1
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground/60'
                  }
                >
                  {text}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
