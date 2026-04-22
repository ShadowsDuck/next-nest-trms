'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { EmployeeQuery } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Separator } from '@workspace/ui/components/separator'
import {
  EllipsisVertical,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
} from 'lucide-react'
import {
  jobLevelOptions,
  prefixOptions,
  statusOptions,
} from '@/domains/employees'
import { DataTableClearFilter } from '@/shared/components/niko-table/components/data-table-clear-filter'
import { DataTableFacetedFilter } from '@/shared/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/shared/components/niko-table/components/data-table-search-filter'
import { DataTableToolbarSection } from '@/shared/components/niko-table/components/data-table-toolbar-section'
import { exportEmployeesCSV } from '../lib/export-employees-csv'
import { exportEmployeesWithCoursesCSV } from '../lib/export-employees-with-courses-csv'
import { EMPLOYEES_QUERY_KEY } from '../options/query-options'
import { useEmployeeFilterOptions } from '../queries/use-employee-filter-options'
import { EmployeeCsvImportDialog } from './employee-csv-import-dialog'

/**
 * Toolbar filters using built-in niko-table controls.
 * Column header funnel filters are intentionally removed to keep UX simpler.
 */
export function EmployeeTableFilterToolbar({
  params,
}: {
  params: EmployeeQuery
}) {
  const { data: filterOptions } = useEmployeeFilterOptions()
  const [isExportingCourses, setIsExportingCourses] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // สร้าง timestamp สำหรับ export filename
  const exportTimestamp = useMemo(() => {
    const now = new Date()
    const date = now.toISOString().split('T')[0] ?? ''
    const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
    return `${date}_${time}`
  }, [])

  // สร้าง export filename สำหรับส่งออกข้อมูล
  const allExportFilename = useMemo(
    () => `ข้อมูลพนักงานทั้งหมด-${exportTimestamp}`,
    [exportTimestamp]
  )

  // ส่งออกข้อมูลพนักงานทั้งหมดพร้อมหลักสูตร
  async function handleExportEmployeesWithCourses() {
    try {
      setIsExportingCourses(true)
      await exportEmployeesWithCoursesCSV({
        params,
        filename: `ข้อมูลพนักงานพร้อมหลักสูตร-${exportTimestamp}`,
      })
    } finally {
      setIsExportingCourses(false)
    }
  }

  // ส่งออกข้อมูลพนักงานทั้งหมด
  async function handleExportAllEmployees() {
    await exportEmployeesCSV({
      params,
      filename: allExportFilename,
    })
  }

  // รีเฟรชข้อมูล
  async function handleRefresh() {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })
    setIsRefreshing(false)
  }

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2.5">
      <DataTableToolbarSection className="w-full justify-between px-0">
        <h1 className="text-2xl font-semibold tracking-tight">ข้อมูลพนักงาน</h1>
        <Button asChild className="gap-1.5">
          <Link href="/admin/employees/create">
            <Plus className="size-4" />
            สร้างพนักงานใหม่
          </Link>
        </Button>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="ค้นหาด้วย รหัสพนักงาน หรือ ชื่อ-นามสกุล..." />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="เมนูส่งออกข้อมูล"
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

              <Separator className="my-1" />

              <DropdownMenuItem
                onSelect={() => {
                  void handleExportAllEmployees()
                }}
                className="focus:bg-muted/80 cursor-pointer rounded-lg px-2.5 py-2"
              >
                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
                  <Upload className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-medium">
                    ส่งออกข้อมูลพนักงาน
                  </span>
                  <span className="text-muted-foreground text-xs">
                    รายชื่อพนักงานตามตัวกรองปัจจุบัน
                  </span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (!isExportingCourses) {
                    void handleExportEmployeesWithCourses()
                  }
                }}
                disabled={isExportingCourses}
                className="focus:bg-muted/80 cursor-pointer rounded-lg px-2.5 py-2"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {isExportingCourses ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-medium">
                    ส่งออกพร้อมหลักสูตร
                  </span>
                  <span className="text-muted-foreground text-xs">
                    รายชื่อพนักงานพร้อมประวัติการฝึกอบรมของแต่ละคน
                  </span>
                </span>
              </DropdownMenuItem>

              <Separator className="my-1" />

              <DropdownMenuItem
                onSelect={() => {
                  setIsImportDialogOpen(true)
                }}
                className="focus:bg-muted/80 cursor-pointer rounded-lg px-2.5 py-2"
              >
                <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
                  <FileSpreadsheet className="size-4" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm leading-none font-medium">
                    นำเข้าข้อมูลจาก CSV
                  </span>
                  <span className="text-muted-foreground text-xs">
                    นำเข้าข้อมูลพนักงานบันทึกลงในระบบ
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableFacetedFilter
          accessorKey="prefix"
          title="คำนำหน้า"
          options={prefixOptions}
          multiple
          showCounts={false}
        />
        <DataTableFacetedFilter
          accessorKey="jobLevel"
          title="ระดับงาน"
          options={jobLevelOptions}
          multiple
          showCounts={false}
        />
        <DataTableFacetedFilter
          accessorKey="divisionName"
          title="ฝ่าย"
          options={filterOptions?.divisionOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableFacetedFilter
          accessorKey="departmentName"
          title="ส่วนงาน"
          options={filterOptions?.departmentOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableFacetedFilter
          accessorKey="status"
          title="สถานะ"
          options={statusOptions}
          multiple
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableClearFilter>ล้างตัวกรอง</DataTableClearFilter>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            รีเฟรชข้อมูล
          </Button>
        </div>
      </DataTableToolbarSection>

      <EmployeeCsvImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </DataTableToolbarSection>
  )
}
