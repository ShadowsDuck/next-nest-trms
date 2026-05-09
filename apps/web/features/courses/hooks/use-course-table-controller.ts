'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { accreditationStatus, courseType } from '@workspace/schemas'
import type { CourseQuery } from '@workspace/schemas'
import { useQueryStates } from 'nuqs'
import { getAllCourses } from '@/domains/courses'
import { courseParsers } from '@/domains/courses'
import {
  columnFiltersKey,
  getFilterValues,
  getNumericFilterValues,
  pickAllowed,
} from '@/shared/lib/table-filter-utils'
import { buildCoursesQueryKey } from '../options/query-options'

type MultiFilterKey =
  | 'type'
  | 'tagName'
  | 'dateRange'
  | 'durationRange'
  | 'accreditationStatus'
type MultiFilterParams = Pick<CourseQuery, MultiFilterKey>

const FILTER_KEYS = [
  'type',
  'tagName',
  'dateRange',
  'durationRange',
  'accreditationStatus',
] as const

const FILTER_ALLOWED = {
  type: courseType,
  accreditationStatus: accreditationStatus,
} as const

function toColumnId(key: MultiFilterKey): string {
  if (key === 'durationRange') return 'duration'
  return key
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
    type: [],
    tagName: [],
    dateRange: [],
    durationRange: [],
    accreditationStatus: [],
  }

  for (const key of FILTER_KEYS) {
    if (key === 'tagName') {
      setFilterParam(next, key, getFilterValues(filters, key))
      continue
    }

    if (key === 'dateRange') {
      setFilterParam(next, key, getNumericFilterValues(filters, key))
      continue
    }

    if (key === 'durationRange') {
      setFilterParam(next, key, getNumericFilterValues(filters, 'duration'))
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

function hasActiveFilters(params: CourseQuery): boolean {
  return (
    Boolean(params.search) ||
    FILTER_KEYS.some((key) => (params[key]?.length ?? 0) > 0)
  )
}

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
    () =>
      query.data?.meta ?? {
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 1,
      },
    [query.data?.meta, params.page, params.limit]
  )

  const isInitialLoading = query.isLoading && !query.data
  const isBackgroundFetching =
    (query.isFetching || isParamsTransitioning) && !isInitialLoading

  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: params.page - 1, pageSize: params.limit }),
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
      setColumnFilters(filtersFromParams)
    }
  }, [currentFiltersKey, filtersFromParamsKey, filtersFromParams])

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
      setFilter(buildFilterParamsFromColumnFilters(next))
    },
    [columnFilters, setFilter]
  )

  const hasFilters = useMemo(() => hasActiveFilters(params), [params])

  return {
    params,
    columnFilters,
    courses,
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
