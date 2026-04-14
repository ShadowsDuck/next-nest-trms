'use client'

import type { EmployeeResponse } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { ChevronDown, ChevronRight } from 'lucide-react'
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

export type EmployeeTreeRow = EmployeeResponse & {
  subRows?: EmployeeTreeRow[]
}

export const courseTreeColumns: DataTableColumnDef<EmployeeTreeRow>[] = [
  {
    id: SYSTEM_COLUMN_IDS.SELECT,
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all employees"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select employee row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'employeeNo',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => (
      <div
        className="flex items-center gap-2"
        style={{ paddingLeft: `${row.depth * 1.25}rem` }}
      >
        {row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={row.getToggleExpandedHandler()}
            className="h-5 w-5 p-0"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}
        <span>{row.getValue('employeeNo')}</span>
      </div>
    ),
    meta: {
      label: 'รหัสพนักงาน',
    },
  },
  {
    id: 'fullName',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ชื่อ-นามสกุล',
    },
  },
  {
    accessorKey: 'prefix',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'คำนำหน้า',
      options: prefixOptions,
      mergeStrategy: 'preserve',
    },
    cell: ({ row }) => {
      const value = row.getValue('prefix') as string
      const option = prefixOptions.find((opt) => opt.value === value)
      return <span>{option?.label ?? value}</span>
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'jobLevel',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ระดับ',
      options: jobLevelOptions,
      mergeStrategy: 'preserve',
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'status',
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
      const option = statusOptions.find((opt) => opt.value === status)
      return (
        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
          {option?.label ?? status}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'hireDate',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'วันที่เริ่มงาน',
      variant: 'date_range',
    },
    cell: ({ row }) => {
      const date = row.getValue('hireDate') as string | undefined
      if (!date) return <span>-</span>
      return <span>{new Date(date).toLocaleDateString()}</span>
    },
    enableColumnFilter: true,
  },
]
