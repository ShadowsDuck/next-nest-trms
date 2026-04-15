'use client'
'use no memo'

import { useMemo, useState } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import { cn } from '@workspace/ui/lib/utils'
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
import { TableExportButton } from '@/components/niko-table/filters/table-export-button'
import type { ExportTableToCSVOptions } from '@/components/niko-table/filters/table-export-button'
import { SYSTEM_COLUMN_IDS } from '@/components/niko-table/lib/constants'
import { useLockPageScroll } from '@/hooks/use-lock-page-scroll'
import { useCourseTreeTableController } from '../hooks/use-course-tree-table-controller'
import { courseExportValueTransformers } from '../lib/export-value-transformers'
import { courseParsers } from '../lib/search-params'
import { type EmployeeTreeRow, courseTreeColumns } from './course-tree-columns'
import { CourseTreeEmptyState } from './empty-state'
import { CourseTreeFilterToolbar } from './filter-toolbar'

function buildEmployeeTree(rows: EmployeeTreeRow[]): EmployeeTreeRow[] {
  const byPrefix = new Map<string, EmployeeTreeRow[]>()

  for (const row of rows) {
    const group = byPrefix.get(row.prefix) ?? []
    group.push(row)
    byPrefix.set(row.prefix, group)
  }

  const treeRows: EmployeeTreeRow[] = []

  for (const groupedRows of byPrefix.values()) {
    if (groupedRows.length === 0) {
      continue
    }

    if (groupedRows.length <= 1) {
      treeRows.push(groupedRows[0]!)
      continue
    }

    const parent = groupedRows[0]!
    const children = groupedRows.slice(1)
    treeRows.push({
      ...parent,
      subRows: children,
    })
  }

  return treeRows
}

function CourseTreeSelectionActions({
  selectedCount,
  onClear,
}: {
  selectedCount: number
  onClear: () => void
}) {
  const { table } = useDataTable<EmployeeTreeRow>()

  return (
    <DataTableSelectionBar
      selectedCount={selectedCount}
      onClear={onClear}
      selectedText="รายการที่เลือก"
      clearText="ล้างรายการ"
    >
      <TableExportButton
        table={table}
        label="ส่งออกข้อมูล"
        filename={`ข้อมูลพนักงานแบบต้นไม้-${new Date().toISOString().split('T')[0]}`}
        onlySelected
        useHeaderLabels
        valueTransformers={
          courseExportValueTransformers as NonNullable<
            ExportTableToCSVOptions<EmployeeTreeRow>['valueTransformers']
          >
        }
        excludeColumns={
          [SYSTEM_COLUMN_IDS.SELECT] as unknown as (keyof EmployeeTreeRow)[]
        }
      />
    </DataTableSelectionBar>
  )
}

export default function CourseTreeTable() {
  useLockPageScroll()

  const controller = useCourseTreeTableController()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const treeRows = useMemo(
    () => buildEmployeeTree(controller.employees as EmployeeTreeRow[]),
    [controller.employees]
  )

  const selectedCount = useMemo(
    () => Object.values(rowSelection).filter(Boolean).length,
    [rowSelection]
  )

  return (
    <DataTableRoot
      data={treeRows}
      columns={courseTreeColumns}
      getSubRows={(row) => row.subRows}
      getRowCanExpand={(row) => Boolean(row.original.subRows?.length)}
      getRowId={(row) => row.employeeNo}
      state={{
        pagination: controller.pagination,
        globalFilter: controller.params.search,
        columnFilters: controller.columnFilters,
        rowSelection,
      }}
      config={{
        initialPageSize: Number(courseParsers.limit),
        enableExpanding: true,
        manualPagination: true,
        manualFiltering: true,
        pageCount: controller.meta.totalPages,
      }}
      onPaginationChange={controller.handlePaginationChange}
      onGlobalFilterChange={controller.handleGlobalFilterChange}
      onColumnFiltersChange={controller.handleColumnFiltersChange}
      onRowSelectionChange={setRowSelection}
      isLoading={controller.isInitialLoading}
    >
      <CourseTreeFilterToolbar />
      <CourseTreeSelectionActions
        selectedCount={selectedCount}
        onClear={() => setRowSelection({})}
      />

      <div
        className={cn(
          'transition-opacity duration-200',
          controller.isBackgroundFetching && 'opacity-70'
        )}
      >
        <DataTable className="h-[calc(100dvh-16rem)] md:h-[calc(100dvh-18rem)] xl:h-[calc(100dvh-20rem)] 2xl:h-[calc(100dvh-22rem)]">
          <DataTableHeader />
          <DataTableBody>
            <DataTableSkeleton rows={controller.params.limit} />
            <CourseTreeEmptyState
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
