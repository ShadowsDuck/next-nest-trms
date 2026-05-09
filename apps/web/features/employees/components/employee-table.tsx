'use client'
'use no memo'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { RowSelectionState, VisibilityState } from '@tanstack/react-table'
import type { EmployeeQuery, EmployeeResponse } from '@workspace/schemas'
import { BarChart3, Upload } from 'lucide-react'
import { employeeParsers } from '@/domains/employees'
import { createEmployeeSummaryReport } from '@/domains/summary-reports/actions'
import {
  ListPageSelectionActions,
  ListPageTableShell,
} from '@/shared/components/list-page-action-shell'
import { useLockPageScroll } from '@/shared/hooks/use-lock-page-scroll'
import {
  buildListPageExportTimestamp,
  countSelectedRows,
} from '@/shared/lib/list-page-action-shell'
import { useEmployeeTableController } from '../hooks/use-employee-table-controller'
import { exportEmployeesCSV } from '../lib/export-employees-csv'
import { exportEmployeesWithCoursesCSV } from '../lib/export-employees-with-courses-csv'
import { employeeTableColumns } from './columns'
import { EmployeeTableEmptyState } from './empty-state'
import { EmployeeTableFilterToolbar } from './filter-toolbar'

// จัดการ action ของรายการพนักงานที่ถูกเลือกโดยคง handler เฉพาะของ feature ไว้ที่ฝั่งพนักงาน
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
  const [isExportingEmployees, setIsExportingEmployees] = useState(false)
  const [isExportingCourses, setIsExportingCourses] = useState(false)
  const [isPreparingReport, setIsPreparingReport] = useState(false)

  // ส่งออกข้อมูลของรายการพนักงานที่ผู้ใช้เลือกจาก selection bar
  async function handleExportSelectedEmployees(selectedEmployeeNos: string[]) {
    try {
      setIsExportingEmployees(true)
      await exportEmployeesCSV({
        params,
        filename,
        selectedEmployeeNos,
      })
    } finally {
      setIsExportingEmployees(false)
    }
  }

  // ส่งออกข้อมูลพนักงานที่เลือกพร้อมข้อมูลหลักสูตรของแต่ละคน
  async function handleExportSelectedEmployeesWithCourses(
    selectedEmployeeNos: string[]
  ) {
    try {
      setIsExportingCourses(true)
      await exportEmployeesWithCoursesCSV({
        params,
        filename: `${filename}-พร้อมหลักสูตร`,
        selectedEmployeeNos,
      })
    } finally {
      setIsExportingCourses(false)
    }
  }

  // สร้างรายงานสรุปจากรายการพนักงานที่เลือกแล้วพาไปยังหน้ารายงาน
  async function handleGoToSummaryReport(selectedEmployeeNos: string[]) {
    try {
      setIsPreparingReport(true)

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
    <ListPageSelectionActions<EmployeeResponse>
      selectedCount={selectedCount}
      onClear={onClear}
      actions={[
        {
          label: 'ส่งออกข้อมูลพนักงาน',
          pendingLabel: 'กำลังส่งออกข้อมูล...',
          isPending: isExportingEmployees,
          onSelect: handleExportSelectedEmployees,
          icon: Upload,
          variant: 'outline',
        },
        {
          label: 'ส่งออกพร้อมหลักสูตร',
          pendingLabel: 'กำลังส่งออกข้อมูล...',
          isPending: isExportingCourses,
          onSelect: handleExportSelectedEmployeesWithCourses,
          icon: Upload,
          variant: 'outline',
        },
        {
          label: 'ไปที่รายงานสรุป',
          pendingLabel: 'กำลังเตรียมรายงาน...',
          isPending: isPreparingReport,
          onSelect: handleGoToSummaryReport,
          icon: BarChart3,
        },
      ]}
    />
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
    return buildListPageExportTimestamp(new Date())
  }, [])
  const selectedExportFilename = useMemo(
    () => `ข้อมูลพนักงาน-${exportTimestamp}`,
    [exportTimestamp]
  )
  const selectedCount = useMemo(
    () => countSelectedRows(rowSelection),
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
    <ListPageTableShell
      data={controller.employees}
      columns={employeeTableColumns}
      getRowId={(row: EmployeeResponse) => row.employeeNo}
      state={tableState}
      config={tableConfig}
      onPaginationChange={controller.handlePaginationChange}
      onGlobalFilterChange={controller.handleGlobalFilterChange}
      onColumnFiltersChange={controller.handleColumnFiltersChange}
      onRowSelectionChange={setRowSelection}
      onColumnVisibilityChange={setColumnVisibility}
      isLoading={controller.isInitialLoading}
      isBackgroundFetching={controller.isBackgroundFetching}
      toolbar={<EmployeeTableFilterToolbar params={controller.params} />}
      selectionActions={
        <EmployeeSelectionActions
          selectedCount={selectedCount}
          onClear={() => setRowSelection({})}
          filename={selectedExportFilename}
          params={controller.params}
        />
      }
      emptyState={
        <EmployeeTableEmptyState
          visible={
            !controller.isInitialLoading && controller.employees.length === 0
          }
          isFiltered={controller.hasActiveFilters}
        />
      }
      skeletonRows={controller.params.limit}
      totalCount={controller.meta.total}
      isListFetching={controller.isListFetching}
    />
  )
}
