'use client'

import type { EmployeeResponse } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { EllipsisVertical } from 'lucide-react'
import { DataTableColumnHeader } from '@/components/niko-table/components/data-table-column-header'
import { DataTableColumnSortMenu } from '@/components/niko-table/components/data-table-column-sort'
import { DataTableColumnTitle } from '@/components/niko-table/components/data-table-column-title'
import {
  FILTER_VARIANTS,
  SYSTEM_COLUMN_IDS,
} from '@/components/niko-table/lib/constants'
import type { DataTableColumnDef } from '@/components/niko-table/types'
import {
  jobLevelOptions,
  prefixOptions,
  statusOptions,
} from '../lib/filter-options'

const prefixLabelByValue = new Map<string, string>(
  prefixOptions.map((option) => [option.value, option.label] as const)
)

const statusLabelByValue = new Map<string, string>(
  statusOptions.map((option) => [option.value, option.label] as const)
)

function getFullName(employee: EmployeeResponse) {
  const prefixLabel = prefixLabelByValue.get(employee.prefix) ?? employee.prefix
  return `${prefixLabel} ${employee.firstName} ${employee.lastName}`
}

export const employeeTableColumns: DataTableColumnDef<EmployeeResponse>[] = [
  {
    id: SYSTEM_COLUMN_IDS.SELECT,
    size: 40,
    minSize: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all employees"
        className="border-input dark:bg-sidebar ml-2 bg-white shadow-[0_1px_0px_rgba(0,0,0,0.1)]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select employee row"
        className="border-input ml-2 shadow-[0_1px_0px_rgba(0,0,0,0.1)]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'employeeNo',
    size: 250,
    minSize: 250,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'รหัสพนักงาน',
    },
  },
  {
    accessorKey: 'prefix',
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: false,
    meta: {
      label: 'คำนำหน้า',
      options: prefixOptions,
    },
  },
  {
    id: 'fullName',
    accessorFn: (row) => getFullName(row),
    size: 500,
    minSize: 500,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ชื่อ-นามสกุล',
    },
    cell: ({ row }) => getFullName(row.original),
  },
  {
    accessorKey: 'jobLevel',
    size: 140,
    minSize: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ระดับงาน',
      options: jobLevelOptions,
      mergeStrategy: 'preserve',
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'divisionName',
    size: 220,
    minSize: 180,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ฝ่าย',
    },
    cell: ({ row }) => row.getValue('divisionName') || '-',
  },
  {
    accessorKey: 'departmentName',
    size: 240,
    minSize: 200,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ส่วนงาน',
    },
    cell: ({ row }) => row.getValue('departmentName') || '-',
  },
  {
    accessorKey: 'status',
    size: 160,
    minSize: 140,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'สถานะ',
      options: statusOptions,
      mergeStrategy: 'preserve',
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
          {statusLabelByValue.get(status) ?? status}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    id: 'actions',
    size: 56,
    minSize: 56,
    header: () => null,
    cell: () => (
      <Button variant="ghost" size="icon" className="size-7" disabled>
        <EllipsisVertical className="size-4" />
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]
