'use client'

import type { AuditLog } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { DataTableColumnHeader } from '@/shared/components/niko-table/components/data-table-column-header'
import { DataTableColumnTitle } from '@/shared/components/niko-table/components/data-table-column-title'
import type { DataTableColumnDef } from '@/shared/components/niko-table/types'
import { getAuditLogModelTitle } from '../lib/model-title'

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'warning'
  | 'success'
  | 'inactive'
  | 'primary'

const actionBadgeMap: Record<
  AuditLog['action'],
  {
    label: string
    variant: BadgeVariant
  }
> = {
  Create: { label: 'สร้าง', variant: 'success' },
  Update: { label: 'แก้ไข', variant: 'warning' },
  Delete: { label: 'ลบ', variant: 'destructive' },
  Import: { label: 'นำเข้า', variant: 'primary' },
  Export: { label: 'ส่งออก', variant: 'secondary' },
  Failed: { label: 'ล้มเหลว', variant: 'destructive' },
}

// แปลงเวลา ISO ให้เป็นรูปแบบภาษาไทยสำหรับแสดงในตาราง
function formatThaiDateTime(value: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

// คืนค่ารูปแบบ badge ของ action เพื่อให้ table และ drawer ใช้กติกาเดียวกัน
export function getAuditActionDisplay(action: AuditLog['action']) {
  return actionBadgeMap[action]
}

export const auditLogTableColumns: DataTableColumnDef<AuditLog>[] = [
  {
    accessorKey: 'timestamp',
    size: 220,
    minSize: 220,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'วันเวลา',
    },
    cell: ({ row }) => (
      <div className="py-2 text-sm tabular-nums">
        {formatThaiDateTime(row.original.timestamp)}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: true,
  },
  {
    id: 'user',
    accessorFn: (row) => row.user.name,
    size: 280,
    minSize: 260,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ผู้ใช้งาน',
    },
    cell: ({ row }) => (
      <div className="flex flex-col py-2">
        <span className="font-medium">{row.original.user.name}</span>
        <span className="text-muted-foreground text-sm">
          {row.original.user.email}
        </span>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'action',
    size: 140,
    minSize: 140,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'กิจกรรม',
    },
    cell: ({ row }) => {
      const display = getAuditActionDisplay(row.original.action)

      return <Badge variant={display.variant}>{display.label}</Badge>
    },
    enableSorting: false,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'model',
    size: 180,
    minSize: 160,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'โมเดล',
    },
    cell: ({ row }) => (
      <div className="py-2 font-medium">
        {getAuditLogModelTitle(row.original.model)}
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'recordId',
    size: 240,
    minSize: 220,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'รหัสรายการ',
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground py-2 font-mono text-sm">
        {row.original.recordId ?? '-'}
      </span>
    ),
    enableSorting: false,
  },
]
