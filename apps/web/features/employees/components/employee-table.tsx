'use client'

import { useSyncExternalStore } from 'react'
import {
  EmployeeSchemaPaginationResponse,
  type EmployeeSchemaResponse,
} from '@workspace/schemas'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import EmployeesLoading from '@/app/admin/employees/loading'
import { DataTable } from '@/components/data-table'
import { useEmployeeFilters } from '../hooks/useEmployeeFilters'
import { EmployeeFilterBar } from './employee-filter-bar'

// ─── Hydration-safe client check ──────────────────────────────────────────────

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusColorMap: Record<string, string> = {
  Active:
    'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  Resigned:
    'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
}

function StatusBadge({ status }: { status: string }) {
  const color =
    statusColorMap[status] ?? 'bg-gray-100 text-gray-800 border-gray-300'
  return (
    <span
      className={`px-2 py-1 rounded-full border text-xs font-medium ${color}`}
    >
      {status}
    </span>
  )
}

function renderStatusCell(
  params: ICellRendererParams<EmployeeSchemaResponse, string>
) {
  if (!params.value) return null
  return <StatusBadge status={params.value} />
}

// ─── Column defs ──────────────────────────────────────────────────────────────

const columnDefs: ColDef<EmployeeSchemaResponse>[] = [
  {
    field: 'employeeNo',
    headerName: 'รหัสพนักงาน',
    width: 150,
  },
  {
    headerName: 'ชื่อ-นามสกุล',
    valueGetter: ({ data }) =>
      data ? `${data.prefix} ${data.firstName} ${data.lastName}` : '',
    flex: 1,
    minWidth: 200,
  },
  {
    field: 'jobLevel',
    headerName: 'ระดับงาน',
    width: 130,
  },
  {
    field: 'status',
    headerName: 'สถานะ',
    width: 150,
    cellRenderer: renderStatusCell,
  },
  {
    field: 'hireDate',
    headerName: 'วันที่เริ่มงาน',
    width: 180,
    valueFormatter: ({ value }) => {
      if (!value) return ''
      return new Date(value as string).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function EmployeeTable({
  data,
  meta,
}: EmployeeSchemaPaginationResponse) {
  const { params, setPage, setLimit, isLoading } = useEmployeeFilters()
  const isClient = useIsClient()

  if (!isClient) return <EmployeesLoading />

  return (
    <DataTable
      rowData={data}
      columnDefs={columnDefs}
      title="ข้อมูลพนักงาน (Employees)"
      description="จัดการข้อมูลพนักงานในระบบ TRMS"
      totalLabel={() => `จำนวนทั้งหมด ${meta.total} คน`}
      headerActions={<EmployeeFilterBar />}
      currentPage={params.page}
      pageSize={params.limit}
      totalPages={meta.totalPages}
      onPageChange={setPage}
      onPageSizeChange={setLimit}
      isLoading={isLoading}
    />
  )
}
