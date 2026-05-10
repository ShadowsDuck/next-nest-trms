'use client'

import type { TrainingRecordResponse } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import { DataTableColumnHeader } from '@/shared/components/niko-table/components/data-table-column-header'
import { DataTableColumnSortMenu } from '@/shared/components/niko-table/components/data-table-column-sort'
import { DataTableColumnTitle } from '@/shared/components/niko-table/components/data-table-column-title'
import type { DataTableColumnDef } from '@/shared/components/niko-table/types'
import { Eye } from 'lucide-react'
import {
  formatCourseDateRange,
  getTrainingCategoryBadgeStyle,
} from '../lib/employee-detail'

const courseTypeLabelByValue = new Map<string, string>([
  ['Internal', 'ภายใน'],
  ['External', 'ภายนอก'],
])

// สร้าง column definition ของตารางประวัติการอบรมให้ใช้ร่วมกับ Niko Table
export function useEmployeeTrainingHistoryColumns({
  onPreviewCertificate,
}: {
  onPreviewCertificate: (trainingRecord: TrainingRecordResponse) => void
}): DataTableColumnDef<TrainingRecordResponse>[] {
  return [
    {
      id: 'courseTitle',
      accessorFn: (row) => row.course?.title ?? '',
      size: 320,
      minSize: 260,
      header: () => (
        <DataTableColumnHeader className="ml-2">
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: 'ชื่อหลักสูตร',
      },
      cell: ({ row }) => (
        <div className="ml-2 py-1 font-medium text-slate-900">
          {row.original.course?.title ?? '-'}
        </div>
      ),
    },
    {
      id: 'courseType',
      accessorFn: (row) => row.course?.type ?? '',
      size: 130,
      minSize: 120,
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: 'ประเภท',
      },
      cell: ({ row }) =>
        courseTypeLabelByValue.get(row.original.course?.type ?? '') ??
        row.original.course?.type ??
        '-',
    },
    {
      id: 'courseCategory',
      accessorFn: (row) => row.course?.tag?.name ?? '',
      size: 160,
      minSize: 150,
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: 'หมวดหมู่',
      },
      cell: ({ row }) => (
        <span
          className="inline-flex rounded-md px-2 py-1 text-xs font-medium"
          style={getTrainingCategoryBadgeStyle(
            row.original.course?.tag?.colorCode
          )}
        >
          {row.original.course?.tag?.name ?? 'ไม่ระบุ'}
        </span>
      ),
    },
    {
      id: 'courseEndDate',
      accessorFn: (row) => row.course?.endDate ?? row.course?.startDate ?? '',
      size: 220,
      minSize: 210,
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: 'ช่วงวันที่',
      },
      cell: ({ row }) => (
        <span className="text-slate-600">
          {formatCourseDateRange(row.original)}
        </span>
      ),
    },
    {
      id: 'courseDuration',
      accessorFn: (row) => Number(row.course?.duration ?? 0),
      size: 110,
      minSize: 100,
      header: () => (
        <DataTableColumnHeader>
          <DataTableColumnTitle />
          <DataTableColumnSortMenu />
        </DataTableColumnHeader>
      ),
      meta: {
        label: 'รวมเวลา (ชม.)',
      },
      cell: ({ row }) => (
        <div className="text-start font-medium text-slate-900">
          {Number(row.original.course?.duration ?? 0).toLocaleString('th-TH')}
        </div>
      ),
    },
    {
      id: 'certificate',
      size: 110,
      minSize: 110,
      header: () => (
        <DataTableColumnHeader className="justify-center">
          <DataTableColumnTitle />
        </DataTableColumnHeader>
      ),
      meta: {
        label: 'ใบรับรอง',
      },
      cell: ({ row }) => {
        const hasCertificate = Boolean(row.original.certFilePath)

        return (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!hasCertificate}
              onClick={() => {
                if (!hasCertificate) {
                  return
                }

                onPreviewCertificate(row.original)
              }}
            >
              <Eye className="size-4" />
              <span className="sr-only">ดูใบรับรอง</span>
            </Button>
          </div>
        )
      },
      enableSorting: false,
    },
  ]
}
