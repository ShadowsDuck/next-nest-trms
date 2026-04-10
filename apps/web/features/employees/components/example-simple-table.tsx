'use client'

import { useCallback, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/react-table'
import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import type { EmployeeSchemaResponse } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { cn } from '@workspace/ui/lib/utils'
import { SearchX, UserSearch, X } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { DataTableColumnHeader } from '@/components/niko-table/components/data-table-column-header'
import { DataTableColumnTitle } from '@/components/niko-table/components/data-table-column-title'
import {
  DataTableEmptyDescription,
  DataTableEmptyFilteredMessage,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from '@/components/niko-table/components/data-table-empty-state'
import { DataTablePagination } from '@/components/niko-table/components/data-table-pagination'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableSortMenu } from '@/components/niko-table/components/data-table-sort-menu'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
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

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL = '__all__'

const prefixOptions = [
  { label: 'นาย', value: 'Mr' },
  { label: 'นาง', value: 'Mrs' },
  { label: 'นางสาว', value: 'Miss' },
] satisfies { label: string; value: (typeof prefix)[number] }[]

const jobLevelOptions = jobLevel.map((v) => ({ label: v, value: v }))

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Resigned', value: 'Resigned' },
] satisfies { label: string; value: (typeof employeeStatus)[number] }[]

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

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: DataTableColumnDef<EmployeeSchemaResponse>[] = [
  {
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="เลือกทั้งหมด"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="เลือกแถว"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'employeeNo',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle>รหัสพนักงาน</DataTableColumnTitle>
      </DataTableColumnHeader>
    ),
    meta: { label: 'รหัสพนักงาน' },
  },
  {
    id: 'fullName',
    accessorFn: (row) => `${row.prefix} ${row.firstName} ${row.lastName}`,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle>ชื่อ-นามสกุล</DataTableColumnTitle>
      </DataTableColumnHeader>
    ),
    meta: { label: 'ชื่อ-นามสกุล' },
    enableSorting: false,
  },
  {
    accessorKey: 'jobLevel',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle>ระดับงาน</DataTableColumnTitle>
      </DataTableColumnHeader>
    ),
    meta: { label: 'ระดับงาน' },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle>สถานะ</DataTableColumnTitle>
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    meta: { label: 'สถานะ' },
    enableSorting: false,
  },
  {
    accessorKey: 'hireDate',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle>วันที่เริ่มงาน</DataTableColumnTitle>
      </DataTableColumnHeader>
    ),
    meta: { label: 'วันที่เริ่มงาน' },
    cell: ({ row }) => {
      const v = row.getValue<string>('hireDate')
      if (!v) return null
      return (
        <span>
          {new Date(v).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )
    },
  },
]

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterBarProps = {
  prefixVal: string[]
  jobLevelVal: string[]
  statusVal: string[]
  onPrefix: (v: string) => void
  onJobLevel: (v: string) => void
  onStatus: (v: string) => void
  onClear: () => void
  hasActiveFilter: boolean
}

function EmployeeFilterBar({
  prefixVal,
  jobLevelVal,
  statusVal,
  onPrefix,
  onJobLevel,
  onStatus,
  onClear,
  hasActiveFilter,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={prefixVal[0] ?? ALL} onValueChange={onPrefix}>
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="คำนำหน้า" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>ทั้งหมด</SelectItem>
          {prefixOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={jobLevelVal[0] ?? ALL} onValueChange={onJobLevel}>
        <SelectTrigger className="h-8 w-32 text-sm">
          <SelectValue placeholder="ระดับงาน" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>ทั้งหมด</SelectItem>
          {jobLevelOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusVal[0] ?? ALL} onValueChange={onStatus}>
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>ทั้งหมด</SelectItem>
          {statusOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 gap-1 px-2 text-sm text-muted-foreground"
        >
          <X className="h-3 w-3" />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExampleSimpleTable() {
  const [params, setParams] = useQueryStates(employeeParsers, {
    shallow: true,
  })

  const [rowSelection, setRowSelection] = useState({})

  // ─── Fetch data ด้วย useQuery ─────────────────────────────────────────────

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['employees', params],
    queryFn: () => fetchEmployees(params),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  })

  const employees = useMemo(() => data?.data ?? [], [data?.data])
  const meta = useMemo(
    () =>
      data?.meta ?? { total: 0, page: 1, limit: params.limit, totalPages: 1 },
    [data?.meta, params.limit]
  )

  // ─── Table state ──────────────────────────────────────────────────────────

  const pagination = useMemo<PaginationState>(
    () => ({ pageIndex: params.page - 1, pageSize: params.limit }),
    [params.page, params.limit]
  )

  const sorting = useMemo<SortingState>(() => [], [])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      void setParams({ page: next.pageIndex + 1, limit: next.pageSize })
    },
    [pagination, setParams]
  )

  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      const search = typeof value === 'string' ? value : ''
      void setParams({ search, page: 1 })
    },
    [setParams]
  )

  const handlePrefix = useCallback(
    (v: string) =>
      void setParams({
        prefix: v === ALL ? [] : [v as (typeof prefix)[number]],
        page: 1,
      }),
    [setParams]
  )

  const handleJobLevel = useCallback(
    (v: string) =>
      void setParams({
        jobLevel: v === ALL ? [] : [v as (typeof jobLevel)[number]],
        page: 1,
      }),
    [setParams]
  )

  const handleStatus = useCallback(
    (v: string) =>
      void setParams({
        status: v === ALL ? [] : [v as (typeof employeeStatus)[number]],
        page: 1,
      }),
    [setParams]
  )

  const handleClearFilters = useCallback(
    () =>
      void setParams({
        prefix: [],
        jobLevel: [],
        status: [],
        search: '',
        page: 1,
      }),
    [setParams]
  )

  const hasActiveFilter =
    params.prefix.length > 0 ||
    params.jobLevel.length > 0 ||
    params.status.length > 0 ||
    params.search.length > 0

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-2 p-4">
      <div>
        <h2 className="text-xl font-bold">ข้อมูลพนักงาน</h2>
        <p className="text-sm text-muted-foreground">
          จัดการข้อมูลพนักงานในระบบ TRMS — จำนวนทั้งหมด {meta.total} คน
        </p>
      </div>

      <DataTableRoot
        data={employees}
        columns={columns}
        isLoading={isLoading}
        config={{
          manualPagination: true,
          manualFiltering: true,
          manualSorting: true,
          pageCount: meta.totalPages,
          enablePagination: true,
          enableSorting: true,
          enableFilters: true,
          enableRowSelection: true,
        }}
        state={{
          pagination,
          sorting,
          globalFilter: params.search,
          rowSelection,
        }}
        onPaginationChange={handlePaginationChange}
        onSortingChange={() => {}}
        onGlobalFilterChange={handleGlobalFilterChange}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
      >
        <DataTableToolbarSection className="w-full flex-col items-start gap-2">
          <DataTableToolbarSection className="w-full px-0">
            <DataTableSearchFilter placeholder="ค้นหารหัส, ชื่อ, นามสกุล..." />
            <DataTableSortMenu />
          </DataTableToolbarSection>
          <EmployeeFilterBar
            prefixVal={params.prefix}
            jobLevelVal={params.jobLevel}
            statusVal={params.status}
            onPrefix={handlePrefix}
            onJobLevel={handleJobLevel}
            onStatus={handleStatus}
            onClear={handleClearFilters}
            hasActiveFilter={hasActiveFilter}
          />
        </DataTableToolbarSection>

        <div
          className={cn(
            'relative transition-opacity duration-200',
            isFetching && !isLoading && 'opacity-50 pointer-events-none'
          )}
        >
          <DataTable>
            <DataTableHeader />
            <DataTableBody>
              <DataTableSkeleton rows={params.limit} />
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <UserSearch className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>ไม่มีข้อมูลพนักงาน</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    ยังไม่มีพนักงานในระบบ
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>ไม่พบผลลัพธ์</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    ลองปรับเงื่อนไขการค้นหาหรือตัวกรองใหม่
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>
        </div>

        <DataTablePagination totalCount={meta.total} isFetching={isFetching} />
      </DataTableRoot>
    </div>
  )
}
