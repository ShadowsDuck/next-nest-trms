'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { useQueryStates } from 'nuqs'
import { getAllCourses } from '@/domains/courses'
import {
  courseParsers,
  courseTableFilterConfig,
  courseTableFilterDefaults,
  courseTableFilterKeys,
} from '@/domains/courses'
import {
  buildColumnFiltersFromParams,
  buildFilterParamsFromColumnFilters,
  buildPaginationMeta,
  buildPaginationState,
  buildTableLoadingState,
  hasActiveTableFilters,
  shouldSyncColumnFilters,
} from '@/shared/lib/table-state'
import { buildCoursesQueryKey } from '../options/query-options'

type CourseTableFilterParams = typeof courseTableFilterDefaults

export function useCourseTableController() {
  const [isParamsTransitioning, startTransition] = useTransition()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [params, setParams] = useQueryStates(courseParsers, {
    shallow: false,
    throttleMs: 300,
    startTransition,
  })

  const setFilter = useCallback(
    (partial: Partial<Omit<typeof params, 'page' | 'limit'>>) => {
      void setParams({ ...partial, page: 1 })
    },
    [setParams]
  )

  const setPage = useCallback(
    (page: number) => void setParams({ page }),
    [setParams]
  )

  const setLimit = useCallback(
    (limit: number) => void setParams({ limit, page: 1 }),
    [setParams]
  )

  const queryKey = useMemo(() => buildCoursesQueryKey(params), [params])

  const query = useQuery({
    queryKey,
    queryFn: () => getAllCourses(params),
    placeholderData: keepPreviousData,
  })

  const courses = query.data?.data ?? []
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

  const pagination: PaginationState = useMemo(
    () => buildPaginationState(params.page, params.limit),
    [params.page, params.limit]
  )

  const filtersFromParams = useMemo(
    () => buildColumnFiltersFromParams(params, courseTableFilterConfig),
    [params]
  )

  useEffect(() => {
    if (shouldSyncColumnFilters(columnFilters, filtersFromParams)) {
      setColumnFilters(filtersFromParams)
    }
  }, [columnFilters, filtersFromParams])

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

  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      setFilter({ search: typeof value === 'string' ? value : '' })
    },
    [setFilter]
  )

  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const next =
        typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFilters(next)
      setFilter(
        buildFilterParamsFromColumnFilters(
          next,
          courseTableFilterConfig,
          courseTableFilterDefaults
        ) as CourseTableFilterParams
      )
    },
    [columnFilters, setFilter]
  )

  const hasFilters = useMemo(
    () => hasActiveTableFilters(params, courseTableFilterKeys),
    [params]
  )

  return {
    params,
    columnFilters,
    courses,
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
