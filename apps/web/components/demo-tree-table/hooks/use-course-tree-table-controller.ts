'use client'

import { useEffect, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import type { EmployeeQuery } from '@workspace/schemas'
import { useQueryStates } from 'nuqs'
import { fetchEmployees } from '../../../features/employees/data'
import { courseParsers } from '../lib/search-params'

type MultiFilterKey = 'prefix' | 'jobLevel' | 'status'
type MultiFilterParams = Pick<EmployeeQuery, MultiFilterKey>

const FILTER_KEYS = ['prefix', 'jobLevel', 'status'] as const

const FILTER_ALLOWED = {
  prefix,
  jobLevel,
  status: employeeStatus,
} as const

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

function pickAllowed<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const allowedSet = new Set(allowed)
  return values.filter((value): value is T => allowedSet.has(value as T))
}

function buildColumnFiltersFromParams(
  params: MultiFilterParams
): ColumnFiltersState {
  return FILTER_KEYS.flatMap((key) => {
    const values = params[key] ?? []
    return values.length > 0 ? [{ id: key, value: values }] : []
  })
}

function setFilterParam<K extends MultiFilterKey>(
  target: MultiFilterParams,
  key: K,
  value: MultiFilterParams[K]
) {
  target[key] = value
}

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

function hasActiveFilters(params: EmployeeQuery): boolean {
  return (
    Boolean(params.search) ||
    FILTER_KEYS.some((key) => (params[key]?.length ?? 0) > 0)
  )
}

export function useCourseTreeTableController() {
  const [isParamsTransitioning, startTransition] = useTransition()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [params, setParams] = useQueryStates(courseParsers, {
    shallow: false,
    throttleMs: 300,
    startTransition,
  })

  function setFilter(partial: Partial<Omit<typeof params, 'page' | 'limit'>>) {
    void setParams({ ...partial, page: 1 })
  }

  function setPage(page: number) {
    void setParams({ page })
  }

  function setLimit(limit: number) {
    void setParams({ limit, page: 1 })
  }

  const query = useQuery({
    queryKey: ['course-tree-employees', params],
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

  const isInitialLoading = query.isLoading && !query.data
  const isBackgroundFetching =
    (query.isFetching || isParamsTransitioning) && !isInitialLoading

  const pagination: PaginationState = {
    pageIndex: params.page - 1,
    pageSize: params.limit,
  }

  const filtersFromParams = buildColumnFiltersFromParams(params)

  useEffect(() => {
    if (JSON.stringify(columnFilters) !== JSON.stringify(filtersFromParams)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumnFilters(filtersFromParams)
    }
  }, [columnFilters, filtersFromParams])

  function handlePaginationChange(updater: Updater<PaginationState>) {
    const next = typeof updater === 'function' ? updater(pagination) : updater

    if (next.pageSize !== params.limit) {
      setLimit(next.pageSize)
      return
    }

    setPage(next.pageIndex + 1)
  }

  function handleGlobalFilterChange(value: string | object) {
    setFilter({ search: typeof value === 'string' ? value : '' })
  }

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
