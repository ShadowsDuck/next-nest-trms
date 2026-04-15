'use client'

import { useMemo, useState } from 'react'
import type { EmployeeQuery, EmployeeResponse } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { EllipsisVertical, Loader2, Upload } from 'lucide-react'
import { DataTableClearFilter } from '@/components/niko-table/components/data-table-clear-filter'
import { DataTableFacetedFilter } from '@/components/niko-table/components/data-table-faceted-filter'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import { useDataTable } from '@/components/niko-table/core/data-table-context'
import { exportTableToCSV } from '@/components/niko-table/filters/table-export-button'
import { SYSTEM_COLUMN_IDS } from '@/components/niko-table/lib/constants'
import { exportEmployeesWithCoursesCSV } from '../lib/export-employees-with-courses'
import { employeeExportValueTransformers } from '../lib/export-value-transformers'
import {
  jobLevelOptions,
  prefixOptions,
  statusOptions,
} from '../lib/filter-options'

/**
 * Toolbar filters using built-in niko-table controls.
 * Column header funnel filters are intentionally removed to keep UX simpler.
 */
export function EmployeeTableFilterToolbar({
  params,
}: {
  params: EmployeeQuery
}) {
  const { table } = useDataTable<EmployeeResponse>()
  const exportTimestamp = useMemo(() => {
    const now = new Date()
    const date = now.toISOString().split('T')[0] ?? ''
    const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
    return `${date}_${time}`
  }, [])
  const allExportFilename = useMemo(
    () => `ข้อมูลพนักงานทั้งหมด-${exportTimestamp}`,
    [exportTimestamp]
  )
  const [isExportingCourses, setIsExportingCourses] = useState(false)

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

  function handleExportAllEmployees() {
    exportTableToCSV(table, {
      filename: allExportFilename,
      useHeaderLabels: true,
      valueTransformers: employeeExportValueTransformers,
      excludeColumns: [
        SYSTEM_COLUMN_IDS.SELECT,
        'prefix',
      ] as unknown as (keyof EmployeeResponse)[],
    })
  }

  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2">
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

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault()
                  handleExportAllEmployees()
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
                onSelect={(event) => {
                  event.preventDefault()
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DataTableToolbarSection>

      <DataTableToolbarSection className="px-0">
        <DataTableFacetedFilter
          accessorKey="prefix"
          options={prefixOptions}
          multiple
          showCounts={false}
        />
        <DataTableFacetedFilter
          accessorKey="jobLevel"
          options={jobLevelOptions}
          multiple
          showCounts={false}
        />
        <DataTableFacetedFilter
          accessorKey="status"
          options={statusOptions}
          showCounts={false}
          limitToFilteredRows={false}
        />
        <DataTableClearFilter>ล้างตัวกรอง</DataTableClearFilter>
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}
