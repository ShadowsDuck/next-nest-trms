'use client'

import { useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { employeeParsers } from '../lib/search-params'

export function useEmployeeFilters() {
  const [isLoading, startTransition] = useTransition()

  const [params, setParams] = useQueryStates(employeeParsers, {
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

  // 4. Return isLoading ออกไปใช้งาน
  return { params, setFilter, setPage, setLimit, isLoading }
}
