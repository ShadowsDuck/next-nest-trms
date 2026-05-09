import type { ColumnFiltersState } from '@tanstack/react-table'

// อ่านค่าตัวกรองชนิดข้อความจาก TanStack column filters
export function getFilterValues(
  filters: ColumnFiltersState,
  id: string
): string[] {
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

// อ่านค่าตัวกรองชนิดตัวเลขจาก TanStack column filters
export function getNumericFilterValues(
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

// คัดเฉพาะค่าที่อยู่ใน enum ที่รองรับเท่านั้น
export function pickAllowed<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const set = new Set(allowed)
  return values.filter((value): value is T => set.has(value as T))
}

// สร้าง key แบบคงที่สำหรับเทียบความเปลี่ยนแปลงของ column filters
export function columnFiltersKey(filters: ColumnFiltersState): string {
  return filters
    .map((filter) => {
      const raw = filter.value as unknown

      if (Array.isArray(raw)) {
        return `${filter.id}:${raw.map(String).join(',')}`
      }

      if (raw && typeof raw === 'object' && 'value' in raw) {
        const nested = (raw as { value: unknown }).value

        if (Array.isArray(nested)) {
          return `${filter.id}:${nested.map(String).join(',')}`
        }

        return `${filter.id}:${nested == null ? '' : String(nested)}`
      }

      return `${filter.id}:${raw == null ? '' : String(raw)}`
    })
    .sort()
    .join('|')
}
