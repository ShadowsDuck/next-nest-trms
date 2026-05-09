'use client'
'use no memo'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { RowSelectionState, VisibilityState } from '@tanstack/react-table'
import type { CourseQuery, CourseResponse } from '@workspace/schemas'
import { BarChart3, Upload } from 'lucide-react'
import { createCourseSummaryReport } from '@/domains/summary-reports/actions'
import {
  ListPageSelectionActions,
  ListPageTableShell,
} from '@/shared/components/list-page-action-shell'
import { useLockPageScroll } from '@/shared/hooks/use-lock-page-scroll'
import {
  buildListPageExportTimestamp,
  countSelectedRows,
} from '@/shared/lib/list-page-action-shell'
import { useCourseTableController } from '../hooks/use-course-table-controller'
import { exportCoursesCSV } from '../lib/export-courses-csv'
import { exportCoursesWithEmployeesCSV } from '../lib/export-courses-with-employees-csv'
import { courseTableColumns } from './columns'
import { CourseTableEmptyState } from './empty-state'
import { CourseTableFilterToolbar } from './filter-toolbar'

// จัดการ action ของรายการหลักสูตรที่ถูกเลือกโดยคง logic เฉพาะของ feature ไว้ฝั่งหลักสูตร
function CourseSelectionActions({
  selectedCount,
  onClear,
  filename,
  params,
}: {
  selectedCount: number
  onClear: () => void
  filename: string
  params: CourseQuery
}) {
  const router = useRouter()
  const [isExportingWithEmployees, setIsExportingWithEmployees] =
    useState(false)
  const [isExportingCourses, setIsExportingCourses] = useState(false)
  const [isPreparingReport, setIsPreparingReport] = useState(false)

  // ส่งออกข้อมูลหลักสูตรที่ผู้ใช้เลือกจาก selection bar
  async function handleExportSelectedCourses(selectedCourseIds: string[]) {
    try {
      setIsExportingCourses(true)
      await exportCoursesCSV({
        params,
        filename,
        selectedCourseIds,
      })
    } finally {
      setIsExportingCourses(false)
    }
  }

  // ส่งออกข้อมูลหลักสูตรที่เลือกพร้อมรายชื่อพนักงานที่เกี่ยวข้อง
  async function handleExportSelectedCoursesWithEmployees(
    selectedCourseIds: string[]
  ) {
    try {
      setIsExportingWithEmployees(true)
      await exportCoursesWithEmployeesCSV({
        params,
        filename: `${filename}-พร้อมพนักงาน`,
        selectedCourseIds,
      })
    } finally {
      setIsExportingWithEmployees(false)
    }
  }

  // สร้างรายงานสรุปจากรายการหลักสูตรที่เลือกแล้วนำผู้ใช้ไปยังหน้ารายงาน
  async function handleGoToSummaryReport(selectedCourseIds: string[]) {
    try {
      setIsPreparingReport(true)

      const { reportId } = await createCourseSummaryReport({
        params,
        selectedCourseIds,
      })

      router.push(`/admin/reports/summary?reportId=${reportId}`)
    } finally {
      setIsPreparingReport(false)
    }
  }

  return (
    <ListPageSelectionActions<CourseResponse>
      selectedCount={selectedCount}
      onClear={onClear}
      actions={[
        {
          label: 'ส่งออกข้อมูลหลักสูตร',
          pendingLabel: 'กำลังส่งออกข้อมูล...',
          isPending: isExportingCourses,
          onSelect: handleExportSelectedCourses,
          icon: Upload,
          variant: 'outline',
        },
        {
          label: 'ส่งออกพร้อมพนักงาน',
          pendingLabel: 'กำลังส่งออกข้อมูล...',
          isPending: isExportingWithEmployees,
          onSelect: handleExportSelectedCoursesWithEmployees,
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
 * Course table page component.
 * All data/pagination/filter logic is delegated to `useCourseTableController`
 * so this component stays focused on rendering.
 */
export default function CourseTable() {
  useLockPageScroll()

  const controller = useCourseTableController()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const exportTimestamp = useMemo(() => {
    return buildListPageExportTimestamp(new Date())
  }, [])
  const selectedExportFilename = useMemo(
    () => `ข้อมูลหลักสูตร-${exportTimestamp}`,
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
      initialPageSize: 25,
      manualPagination: true,
      manualFiltering: true,
      pageCount: controller.meta.totalPages,
    }),
    [controller.meta.totalPages]
  )

  return (
    <ListPageTableShell
      data={controller.courses}
      columns={courseTableColumns}
      getRowId={(row: CourseResponse) => row.id}
      state={tableState}
      config={tableConfig}
      onPaginationChange={controller.handlePaginationChange}
      onGlobalFilterChange={controller.handleGlobalFilterChange}
      onColumnFiltersChange={controller.handleColumnFiltersChange}
      onRowSelectionChange={setRowSelection}
      onColumnVisibilityChange={setColumnVisibility}
      isLoading={controller.isInitialLoading}
      isBackgroundFetching={controller.isBackgroundFetching}
      toolbar={<CourseTableFilterToolbar params={controller.params} />}
      selectionActions={
        <CourseSelectionActions
          selectedCount={selectedCount}
          onClear={() => setRowSelection({})}
          filename={selectedExportFilename}
          params={controller.params}
        />
      }
      emptyState={
        <CourseTableEmptyState
          visible={
            !controller.isInitialLoading && controller.courses.length === 0
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
