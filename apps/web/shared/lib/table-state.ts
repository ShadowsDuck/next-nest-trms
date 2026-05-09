import type { ColumnFiltersState, PaginationState } from '@tanstack/react-table'
import {
  columnFiltersKey,
  getFilterValues,
  getNumericFilterValues,
  pickAllowed,
} from './table-filter-utils'

type TableFilterValueType = 'string' | 'number'

export type TableFilterRule<
  ParamKey extends string,
  AllowedValue extends string,
> = {
  paramKey: ParamKey
  columnId?: string
  valueType: TableFilterValueType
  allowedValues?: readonly AllowedValue[]
}

export type TableFilterConfig<
  ParamKey extends string,
  AllowedValue extends string = string,
> = readonly TableFilterRule<ParamKey, AllowedValue>[]

export type TablePaginationMeta = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type TableLoadingState = {
  isInitialLoading: boolean
  isBackgroundFetching: boolean
  isListFetching: boolean
}

// คืนค่า column id ที่ใช้จริงใน table โดย fallback เป็นชื่อ query param เดิม
function getColumnId<ParamKey extends string>(
  rule: TableFilterRule<ParamKey, string>
): string {
  return rule.columnId ?? rule.paramKey
}

// อ่านค่าตัวกรองจาก params แล้วแปลงเป็น array สำหรับ TanStack filters
function getParamFilterValues<Params extends Record<string, unknown>>(
  params: Params,
  paramKey: keyof Params
): Array<string | number> {
  const raw = params[paramKey]
  return Array.isArray(raw) ? raw.filter((value) => value != null) : []
}

// อ่านค่าตัวกรองจาก ColumnFiltersState ตามชนิดของ rule ที่กำหนด
function getColumnFilterValues<ParamKey extends string>(
  filters: ColumnFiltersState,
  rule: TableFilterRule<ParamKey, string>
): string[] | number[] {
  const columnId = getColumnId(rule)

  if (rule.valueType === 'number') {
    return getNumericFilterValues(filters, columnId)
  }

  const values = getFilterValues(filters, columnId)
  return rule.allowedValues ? pickAllowed(values, rule.allowedValues) : values
}

// แปลง URL params ให้เป็น ColumnFiltersState โดยอิง config ของแต่ละ feature
export function buildColumnFiltersFromParams<
  ParamKey extends string,
  Params extends Partial<Record<ParamKey, unknown>>,
>(params: Params, config: TableFilterConfig<ParamKey>): ColumnFiltersState {
  return config.flatMap((rule) => {
    const values = getParamFilterValues(params, rule.paramKey)
    return values.length > 0 ? [{ id: getColumnId(rule), value: values }] : []
  })
}

// แปลง ColumnFiltersState กลับเป็น query params โดยคง shape เดิมของแต่ละ feature
export function buildFilterParamsFromColumnFilters<
  ParamKey extends string,
  Params extends Partial<Record<ParamKey, unknown>>,
>(
  filters: ColumnFiltersState,
  config: TableFilterConfig<ParamKey>,
  initialParams: Params
): Params {
  const next = { ...initialParams } as Params

  for (const rule of config) {
    next[rule.paramKey] = getColumnFilterValues(
      filters,
      rule
    ) as Params[typeof rule.paramKey]
  }

  return next
}

// ตรวจว่ามี filter หรือ search ใดถูกใช้งานอยู่หรือไม่
export function hasActiveTableFilters<
  ParamKey extends string,
  Params extends Record<ParamKey, unknown> & { search?: string },
>(params: Params, filterKeys: readonly ParamKey[]): boolean {
  return (
    Boolean(params.search) ||
    filterKeys.some((key) => {
      const value = params[key]
      return Array.isArray(value) && value.length > 0
    })
  )
}

// สร้าง state ของ pagination สำหรับเชื่อมระหว่าง URL params กับ TanStack Table
export function buildPaginationState(
  page: number,
  limit: number
): PaginationState {
  return {
    pageIndex: page - 1,
    pageSize: limit,
  }
}

// สร้าง meta สำรองเมื่อ query ยังไม่มีข้อมูล เพื่อให้ UI อ่าน shape เดิมได้เสมอ
export function buildPaginationMeta(
  meta: TablePaginationMeta | undefined,
  page: number,
  limit: number
): TablePaginationMeta {
  return (
    meta ?? {
      total: 0,
      page,
      limit,
      totalPages: 1,
    }
  )
}

// เปรียบเทียบ filter state แบบคงที่เพื่อใช้ตัดสินใจว่าจะ sync state หรือไม่
export function shouldSyncColumnFilters(
  currentFilters: ColumnFiltersState,
  nextFilters: ColumnFiltersState
): boolean {
  return columnFiltersKey(currentFilters) !== columnFiltersKey(nextFilters)
}

// สรุปสถานะโหลดของตารางจาก query state และ URL transition ให้ใช้ซ้ำได้
export function buildTableLoadingState(input: {
  isLoading: boolean
  isFetching: boolean
  hasData: boolean
  isParamsTransitioning: boolean
}): TableLoadingState {
  const isInitialLoading = input.isLoading && !input.hasData
  const isBackgroundFetching =
    (input.isFetching || input.isParamsTransitioning) && !isInitialLoading

  return {
    isInitialLoading,
    isBackgroundFetching,
    isListFetching: input.isFetching || input.isParamsTransitioning,
  }
}
