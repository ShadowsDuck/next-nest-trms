'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  PaginationState,
  Updater,
} from '@tanstack/react-table'
import { useQueryStates } from 'nuqs'
import {
  auditLogParsers,
  auditLogTableFilterConfig,
  auditLogTableFilterDefaults,
  auditLogTableFilterKeys,
  getAllAuditLogs,
} from '@/domains/audit-logs'
import {
  buildColumnFiltersFromParams,
  buildFilterParamsFromColumnFilters,
  buildPaginationMeta,
  buildPaginationState,
  buildTableLoadingState,
  hasActiveTableFilters,
  shouldSyncColumnFilters,
} from '@/shared/lib/table-state'
import { buildAuditLogsQueryKey } from '../options/query-options'

type AuditLogTableFilterParams = typeof auditLogTableFilterDefaults

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
    () => buildColumnFiltersFromParams(params, auditLogTableFilterConfig),
    [params]
  )

  useEffect(() => {
    if (shouldSyncColumnFilters(columnFilters, filtersFromParams)) {
      setColumnFilters(filtersFromParams)
    }
  }, [columnFilters, filtersFromParams])

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
      setFilter(
        buildFilterParamsFromColumnFilters(
          next,
          auditLogTableFilterConfig,
          auditLogTableFilterDefaults
        ) as AuditLogTableFilterParams
      )
    },
    [columnFilters, setFilter]
  )

  const hasFilters = useMemo(
    () => hasActiveTableFilters(params, auditLogTableFilterKeys),
    [params]
  )

  return {
    params,
    columnFilters,
    auditLogs,
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
