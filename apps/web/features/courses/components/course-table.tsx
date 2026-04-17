'use client'
'use no memo'

import { useMemo, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'
import { DataTablePagination } from '@/components/niko-table/components/data-table-pagination'
import { DataTable } from '@/components/niko-table/core/data-table'
import { DataTableRoot } from '@/components/niko-table/core/data-table-root'
import {
  DataTableBody,
  DataTableHeader,
  DataTableSkeleton,
} from '@/components/niko-table/core/data-table-structure'
import { useLockPageScroll } from '@/hooks/use-lock-page-scroll'
import { useCourseTableController } from '../hooks/use-course-table-controller'
import { courseTableColumns } from './columns'
import { CourseTableEmptyState } from './empty-state'
import { CourseTableFilterToolbar } from './filter-toolbar'

/**
 * Course table page component.
 * All data/pagination/filter logic is delegated to `useCourseTableController`
 * so this component stays focused on rendering.
 */
export default function CourseTable() {
  useLockPageScroll()

  const controller = useCourseTableController()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const tableState = useMemo(
    () => ({
      pagination: controller.pagination,
      globalFilter: controller.params.search,
      columnFilters: controller.columnFilters,
      columnVisibility,
    }),
    [
      controller.pagination,
      controller.params.search,
      controller.columnFilters,
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
      onColumnVisibilityChange={setColumnVisibility}
      isLoading={controller.isInitialLoading}
    >
      <CourseTableFilterToolbar />

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
