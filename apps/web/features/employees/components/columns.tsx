'use client'

import type { EmployeeResponse } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { cn } from '@workspace/ui/lib/utils'
import {
  jobLevelOptions,
  prefixOptions,
  statusOptions,
} from '@/domains/employees'
import { DataTableColumnHeader } from '@/shared/components/niko-table/components/data-table-column-header'
import { DataTableColumnSortMenu } from '@/shared/components/niko-table/components/data-table-column-sort'
import { DataTableColumnTitle } from '@/shared/components/niko-table/components/data-table-column-title'
import { DataTableRowActions } from '@/shared/components/niko-table/components/data-table-row-actions'
import { SYSTEM_COLUMN_IDS } from '@/shared/components/niko-table/lib/constants'
import type { DataTableColumnDef } from '@/shared/components/niko-table/types'

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
        className="border-input dark:bg-sidebar mb-[5px] ml-2 bg-white shadow-[0_1px_0px_rgba(0,0,0,0.1)]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select employee row"
        className="border-input mb-[5px] ml-2 shadow-[0_1px_0px_rgba(0,0,0,0.1)]"
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
    cell: ({ row }) => <div className="py-2">{row.getValue('employeeNo')}</div>,
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
    size: 400,
    minSize: 400,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
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
        <DataTableColumnSortMenu />
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
    size: 250,
    minSize: 200,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ฝ่าย',
    },
    cell: ({ row }) => row.getValue('divisionName') || '-',
  },
  {
    accessorKey: 'departmentName',
    size: 250,
    minSize: 200,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
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
        <DataTableColumnSortMenu />
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
        <Badge
          variant={status === 'Active' ? 'success' : 'inactive'}
          className="h-[22px] w-fit gap-2"
        >
          <span
            className={cn(
              'size-[5px] rounded-full',
              status === 'Active'
                ? 'bg-success'
                : 'bg-gray-400 dark:bg-gray-500'
            )}
          />
          {statusLabelByValue.get(status) ?? status}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    id: 'actions',
    size: 100,
    minSize: 100,
    header: () => (
      <DataTableColumnHeader className="justify-center">
        <DataTableColumnTitle />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'จัดการ',
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        <DataTableRowActions
          viewHref={`/admin/employees/${row.original.id}`}
          editHref={`/admin/employees/${row.original.id}/edit`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
]
