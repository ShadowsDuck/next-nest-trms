'use client'

import type { EmployeeSchemaResponse } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { Checkbox } from '@workspace/ui/components/checkbox'
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

export const employeeTableColumns: DataTableColumnDef<EmployeeSchemaResponse>[] =
  [
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
      accessorKey: 'fullName',
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
      cell: ({ row }) => {
        const { prefix, firstName, lastName } = row.original
        const prefixLabel = prefixLabelByValue.get(prefix) ?? prefix

        return `${prefixLabel} ${firstName} ${lastName}`
      },
    },
    {
      accessorKey: 'prefix',
      header: () => null,
      meta: {
        label: 'คำนำหน้า',
        options: prefixOptions,
      },
      cell: ({ row }) => {
        const prefix = row.getValue('prefix') as string
        return prefixLabelByValue.get(prefix) ?? prefix
      },
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      accessorKey: 'jobLevel',
      size: 200,
      minSize: 200,
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
      accessorKey: 'status',
      size: 200,
      minSize: 200,
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
  ]
