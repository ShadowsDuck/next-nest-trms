'use client'
'use no memo'

import { useMemo, useState } from 'react'
import type { RowSelectionState, VisibilityState } from '@tanstack/react-table'
import type { CourseQuery, CourseResponse } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { Loader2, Upload } from 'lucide-react'
import { DataTablePagination } from '@/components/niko-table/components/data-table-pagination'
import { DataTableSelectionBar } from '@/components/niko-table/components/data-table-selection-bar'
import { DataTable } from '@/components/niko-table/core/data-table'
import { useDataTable } from '@/components/niko-table/core/data-table-context'
import { DataTableRoot } from '@/components/niko-table/core/data-table-root'
import {
  DataTableBody,
  DataTableHeader,
  DataTableSkeleton,
} from '@/components/niko-table/core/data-table-structure'
import { useLockPageScroll } from '@/hooks/use-lock-page-scroll'
import { useCourseTableController } from '../hooks/use-course-table-controller'
import { exportCoursesCSV } from '../lib/export-courses-csv'
import { exportCoursesWithEmployeesCSV } from '../lib/export-courses-with-employees-csv'
import { courseTableColumns } from './columns'
import { CourseTableEmptyState } from './empty-state'
import { CourseTableFilterToolbar } from './filter-toolbar'

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
  const { table } = useDataTable<CourseResponse>()
  const [isExportingWithEmployees, setIsExportingWithEmployees] =
    useState(false)
  const [isExportingCourses, setIsExportingCourses] = useState(false)

  function getSelectedCourseIds() {
    return Object.entries(table.getState().rowSelection)
      .filter(([, selected]) => Boolean(selected))
      .map(([rowId]) => rowId)
  }

  async function handleExportSelectedCourses() {
    try {
      setIsExportingCourses(true)
      await exportCoursesCSV({
        params,
        filename,
        selectedCourseIds: getSelectedCourseIds(),
      })
    } finally {
      setIsExportingCourses(false)
    }
  }

  async function handleExportSelectedCoursesWithEmployees() {
    try {
      setIsExportingWithEmployees(true)
      await exportCoursesWithEmployeesCSV({
        params,
        filename: `${filename}-พร้อมพนักงาน`,
        selectedCourseIds: getSelectedCourseIds(),
      })
    } finally {
      setIsExportingWithEmployees(false)
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
          void handleExportSelectedCourses()
        }}
        disabled={isExportingCourses}
      >
        {isExportingCourses ? (
          <Loader2 className="mr-1 size-4 animate-spin" />
        ) : (
          <Upload className="mr-1 size-4" />
        )}
        {isExportingCourses ? 'กำลังส่งออกข้อมูล...' : 'ส่งออกข้อมูลหลักสูตร'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void handleExportSelectedCoursesWithEmployees()
        }}
        disabled={isExportingWithEmployees}
      >
        {isExportingWithEmployees ? (
          <Loader2 className="mr-1 size-4 animate-spin" />
        ) : (
          <Upload className="mr-1 size-4" />
        )}
        {isExportingWithEmployees
          ? 'กำลังส่งออกข้อมูล...'
          : 'ส่งออกพร้อมพนักงาน'}
      </Button>
    </DataTableSelectionBar>
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
    const now = new Date()
    const date = now.toISOString().split('T')[0] ?? ''
    const time = (now.toTimeString().split(' ')[0] ?? '').replace(/:/g, '-')
    return `${date}_${time}`
  }, [])
  const selectedExportFilename = useMemo(
    () => `ข้อมูลหลักสูตร-${exportTimestamp}`,
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
      initialPageSize: 25,
      manualPagination: true,
      manualFiltering: true,
      pageCount: controller.meta.totalPages,
    }),
    [controller.meta.totalPages]
  )

  return (
    <DataTableRoot
      data={controller.courses}
      columns={courseTableColumns}
      getRowId={(row) => row.id}
      state={tableState}
      config={tableConfig}
      onPaginationChange={controller.handlePaginationChange}
      onGlobalFilterChange={controller.handleGlobalFilterChange}
      onColumnFiltersChange={controller.handleColumnFiltersChange}
      onRowSelectionChange={setRowSelection}
      onColumnVisibilityChange={setColumnVisibility}
      isLoading={controller.isInitialLoading}
    >
      <CourseTableFilterToolbar params={controller.params} />
      <CourseSelectionActions
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
            <CourseTableEmptyState
              visible={
                !controller.isInitialLoading && controller.courses.length === 0
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
