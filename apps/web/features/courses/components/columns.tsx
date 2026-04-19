'use client'

import type { CourseResponse } from '@workspace/schemas'
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
  accreditationStatusOptions,
  courseTypeOptions,
} from '../lib/filter-options'

const courseTypeLabelByValue = new Map<string, string>(
  courseTypeOptions.map((option) => [option.value, option.label] as const)
)

const accreditationStatusLabelByValue = new Map<string, string>(
  accreditationStatusOptions.map(
    (option) => [option.value, option.label] as const
  )
)

/** แปลง ISO date string (YYYY-MM-DD) เป็น format วัน/เดือน/ปีพ.ศ. เช่น 25/01/2569 */
function toThaiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  const buddhistYear = String(Number(year) + 543)
  return `${day}/${month}/${buddhistYear}`
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = toThaiDate(startDate)
  if (startDate === endDate) return start
  return `${start} - ${toThaiDate(endDate)}`
}

const accreditationStatusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'destructive',
}

export const courseTableColumns: DataTableColumnDef<CourseResponse>[] = [
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
        aria-label="Select all courses"
        className="border-input dark:bg-sidebar ml-2 bg-white shadow-[0_1px_0px_rgba(0,0,0,0.1)]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select course row"
        className="border-input ml-2 shadow-[0_1px_0px_rgba(0,0,0,0.1)]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    size: 380,
    minSize: 200,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: { label: 'ชื่อหลักสูตร' },
  },
  {
    accessorKey: 'type',
    size: 130,
    minSize: 130,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ประเภท',
      options: courseTypeOptions,
      mergeStrategy: 'preserve',
    },
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const label = courseTypeLabelByValue.get(type) ?? type
      return (
        <Badge variant={type === 'Internal' ? 'secondary' : 'outline'}>
          {label}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
  {
    id: 'tagName',
    accessorFn: (row) => row.tag?.name,
    size: 160,
    minSize: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: { label: 'หมวดหมู่' },
    cell: ({ row }) => {
      if (!row.original.tag) return null
      const { name, colorCode } = row.original.tag
      return (
        <Badge
          style={
            colorCode
              ? {
                  backgroundColor: colorCode,
                  color: '#fff',
                  borderColor: colorCode,
                }
              : undefined
          }
          variant="outline"
        >
          {name}
        </Badge>
      )
    },
  },
  {
    id: 'dateRange',
    accessorFn: (row) => row.startDate,
    size: 220,
    minSize: 180,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.DATE_RANGE} />
      </DataTableColumnHeader>
    ),
    meta: { label: 'วันที่จัดอบรม' },
    cell: ({ row }) => {
      const { startDate, endDate } = row.original
      return (
        <span className="tabular-nums">
          {formatDateRange(startDate, endDate)}
        </span>
      )
    },
  },
  {
    accessorKey: 'duration',
    size: 130,
    minSize: 100,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: { label: 'รวมเวลา (ชม.)' },
    cell: ({ row }) => {
      const duration = row.getValue('duration') as number
      return <span className="tabular-nums">{duration}</span>
    },
  },
  {
    accessorKey: 'accreditationStatus',
    size: 175,
    minSize: 140,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'สถานะการรับรอง',
      options: accreditationStatusOptions,
      mergeStrategy: 'preserve',
    },
    cell: ({ row }) => {
      const status = row.getValue('accreditationStatus') as string
      const label = accreditationStatusLabelByValue.get(status) ?? status
      const variant = accreditationStatusVariant[status] ?? 'secondary'
      return <Badge variant={variant}>{label}</Badge>
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
