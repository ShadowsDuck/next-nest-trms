'use client'
'use no memo'

import { useMemo, useState } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import type { AuditLog } from '@workspace/schemas'
import { cn } from '@workspace/ui/lib/utils'
import { DataTablePagination } from '@/shared/components/niko-table/components/data-table-pagination'
import { DataTable } from '@/shared/components/niko-table/core/data-table'
import { DataTableRoot } from '@/shared/components/niko-table/core/data-table-root'
import {
  DataTableBody,
  DataTableHeader,
  DataTableSkeleton,
} from '@/shared/components/niko-table/core/data-table-structure'
import { useLockPageScroll } from '@/shared/hooks/use-lock-page-scroll'
import { useAuditLogTableController } from '../hooks/use-audit-log-table-controller'
import { auditLogTableColumns } from './columns'
import { AuditLogDetailDrawer } from './detail-drawer'
import { AuditLogTableEmptyState } from './empty-state'
import { AuditLogTableFilterToolbar } from './filter-toolbar'

// แสดงหน้าตาราง audit logs และควบคุมการเปิด drawer จากการคลิกแถว
export default function AuditLogTable() {
  useLockPageScroll()

  const controller = useAuditLogTableController()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(
    null
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const tableState = useMemo(
    () => ({
      pagination: controller.pagination,
      globalFilter: controller.params.search,
      columnFilters: controller.columnFilters,
      rowSelection,
    }),
    [
      controller.pagination,
      controller.params.search,
      controller.columnFilters,
      rowSelection,
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

  // เปิด drawer และเลือกแถวที่ผู้ใช้คลิกจากตาราง
  function handleRowClick(auditLog: AuditLog) {
    setSelectedAuditLog(auditLog)
    setRowSelection({ [auditLog.id]: true })
    setIsDrawerOpen(true)
  }

  // จัดการสถานะการเปิดปิด drawer และล้าง selection เมื่อปิด panel
  function handleDrawerOpenChange(open: boolean) {
    setIsDrawerOpen(open)

    if (!open) {
      setRowSelection({})
    }
  }

  return (
    <>
      <DataTableRoot
        data={controller.auditLogs}
        columns={auditLogTableColumns}
        getRowId={(row) => row.id}
        state={tableState}
        config={tableConfig}
        onPaginationChange={controller.handlePaginationChange}
        onGlobalFilterChange={controller.handleGlobalFilterChange}
        onColumnFiltersChange={controller.handleColumnFiltersChange}
        onRowSelectionChange={setRowSelection}
        isLoading={controller.isInitialLoading}
      >
        <AuditLogTableFilterToolbar params={controller.params} />

        <div
          className={cn(
            'transition-opacity duration-200',
            controller.isBackgroundFetching &&
              'pointer-events-none opacity-70 select-none'
          )}
        >
          <DataTable className="h-[calc(100dvh-14rem)] md:h-[calc(100dvh-16rem)] xl:h-[calc(100dvh-18rem)] 2xl:h-[calc(100dvh-20rem)]">
            <DataTableHeader className="bg-sidebar" />
            <DataTableBody onRowClick={handleRowClick}>
              <DataTableSkeleton rows={controller.params.limit} />
              <AuditLogTableEmptyState
                visible={
                  !controller.isInitialLoading &&
                  controller.auditLogs.length === 0
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

      <AuditLogDetailDrawer
        auditLog={selectedAuditLog}
        open={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </>
  )
}
