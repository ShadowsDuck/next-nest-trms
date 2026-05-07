'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { auditAction } from '@workspace/schemas'
import type { AuditLogQuery } from '@workspace/schemas'
import { useQueryStates } from 'nuqs'
import { auditLogParsers, getAllAuditLogs } from '@/domains/audit-logs'
import { buildAuditLogsQueryKey } from '../options/query-options'

type MultiFilterKey = 'model' | 'action' | 'dateRange'
type MultiFilterParams = Pick<AuditLogQuery, MultiFilterKey>

const FILTER_KEYS = ['model', 'action', 'dateRange'] as const

const FILTER_ALLOWED = {
  action: auditAction,
} as const

// แปลงชื่อ query key ให้ตรงกับ column id ที่ table layer จะใช้งานจริง
function toColumnId(key: MultiFilterKey): string {
  if (key === 'dateRange') return 'timestamp'
  return key
}

// อ่านค่าตัวกรองชนิดข้อความจาก TanStack column filters
function getFilterValues(filters: ColumnFiltersState, id: string): string[] {
  const found = filters.find((item) => item.id === id)
  if (!found) return []

  const raw = found.value as unknown

  if (Array.isArray(raw)) {
    return raw.map(String)
  }

  if (raw && typeof raw === 'object' && 'value' in raw) {
    const nested = (raw as { value: unknown }).value

    if (Array.isArray(nested)) {
      return nested.map(String)
    }

    return nested == null ? [] : [String(nested)]
  }

  return raw == null ? [] : [String(raw)]
}

// อ่านค่าตัวกรองชนิดตัวเลขจาก TanStack column filters
function getNumericFilterValues(
  filters: ColumnFiltersState,
  id: string
): number[] {
  const found = filters.find((item) => item.id === id)
  if (!found) return []

  const raw = found.value as unknown
  const values = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && 'value' in raw
      ? (raw as { value: unknown }).value
      : raw == null
        ? []
        : [raw]

  if (!Array.isArray(values)) {
    const numericValue = Number(values)
    return Number.isFinite(numericValue) ? [numericValue] : []
  }

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
}

// คัดเฉพาะค่าที่อยู่ใน enum ที่รองรับเท่านั้น
function pickAllowed<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const set = new Set(allowed)
  return values.filter((value): value is T => set.has(value as T))
}

// แปลง URL params ไปเป็น column filters เพื่อคืน state หลัง refresh หน้า
function buildColumnFiltersFromParams(
  params: MultiFilterParams
): ColumnFiltersState {
  return FILTER_KEYS.flatMap((key) => {
    const values = params[key] ?? []
    return values.length > 0 ? [{ id: toColumnId(key), value: values }] : []
  })
}

// สร้าง key แบบคงที่สำหรับเทียบความเปลี่ยนแปลงของ column filters
function columnFiltersKey(filters: ColumnFiltersState): string {
  return filters
    .map((filter) => {
      const raw = filter.value as unknown

      if (Array.isArray(raw)) {
        return `${filter.id}:${raw.map(String).join(',')}`
      }

      if (raw && typeof raw === 'object' && 'value' in raw) {
        const nested = (raw as { value: unknown }).value

        if (Array.isArray(nested)) {
          return `${filter.id}:${nested.map(String).join(',')}`
        }

        return `${filter.id}:${nested == null ? '' : String(nested)}`
      }

      return `${filter.id}:${raw == null ? '' : String(raw)}`
    })
    .sort()
    .join('|')
}

// กำหนดค่าให้ object ของ filter params โดยคง type inference ให้ปลอดภัย
function setFilterParam<K extends MultiFilterKey>(
  target: MultiFilterParams,
  key: K,
  value: MultiFilterParams[K]
) {
  target[key] = value
}

// แปลง column filters กลับไปเป็น URL params สำหรับใช้กับ nuqs
function buildFilterParamsFromColumnFilters(
  filters: ColumnFiltersState
): MultiFilterParams {
  const next: MultiFilterParams = {
    model: [],
    action: [],
    dateRange: [],
  }

  for (const key of FILTER_KEYS) {
    if (key === 'dateRange') {
      setFilterParam(next, key, getNumericFilterValues(filters, 'timestamp'))
      continue
    }

    if (key === 'model') {
      setFilterParam(next, key, getFilterValues(filters, key))
      continue
    }

    const values = pickAllowed(
      getFilterValues(filters, key),
      FILTER_ALLOWED[key]
    )
    setFilterParam(next, key, values as MultiFilterParams[typeof key])
  }

  return next
}

// ตรวจว่าหน้าตารางมี search หรือ filter ใดถูกใช้งานอยู่หรือไม่
function hasActiveFilters(params: AuditLogQuery): boolean {
  return (
    Boolean(params.search) ||
    FILTER_KEYS.some((key) => (params[key]?.length ?? 0) > 0)
  )
}

// ควบคุม state ของตาราง audit logs โดยให้ URL เป็น source of truth
export function useAuditLogTableController() {
  const [isParamsTransitioning, startTransition] = useTransition()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [params, setParams] = useQueryStates(auditLogParsers, {
    shallow: false,
    throttleMs: 300,
    startTransition,
  })

  // อัปเดต filter/search ใน URL และรีเซ็ตกลับไปหน้าแรกเสมอ
  const setFilter = useCallback(
    (partial: Partial<Omit<typeof params, 'page' | 'limit'>>) => {
      void setParams({ ...partial, page: 1 })
    },
    [setParams]
  )

  // อัปเดตหน้าปัจจุบันลง URL params
  const setPage = useCallback(
    (page: number) => {
      void setParams({ page })
    },
    [setParams]
  )

  // อัปเดต page size และรีเซ็ตกลับหน้าแรก
  const setLimit = useCallback(
    (limit: number) => {
      void setParams({ limit, page: 1 })
    },
    [setParams]
  )

  const queryKey = useMemo(() => buildAuditLogsQueryKey(params), [params])

  const query = useQuery({
    queryKey,
    queryFn: () => getAllAuditLogs(params),
    placeholderData: keepPreviousData,
  })

  const auditLogs = query.data?.data ?? []
  const meta = useMemo(
    () =>
      query.data?.meta ?? {
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 1,
      },
    [query.data?.meta, params.page, params.limit]
  )

  // ระบุสถานะโหลดครั้งแรกเมื่อยังไม่มีข้อมูลเก่าให้แสดง
  const isInitialLoading = query.isLoading && !query.data

  // ระบุสถานะ refetch เบื้องหลังโดยยังคงข้อมูลเดิมไว้บนหน้าจอ
  const isBackgroundFetching =
    (query.isFetching || isParamsTransitioning) && !isInitialLoading

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: params.page - 1,
      pageSize: params.limit,
    }),
    [params.page, params.limit]
  )

  const filtersFromParams = useMemo(
    () => buildColumnFiltersFromParams(params),
    [params]
  )
  const currentFiltersKey = useMemo(
    () => columnFiltersKey(columnFilters),
    [columnFilters]
  )
  const filtersFromParamsKey = useMemo(
    () => columnFiltersKey(filtersFromParams),
    [filtersFromParams]
  )

  useEffect(() => {
    if (currentFiltersKey !== filtersFromParamsKey) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumnFilters(filtersFromParams)
    }
  }, [currentFiltersKey, filtersFromParamsKey, filtersFromParams])

  // แปลง event pagination จาก TanStack ให้ sync กลับไปยัง URL params
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater

      if (next.pageSize !== params.limit) {
        setLimit(next.pageSize)
        return
      }

      setPage(next.pageIndex + 1)
    },
    [pagination, params.limit, setLimit, setPage]
  )

  // sync ค่า global search จากตารางกลับไปยัง URL params
  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      setFilter({ search: typeof value === 'string' ? value : '' })
    },
    [setFilter]
  )

  // sync ค่า column filters จากตารางกลับไปยัง URL params
  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const next =
        typeof updater === 'function' ? updater(columnFilters) : updater

      setColumnFilters(next)
      setFilter(buildFilterParamsFromColumnFilters(next))
    },
    [columnFilters, setFilter]
  )

  const hasFilters = useMemo(() => hasActiveFilters(params), [params])

  return {
    params,
    columnFilters,
    auditLogs,
    meta,
    pagination,
    isInitialLoading,
    isBackgroundFetching,
    isListFetching: query.isFetching || isParamsTransitioning,
    hasActiveFilters: hasFilters,
    handlePaginationChange,
    handleGlobalFilterChange,
    handleColumnFiltersChange,
  }
}
