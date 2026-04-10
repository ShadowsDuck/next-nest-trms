'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { EmployeeSchemaResponse } from '@workspace/schemas'
import { useQueryStates } from 'nuqs'
import { DataTable } from '@/components/niko-table/core/data-table'
import { DataTableRoot } from '@/components/niko-table/core/data-table-root'
import {
  DataTableBody,
  DataTableEmptyBody,
  DataTableHeader,
  DataTableSkeleton,
} from '@/components/niko-table/core/data-table-structure'
import type { DataTableColumnDef } from '@/components/niko-table/types'
import { fetchEmployees } from '../data'
import { employeeParsers } from '../lib/search-params'

const columns: DataTableColumnDef<EmployeeSchemaResponse>[] = [
  {
    accessorKey: 'employeeNo',
    header: 'รหัสพนักงาน',
  },
  {
    id: 'fullName',
    accessorFn: (row) => `${row.prefix} ${row.firstName} ${row.lastName}`,
    header: 'ชื่อ-นามสกุล',
  },
  {
    accessorKey: 'status',
    header: 'สถานะ',
  },
]

const fallbackData: EmployeeSchemaResponse[] = []

export function SimpleTable() {
  const [params] = useQueryStates(employeeParsers, { shallow: true })

  const { data, isLoading } = useQuery({
    queryKey: ['employees', params],
    queryFn: () => fetchEmployees(params),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })

  // Ensure stable reference for the empty state
  const tableData = data?.data ?? fallbackData

  return (
    <div className="p-4">
      <DataTableRoot
        data={tableData}
        columns={columns}
        isLoading={isLoading}
      >
        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            <DataTableSkeleton rows={10} />
            <DataTableEmptyBody>
              <div className="py-10 text-center text-muted-foreground">
                ไม่พบข้อมูลพนักงาน
              </div>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>
      </DataTableRoot>
    </div>
  )
}
