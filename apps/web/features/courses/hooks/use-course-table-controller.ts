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
import { getAllCourses } from '@/domains/courses/data/get-all-courses'
import { courseParsers } from '@/domains/courses/lib/search-params'

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

function getFilterValues(filters: ColumnFiltersState, id: string): string[] {
  const found = filters.find((item) => item.id === id)
  if (!found) return []
  const raw = found.value as unknown

  if (Array.isArray(raw)) return raw.map(String)

  if (raw && typeof raw === 'object' && 'value' in raw) {
    const nested = (raw as { value: unknown }).value
    if (Array.isArray(nested)) return nested.map(String)
    return nested == null ? [] : [String(nested)]
  }

  return raw == null ? [] : [String(raw)]
}

function pickAllowed<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const set = new Set(allowed)
  return values.filter((value): value is T => set.has(value as T))
}

function buildColumnFiltersFromParams(
  params: MultiFilterParams
): ColumnFiltersState {
  return FILTER_KEYS.flatMap((key) => {
    const values = params[key] ?? []
    return values.length > 0 ? [{ id: toColumnId(key), value: values }] : []
  })
}

function columnFiltersKey(filters: ColumnFiltersState): string {
  return filters
    .map((filter) => {
      const raw = filter.value as unknown
      if (Array.isArray(raw)) return `${filter.id}:${raw.map(String).join(',')}`
      if (raw && typeof raw === 'object' && 'value' in raw) {
        const nested = (raw as { value: unknown }).value
        if (Array.isArray(nested))
          return `${filter.id}:${nested.map(String).join(',')}`
        return `${filter.id}:${nested == null ? '' : String(nested)}`
      }
      return `${filter.id}:${raw == null ? '' : String(raw)}`
    })
    .sort()
    .join('|')
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

  const queryKey = useMemo(
    () => [
      'courses',
      params.page,
      params.limit,
      params.search,
      params.type.join(','),
      params.tagName.join(','),
      params.dateRange.join(','),
      params.durationRange.join(','),
      params.accreditationStatus.join(','),
    ],
    [params]
  )

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
