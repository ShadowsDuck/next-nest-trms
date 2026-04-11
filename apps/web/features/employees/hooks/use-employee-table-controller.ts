'use client'

import { useEffect, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import type { EmployeeSchemaQuery } from '@workspace/schemas'
import { useQueryStates } from 'nuqs'
import { fetchEmployees } from '../data'
import { employeeParsers } from '../lib/search-params'

type MultiFilterKey = 'prefix' | 'jobLevel' | 'status'
type MultiFilterParams = Pick<EmployeeSchemaQuery, MultiFilterKey>

const FILTER_KEYS = ['prefix', 'jobLevel', 'status'] as const

const FILTER_ALLOWED = {
  prefix,
  jobLevel,
  status: employeeStatus,
} as const

/**
 * Read values of one table filter from TanStack `columnFilters` state.
 */
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

/**
 * Keep only values that belong to an allowed enum list.
 */
function pickAllowed<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const set = new Set(allowed)

  return values.filter((value): value is T => set.has(value as T))
}

/**
 * Convert URL params -> table columnFilters state.
 */
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
    status: [],
  }

  for (const key of FILTER_KEYS) {
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
function hasActiveFilters(params: EmployeeSchemaQuery): boolean {
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
  function setFilter(partial: Partial<Omit<typeof params, 'page' | 'limit'>>) {
    void setParams({ ...partial, page: 1 })
  }

  /**
   * Update current page in URL params.
   */
  function setPage(page: number) {
    void setParams({ page })
  }

  /**
   * Update page size and reset to page 1.
   */
  function setLimit(limit: number) {
    void setParams({ limit, page: 1 })
  }

  /**
   * Load employees from API (keep previous rows during refetch).
   */
  const query = useQuery({
    queryKey: ['employees', params],
    queryFn: () => fetchEmployees(params),
    placeholderData: keepPreviousData,
  })

  const employees = query.data?.data ?? []
  const meta = query.data?.meta ?? {
    total: 0,
    page: params.page,
    limit: params.limit,
    totalPages: 1,
  }

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
  const pagination: PaginationState = {
    pageIndex: params.page - 1,
    pageSize: params.limit,
  }

  /**
   * Sync URL params -> filter UI state, so F5 keeps selected filters visible.
   */
  const filtersFromParams = buildColumnFiltersFromParams(params)

  useEffect(() => {
    if (JSON.stringify(columnFilters) !== JSON.stringify(filtersFromParams)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumnFilters(filtersFromParams)
    }
  }, [columnFilters, filtersFromParams])

  /**
   * Handle page/pageSize changes from the table component.
   */
  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater

    if (next.pageSize !== params.limit) {
      setLimit(next.pageSize)
      return
    }

    setPage(next.pageIndex + 1)
  }

  /**
   * Handle search input from DataTableSearchFilter.
   */
  function handleGlobalFilterChange(value: string | object) {
    setFilter({ search: typeof value === 'string' ? value : '' })
  }

  /**
   * Handle faceted filters, then write normalized values back to URL params.
   */
  function handleColumnFiltersChange(updater: Updater<ColumnFiltersState>) {
    const next =
      typeof updater === 'function' ? updater(columnFilters) : updater

    setColumnFilters(next)
    setFilter(buildFilterParamsFromColumnFilters(next))
  }

  return {
    params,
    columnFilters,
    employees,
    meta,
    pagination,
    isInitialLoading,
    isBackgroundFetching,
    isListFetching: query.isFetching || isParamsTransitioning,
    hasActiveFilters: hasActiveFilters(params),
    handlePaginationChange,
    handleGlobalFilterChange,
    handleColumnFiltersChange,
  }
}
