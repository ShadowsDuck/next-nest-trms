'use client'
'use no memo'

import { useEffect, useMemo, useState } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import type { EmployeeSchemaResponse } from '@workspace/schemas'
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
import { SYSTEM_COLUMN_IDS } from '@/components/niko-table/lib/constants'
import { useEmployeeTableController } from '../hooks/use-employee-table-controller'
import { employeeExportValueTransformers } from '../lib/export-value-transformers'
import { employeeParsers } from '../lib/search-params'
import { employeeTableColumns } from './columns'
import { EmployeeTableEmptyState } from './empty-state'
import { EmployeeTableFilterToolbar } from './filter-toolbar'

function EmployeeSelectionActions({
  selectedCount,
  onClear,
}: {
  selectedCount: number
  onClear: () => void
}) {
  const { table } = useDataTable<EmployeeSchemaResponse>()

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
        filename="employees-selected"
        onlySelected
        useHeaderLabels
        valueTransformers={employeeExportValueTransformers}
        excludeColumns={
          [
            SYSTEM_COLUMN_IDS.SELECT,
          ] as unknown as (keyof EmployeeSchemaResponse)[]
        }
      />
    </DataTableSelectionBar>
  )
}

/**
 * Employee table page component.
 * All data/pagination/filter logic is delegated to `useEmployeeTableController`
 * so this component stays focused on rendering.
 */
export default function EmployeeTable() {
  /**
   * Lock page scroll.
   */
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [])

  const controller = useEmployeeTableController()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const selectedCount = useMemo(
    () => Object.values(rowSelection).filter(Boolean).length,
    [rowSelection]
  )

  return (
    <DataTableRoot
      data={controller.employees}
      columns={employeeTableColumns}
      getRowId={(row) => row.employeeNo}
      state={{
        pagination: controller.pagination,
        globalFilter: controller.params.search,
        columnFilters: controller.columnFilters,
        rowSelection,
      }}
      config={{
        initialPageSize: Number(employeeParsers.limit),
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
      <EmployeeTableFilterToolbar />
      <EmployeeSelectionActions
        selectedCount={selectedCount}
        onClear={() => setRowSelection({})}
      />

      <div
        className={cn(
          'transition-opacity duration-200',
          controller.isBackgroundFetching && 'opacity-70'
        )}
      >
        <DataTable
          className="
            h-[calc(100dvh-16rem)]
            md:h-[calc(100dvh-18rem)]
            xl:h-[calc(100dvh-20rem)]
            2xl:h-[calc(100dvh-22rem)]
          "
        >
          <DataTableHeader />
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
