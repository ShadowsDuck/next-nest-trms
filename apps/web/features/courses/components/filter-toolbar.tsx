'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { CourseQuery } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { EllipsisVertical, Loader2, Plus, Upload } from 'lucide-react'
import { DataTableClearFilter } from '@/components/niko-table/components/data-table-clear-filter'
import { DataTableDateFilter } from '@/components/niko-table/components/data-table-date-filter'
import { DataTableFacetedFilter } from '@/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableSliderFilter } from '@/components/niko-table/components/data-table-slider-filter'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import { useCourseFilterOptions } from '../hooks/use-course-filter-options'
import { exportCoursesCSV } from '../lib/export-courses-csv'
import { exportCoursesWithEmployeesCSV } from '../lib/export-courses-with-employees-csv'
import {
  accreditationStatusOptions,
  courseTypeOptions,
} from '../lib/filter-options'

export function CourseTableFilterToolbar({ params }: { params: CourseQuery }) {
  const { data: filterOptions } = useCourseFilterOptions()
  const [isExportingWithEmployees, setIsExportingWithEmployees] =
    useState(false)
  const exportTimestamp = useMemo(() => {
    const now = new Date()
    const date = now.toISOString().split('T')[0] ?? ''
    const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
    return `${date}_${time}`
  }, [])

  async function handleExportCourses() {
    await exportCoursesCSV({
      params,
      filename: `ข้อมูลหลักสูตร-${exportTimestamp}`,
    })
  }

  async function handleExportCoursesWithEmployees() {
    try {
      setIsExportingWithEmployees(true)
      await exportCoursesWithEmployeesCSV({
        params,
        filename: `ข้อมูลหลักสูตรพร้อมพนักงาน-${exportTimestamp}`,
      })
    } finally {
      setIsExportingWithEmployees(false)
    }
  }

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2.5">
      <DataTableToolbarSection className="w-full justify-between px-0">
        <h1 className="text-2xl font-semibold tracking-tight">
          ข้อมูลหลักสูตร
        </h1>
        <Button asChild className="gap-1.5">
          <Link href="/admin/courses/new">
            <Plus className="size-4" />
            สร้างหลักสูตรใหม่
          </Link>
        </Button>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="ค้นหาด้วย ชื่อหลักสูตร..." />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="เมนูส่งออกข้อมูลหลักสูตร"
              >
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="border-border/70 bg-popover/95 w-64 min-w-64 rounded-xl border p-1.5 shadow-xl backdrop-blur"
            >
              <DropdownMenuLabel className="text-muted-foreground px-2.5 pb-1 text-[11px] tracking-wide">
                เมนูส่งออกข้อมูล
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  void handleExportCourses()
                }}
                className="focus:bg-muted/80 cursor-pointer rounded-lg px-2.5 py-2"
              >
                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
                  <Upload className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-medium">
                    ส่งออกข้อมูลหลักสูตร
                  </span>
                  <span className="text-muted-foreground text-xs">
                    รายการหลักสูตรตามตัวกรองปัจจุบัน
                  </span>
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  if (!isExportingWithEmployees) {
                    void handleExportCoursesWithEmployees()
                  }
                }}
                disabled={isExportingWithEmployees}
                className="focus:bg-muted/80 cursor-pointer rounded-lg px-2.5 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {isExportingWithEmployees ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-medium">
                    ส่งออกพร้อมพนักงาน
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ข้อมูลหลักสูตรพร้อมรายชื่อผู้เข้าร่วม
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableFacetedFilter
          accessorKey="type"
          title="ประเภท"
          options={courseTypeOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableFacetedFilter
          accessorKey="tagName"
          title="หมวดหมู่"
          options={filterOptions?.tagOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableDateFilter
          accessorKey="dateRange"
          title="วันที่จัดอบรม"
          multiple
        />
        <DataTableSliderFilter
          accessorKey="duration"
          title="รวมเวลา"
          unit="ชม."
        />
        <DataTableFacetedFilter
          accessorKey="accreditationStatus"
          title="สถานะการรับรอง"
          options={accreditationStatusOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableClearFilter>ล้างตัวกรอง</DataTableClearFilter>
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}
