'use client'
'use no memo'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { RowSelectionState, VisibilityState } from '@tanstack/react-table'
import type { EmployeeQuery, EmployeeResponse } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { BarChart3, Loader2, Upload } from 'lucide-react'
import { employeeParsers } from '@/domains/employees'
import { createEmployeeSummaryReport } from '@/domains/summary-reports/actions'
import { DataTablePagination } from '@/shared/components/niko-table/components/data-table-pagination'
import { DataTableSelectionBar } from '@/shared/components/niko-table/components/data-table-selection-bar'
import { DataTable } from '@/shared/components/niko-table/core/data-table'
import { useDataTable } from '@/shared/components/niko-table/core/data-table-context'
import { DataTableRoot } from '@/shared/components/niko-table/core/data-table-root'
import {
  DataTableBody,
  DataTableHeader,
  DataTableSkeleton,
} from '@/shared/components/niko-table/core/data-table-structure'
import { useLockPageScroll } from '@/shared/hooks/use-lock-page-scroll'
import { useEmployeeTableController } from '../hooks/use-employee-table-controller'
import { exportEmployeesCSV } from '../lib/export-employees-csv'
import { exportEmployeesWithCoursesCSV } from '../lib/export-employees-with-courses-csv'
import { employeeTableColumns } from './columns'
import { EmployeeTableEmptyState } from './empty-state'
import { EmployeeTableFilterToolbar } from './filter-toolbar'

function EmployeeSelectionActions({
  selectedCount,
  onClear,
  filename,
  params,
}: {
  selectedCount: number
  onClear: () => void
  filename: string
  params: EmployeeQuery
}) {
  const router = useRouter()
  const { table } = useDataTable<EmployeeResponse>()
  const [isExportingEmployees, setIsExportingEmployees] = useState(false)
  const [isExportingCourses, setIsExportingCourses] = useState(false)
  const [isPreparingReport, setIsPreparingReport] = useState(false)

  function getSelectedEmployeeNos() {
    return Object.entries(table.getState().rowSelection)
      .filter(([, selected]) => Boolean(selected))
      .map(([rowId]) => rowId)
  }

  async function handleExportSelectedEmployees() {
    try {
      setIsExportingEmployees(true)
      await exportEmployeesCSV({
        params,
        filename,
        selectedEmployeeNos: getSelectedEmployeeNos(),
      })
    } finally {
      setIsExportingEmployees(false)
    }
  }

  async function handleExportSelectedEmployeesWithCourses() {
    try {
      setIsExportingCourses(true)
      await exportEmployeesWithCoursesCSV({
        params,
        filename: `${filename}-พร้อมหลักสูตร`,
        selectedEmployeeNos: getSelectedEmployeeNos(),
      })
    } finally {
      setIsExportingCourses(false)
    }
  }

  async function handleGoToSummaryReport() {
    try {
      setIsPreparingReport(true)
      const selectedEmployeeNos = getSelectedEmployeeNos()

      const { reportId } = await createEmployeeSummaryReport({
        params,
        selectedEmployeeNos,
      })

      router.push(`/admin/reports/summary?reportId=${reportId}`)
    } finally {
      setIsPreparingReport(false)
    }
  }

  return (
    <DataTableSelectionBar
      selectedCount={selectedCount}
      onClear={onClear}
      selectedText="รายการที่เลือก"
      clearText="ล้างรายการ"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void handleExportSelectedEmployees()
        }}
        disabled={isExportingEmployees}
      >
        <Upload className="mr-1 size-4" />
        {isExportingEmployees ? 'กำลังส่งออกข้อมูล...' : 'ส่งออกข้อมูลพนักงาน'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void handleExportSelectedEmployeesWithCourses()
        }}
        disabled={isExportingCourses}
      >
        <Upload className="mr-1 size-4" />
        {isExportingCourses ? 'กำลังส่งออกข้อมูล...' : 'ส่งออกพร้อมหลักสูตร'}
      </Button>
      <Button
        size="sm"
        onClick={() => {
          void handleGoToSummaryReport()
        }}
        disabled={isPreparingReport}
      >
        {isPreparingReport ? (
          <Loader2 className="mr-1 size-4 animate-spin" />
        ) : (
          <BarChart3 className="mr-1 size-4" />
        )}
        {isPreparingReport ? 'กำลังเตรียมรายงาน...' : 'ไปที่รายงานสรุป'}
      </Button>
    </DataTableSelectionBar>
  )
}

/**
 * Employee table page component.
 * All data/pagination/filter logic is delegated to `useEmployeeTableController`
 * so this component stays focused on rendering.
 */
export default function EmployeeTable() {
  useLockPageScroll()

  const controller = useEmployeeTableController()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    prefix: false,
  })
  const exportTimestamp = useMemo(() => {
    const now = new Date()
    const date = now.toISOString().split('T')[0] ?? ''
    const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
    return `${date}_${time}`
  }, [])
  const selectedExportFilename = useMemo(
    () => `ข้อมูลพนักงาน-${exportTimestamp}`,
    [exportTimestamp]
  )
  const selectedCount = useMemo(
    () => Object.values(rowSelection).filter(Boolean).length,
    [rowSelection]
  )
  const tableState = useMemo(
    () => ({
      pagination: controller.pagination,
      globalFilter: controller.params.search,
      columnFilters: controller.columnFilters,
      rowSelection,
      columnVisibility,
    }),
    [
      controller.pagination,
      controller.params.search,
      controller.columnFilters,
      rowSelection,
      columnVisibility,
    ]
  )
  const tableConfig = useMemo(
    () => ({
      initialPageSize: employeeParsers.limit.defaultValue,
      manualPagination: true,
      manualFiltering: true,
      pageCount: controller.meta.totalPages,
    }),
    [controller.meta.totalPages]
  )

  return (
    <DataTableRoot
      data={controller.employees}
      columns={employeeTableColumns}
      getRowId={(row) => row.employeeNo}
      state={tableState}
      config={tableConfig}
      onPaginationChange={controller.handlePaginationChange}
      onGlobalFilterChange={controller.handleGlobalFilterChange}
      onColumnFiltersChange={controller.handleColumnFiltersChange}
      onRowSelectionChange={setRowSelection}
      onColumnVisibilityChange={setColumnVisibility}
      isLoading={controller.isInitialLoading}
    >
      <EmployeeTableFilterToolbar params={controller.params} />
      <EmployeeSelectionActions
        selectedCount={selectedCount}
        onClear={() => setRowSelection({})}
        filename={selectedExportFilename}
        params={controller.params}
      />

      <div
        className={cn(
          'transition-opacity duration-200',
          controller.isBackgroundFetching &&
            'pointer-events-none opacity-70 select-none'
        )}
      >
        <DataTable className="h-[calc(100dvh-14rem)] md:h-[calc(100dvh-16rem)] xl:h-[calc(100dvh-18rem)] 2xl:h-[calc(100dvh-20rem)]">
          <DataTableHeader className="bg-sidebar" />
          <DataTableBody>
            <DataTableSkeleton rows={controller.params.limit} />
            <EmployeeTableEmptyState
              visible={
                !controller.isInitialLoading &&
                controller.employees.length === 0
              }
              isFiltered={controller.hasActiveFilters}
            />
          </DataTableBody>
        </DataTable>
      </div>

      <DataTablePagination
        totalCount={controller.meta.total}
        isFetching={controller.isListFetching}
      />
    </DataTableRoot>
  )
}
