'use client'

import { TableCell, TableRow } from '@workspace/ui/components/table'
import { SearchX, UserSearch } from 'lucide-react'
import {
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyTitle,
} from '@/components/niko-table/components/data-table-empty-state'
import { useDataTable } from '@/components/niko-table/core/data-table-context'

interface iAppProps {
  visible: boolean
  isFiltered: boolean
}

export function EmployeeTableEmptyState({ visible, isFiltered }: iAppProps) {
  const { columns } = useDataTable()

  if (!visible) return null

  const Icon = isFiltered ? SearchX : UserSearch

  return (
    <TableRow>
      <TableCell colSpan={columns.length} className="p-0 align-middle">
        <div className="flex min-h-[calc(100dvh-25rem)] flex-col items-center justify-center gap-1 text-center text-muted-foreground">
          <DataTableEmptyIcon>
            <Icon className="size-12" />
          </DataTableEmptyIcon>
          <DataTableEmptyTitle>ไม่พบข้อมูลพนักงาน</DataTableEmptyTitle>
          <DataTableEmptyDescription>
            กรุณาลองค้นหาหรือเปลี่ยนตัวกรอง
          </DataTableEmptyDescription>
        </div>
      </TableCell>
    </TableRow>
  )
}
