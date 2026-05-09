'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { useQueryStates } from 'nuqs'
import { getAllEmployees } from '@/domains/employees'
import {
  employeeParsers,
  employeeTableFilterConfig,
  employeeTableFilterDefaults,
  employeeTableFilterKeys,
} from '@/domains/employees'
import {
  buildColumnFiltersFromParams,
  buildFilterParamsFromColumnFilters,
  buildPaginationMeta,
  buildPaginationState,
  buildTableLoadingState,
  hasActiveTableFilters,
  shouldSyncColumnFilters,
} from '@/shared/lib/table-state'
import { buildEmployeesQueryKey } from '../options/query-options'

type EmployeeTableFilterParams = typeof employeeTableFilterDefaults

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
    () => buildPaginationMeta(query.data?.meta, params.page, params.limit),
    [query.data?.meta, params.page, params.limit]
  )
  const loadingState = useMemo(
    () =>
      buildTableLoadingState({
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        hasData: Boolean(query.data),
        isParamsTransitioning,
      }),
    [isParamsTransitioning, query.data, query.isFetching, query.isLoading]
  )

  /**
   * TanStack pagination is 0-based, API params are 1-based.
   */
  const pagination: PaginationState = useMemo(
    () => buildPaginationState(params.page, params.limit),
    [params.page, params.limit]
  )

  /**
   * Sync URL params -> filter UI state, so F5 keeps selected filters visible.
   */
  const filtersFromParams = useMemo(
    () => buildColumnFiltersFromParams(params, employeeTableFilterConfig),
    [params]
  )

  useEffect(() => {
    if (shouldSyncColumnFilters(columnFilters, filtersFromParams)) {
      setColumnFilters(filtersFromParams)
    }
  }, [columnFilters, filtersFromParams])

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
      setFilter(
        buildFilterParamsFromColumnFilters(
          next,
          employeeTableFilterConfig,
          employeeTableFilterDefaults
        ) as EmployeeTableFilterParams
      )
    },
    [columnFilters, setFilter]
  )

  const hasFilters = useMemo(
    () => hasActiveTableFilters(params, employeeTableFilterKeys),
    [params]
  )

  return {
    params,
    columnFilters,
    employees,
    meta,
    pagination,
    isInitialLoading: loadingState.isInitialLoading,
    isBackgroundFetching: loadingState.isBackgroundFetching,
    isListFetching: loadingState.isListFetching,
    hasActiveFilters: hasFilters,
    handlePaginationChange,
    handleGlobalFilterChange,
    handleColumnFiltersChange,
  }
}
