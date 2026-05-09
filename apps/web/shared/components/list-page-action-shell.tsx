'use client'
'use no memo'

import type { ReactNode } from 'react'
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  Updater,
  VisibilityState,
} from '@tanstack/react-table'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { Loader2, type LucideIcon } from 'lucide-react'
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
import type { DataTableConfig } from '@/shared/components/niko-table/core/data-table-root'
import type {
  DataTableColumnDef,
  GlobalFilter,
} from '@/shared/components/niko-table/types'

type ListPageSelectionAction = {
  label: string
  pendingLabel: string
  isPending: boolean
  onSelect: (selectedRowIds: string[]) => Promise<void>
  icon: LucideIcon
  variant?: 'default' | 'outline'
}

type ListPageSelectionActionsProps = {
  selectedCount: number
  onClear: () => void
  actions: ListPageSelectionAction[]
}

type ListPageTableShellState = {
  pagination: PaginationState
  globalFilter: GlobalFilter
  columnFilters: ColumnFiltersState
  rowSelection: RowSelectionState
  columnVisibility: VisibilityState
}

type ListPageTableShellProps<TData> = {
  data: TData[]
  columns: DataTableColumnDef<TData, unknown>[]
  getRowId: (row: TData) => string
  state: ListPageTableShellState
  config: DataTableConfig
  onPaginationChange: (updater: Updater<PaginationState>) => void
  onGlobalFilterChange: (value: GlobalFilter) => void
  onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => void
  onRowSelectionChange: (updater: Updater<RowSelectionState>) => void
  onColumnVisibilityChange: (updater: Updater<VisibilityState>) => void
  isLoading: boolean
  isBackgroundFetching: boolean
  toolbar: ReactNode
  selectionActions?: ReactNode
  emptyState: ReactNode
  skeletonRows: number
  totalCount: number
  isListFetching: boolean
}

// ดึง row id ที่ถูกเลือกจาก state ของตารางเพื่อส่งต่อให้ action ของแต่ละ feature ใช้งาน
function getSelectedRowIds<TData>(
  table: ReturnType<typeof useDataTable<TData>>['table']
) {
  return Object.entries(table.getState().rowSelection)
    .filter(([, selected]) => Boolean(selected))
    .map(([rowId]) => rowId)
}

// แสดง action bar ของรายการที่ถูกเลือกโดยให้แต่ละ feature ส่ง config การทำงานของตัวเองเข้ามา
export function ListPageSelectionActions<TData>({
  selectedCount,
  onClear,
  actions,
}: ListPageSelectionActionsProps) {
  const { table } = useDataTable<TData>()

  return (
    <DataTableSelectionBar
      selectedCount={selectedCount}
      onClear={onClear}
      selectedText="รายการที่เลือก"
      clearText="ล้างรายการ"
    >
      {actions.map((action) => {
        const Icon = action.icon

        return (
          <Button
            key={action.label}
            variant={action.variant ?? 'outline'}
            size="sm"
            onClick={() => {
              void action.onSelect(getSelectedRowIds(table))
            }}
            disabled={action.isPending}
          >
            {action.isPending ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Icon className="mr-1 size-4" />
            )}
            {action.isPending ? action.pendingLabel : action.label}
          </Button>
        )
      })}
    </DataTableSelectionBar>
  )
}

// รวมโครง table page ที่ซ้ำกันไว้หลัง seam เดียวโดยเปิดให้ feature ส่ง toolbar และ action เฉพาะของตัวเองเข้ามา
export function ListPageTableShell<TData>({
  data,
  columns,
  getRowId,
  state,
  config,
  onPaginationChange,
  onGlobalFilterChange,
  onColumnFiltersChange,
  onRowSelectionChange,
  onColumnVisibilityChange,
  isLoading,
  isBackgroundFetching,
  toolbar,
  selectionActions,
  emptyState,
  skeletonRows,
  totalCount,
  isListFetching,
}: ListPageTableShellProps<TData>) {
  return (
    <DataTableRoot
      data={data}
      columns={columns}
      getRowId={getRowId}
      state={state}
      config={config}
      onPaginationChange={onPaginationChange}
      onGlobalFilterChange={onGlobalFilterChange}
      onColumnFiltersChange={onColumnFiltersChange}
      onRowSelectionChange={onRowSelectionChange}
      onColumnVisibilityChange={onColumnVisibilityChange}
      isLoading={isLoading}
    >
      {toolbar}
      {selectionActions}

      <div
        className={cn(
          'transition-opacity duration-200',
          isBackgroundFetching && 'pointer-events-none opacity-70 select-none'
        )}
      >
        <DataTable className="h-[calc(100dvh-14rem)] md:h-[calc(100dvh-16rem)] xl:h-[calc(100dvh-18rem)] 2xl:h-[calc(100dvh-20rem)]">
          <DataTableHeader className="bg-sidebar" />
          <DataTableBody>
            <DataTableSkeleton rows={skeletonRows} />
            {emptyState}
          </DataTableBody>
        </DataTable>
      </div>

      <DataTablePagination
        totalCount={totalCount}
        isFetching={isListFetching}
      />
    </DataTableRoot>
  )
}
