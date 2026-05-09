'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import type { EmployeeQuery } from '@workspace/schemas'
import { useQueryStates } from 'nuqs'
import { getAllEmployees } from '@/domains/employees'
import { employeeParsers } from '@/domains/employees'
import {
  columnFiltersKey,
  getFilterValues,
  pickAllowed,
} from '@/shared/lib/table-filter-utils'
import { buildEmployeesQueryKey } from '../options/query-options'

type MultiFilterKey =
  | 'prefix'
  | 'jobLevel'
  | 'divisionName'
  | 'departmentName'
  | 'status'
type MultiFilterParams = Pick<EmployeeQuery, MultiFilterKey>

const FILTER_KEYS = [
  'prefix',
  'jobLevel',
  'divisionName',
  'departmentName',
  'status',
] as const

const FILTER_ALLOWED = {
  prefix,
  jobLevel,
  status: employeeStatus,
  divisionName: [] as const,
  departmentName: [] as const,
} as const

// แปลง URL params ไปเป็น column filters เพื่อคืน state หลัง refresh หน้า
function buildColumnFiltersFromParams(
  params: MultiFilterParams
): ColumnFiltersState {
  return FILTER_KEYS.flatMap((key) => {
    const values = params[key] ?? []
    return values.length > 0 ? [{ id: key, value: values }] : []
  })
}

/**
 * Assign value to a single filter key with safe TypeScript inference.
 */
function setFilterParam<K extends MultiFilterKey>(
  target: MultiFilterParams,
  key: K,
  value: MultiFilterParams[K]
) {
  target[key] = value
}

/**
 * Convert table columnFilters -> URL filter params.
 */
function buildFilterParamsFromColumnFilters(
  filters: ColumnFiltersState
): MultiFilterParams {
  const next: MultiFilterParams = {
    prefix: [],
    jobLevel: [],
    divisionName: [],
    departmentName: [],
    status: [],
  }

  for (const key of FILTER_KEYS) {
    if (key === 'divisionName' || key === 'departmentName') {
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

/**
 * Check if any search/filter is active for empty-state mode.
 */
function hasActiveFilters(params: EmployeeQuery): boolean {
  return (
    Boolean(params.search) ||
    FILTER_KEYS.some((key) => (params[key]?.length ?? 0) > 0)
  )
}

export function useEmployeeTableController() {
  const [isParamsTransitioning, startTransition] = useTransition()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  /**
   * URL is the single source of truth for search/filter/page.
   */
  const [params, setParams] = useQueryStates(employeeParsers, {
    shallow: false,
    throttleMs: 300,
    startTransition,
  })

  /**
   * Update filter/search params and always reset to page 1.
   */
  const setFilter = useCallback(
    (partial: Partial<Omit<typeof params, 'page' | 'limit'>>) => {
      void setParams({ ...partial, page: 1 })
    },
    [setParams]
  )

  /**
   * Update current page in URL params.
   */
  const setPage = useCallback(
    (page: number) => {
      void setParams({ page })
    },
    [setParams]
  )

  /**
   * Update page size and reset to page 1.
   */
  const setLimit = useCallback(
    (limit: number) => {
      void setParams({ limit, page: 1 })
    },
    [setParams]
  )

  const queryKey = useMemo(() => buildEmployeesQueryKey(params), [params])

  /**
   * Load employees from API (keep previous rows during refetch).
   */
  const query = useQuery({
    queryKey,
    queryFn: () => getAllEmployees(params),
    placeholderData: keepPreviousData,
  })

  const employees = query.data?.data ?? []
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

  /**
   * First load = no data yet and request is in-flight.
   */
  const isInitialLoading = query.isLoading && !query.data

  /**
   * Background fetch = refetching while old data is still shown.
   */
  const isBackgroundFetching =
    (query.isFetching || isParamsTransitioning) && !isInitialLoading

  /**
   * TanStack pagination is 0-based, API params are 1-based.
   */
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: params.page - 1,
      pageSize: params.limit,
    }),
    [params.page, params.limit]
  )

  /**
   * Sync URL params -> filter UI state, so F5 keeps selected filters visible.
   */
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
      setColumnFilters(filtersFromParams)
    }
  }, [currentFiltersKey, filtersFromParamsKey, filtersFromParams])

  /**
   * Handle page/pageSize changes from the table component.
   */
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

  /**
   * Handle search input from DataTableSearchFilter.
   */
  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      setFilter({ search: typeof value === 'string' ? value : '' })
    },
    [setFilter]
  )

  /**
   * Handle faceted filters, then write normalized values back to URL params.
   */
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
    employees,
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
