'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import {
  ChevronDown,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
} from 'lucide-react'
import {
  accreditationStatusOptions,
  courseTypeOptions,
} from '@/domains/courses'
import { DataTableClearFilter } from '@/shared/components/niko-table/components/data-table-clear-filter'
import { DataTableDateFilter } from '@/shared/components/niko-table/components/data-table-date-filter'
import { DataTableFacetedFilter } from '@/shared/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/shared/components/niko-table/components/data-table-search-filter'
import { DataTableSliderFilter } from '@/shared/components/niko-table/components/data-table-slider-filter'
import { DataTableToolbarSection } from '@/shared/components/niko-table/components/data-table-toolbar-section'
import { exportCoursesCSV } from '../lib/export-courses-csv'
import { exportCoursesWithEmployeesCSV } from '../lib/export-courses-with-employees-csv'
import { COURSES_QUERY_KEY } from '../options/query-options'
import { useCourseFilterOptions } from '../queries/use-course-filter-options'

/**
 * Toolbar สำหรับกรองข้อมูลหลักสูตร
 */
export function CourseTableFilterToolbar({ params }: { params: CourseQuery }) {
  const { data: filterOptions } = useCourseFilterOptions()
  const [isExportingWithEmployees, setIsExportingWithEmployees] =
    useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  // สร้าง timestamp สำหรับชื่อไฟล์ export
  const exportTimestamp = useMemo(() => {
    const now = new Date()
    const date = now.toISOString().split('T')[0] ?? ''
    const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
    return `${date}_${time}`
  }, [])

  // ส่งออกข้อมูลหลักสูตร (ไม่มีรายชื่อพนักงาน)
  async function handleExportCourses() {
    await exportCoursesCSV({
      params,
      filename: `ข้อมูลหลักสูตร-${exportTimestamp}`,
    })
  }

  // ส่งออกข้อมูลหลักสูตรพร้อมรายชื่อพนักงาน
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

  // รีเฟรชข้อมูล
  async function handleRefresh() {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: [COURSES_QUERY_KEY] })
    setIsRefreshing(false)
  }

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2.5">
      <DataTableToolbarSection className="mb-2 w-full justify-between px-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            ข้อมูลหลักสูตร
          </h1>
          <p className="text-muted-foreground text-sm">
            จัดการและดูข้อมูลหลักสูตรทั้งหมดได้ในที่เดียว
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* ปุ่มนำเข้าข้อมูล */}
          <Button variant="outline" className="gap-2" size="lg">
            <Download className="mr-1 size-4" />
            นำเข้า
          </Button>

          {/* ปุ่มส่งออกข้อมูล */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" size="lg">
                <Upload className="mr-1 size-4" />
                ส่งออก
                <ChevronDown className="text-muted-foreground size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="border-border/70 bg-popover/95 w-64 min-w-64 rounded-xl border p-1.5 shadow-xl ring-0 backdrop-blur"
            >
              <DropdownMenuLabel className="text-muted-foreground px-2.5 pb-1 text-[11px] tracking-wide">
                เมนูส่งออกข้อมูล
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onSelect={() => {
                  void handleExportCourses()
                }}
                className="focus:bg-muted/80 cursor-pointer gap-3 rounded-lg px-2.5 py-2"
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
                onSelect={() => {
                  if (!isExportingWithEmployees) {
                    void handleExportCoursesWithEmployees()
                  }
                }}
                disabled={isExportingWithEmployees}
                className="focus:bg-muted/80 cursor-pointer gap-3 rounded-lg px-2.5 py-2"
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

          {/* ปุ่มสร้างหลักสูตรใหม่ */}
          <Button asChild size="lg">
            <Link href="/admin/courses/create">
              <Plus className="mr-1 size-4" />
              สร้างหลักสูตร
            </Link>
          </Button>
        </div>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="w-full flex-wrap gap-3 px-0">
        <DataTableSearchFilter
          placeholder="ค้นหาด้วย ชื่อหลักสูตร..."
          className="w-[350px] flex-none"
        />
        <DataTableFacetedFilter
          accessorKey="type"
          title="ประเภท"
          options={courseTypeOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
          showSearch={false}
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
          showSearch={false}
        />
        <DataTableClearFilter size="lg" className="h-9">
          ล้างตัวกรอง
        </DataTableClearFilter>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-1 size-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            รีเฟรชข้อมูล
          </Button>
        </div>
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}
