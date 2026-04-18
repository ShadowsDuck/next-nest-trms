'use client'
'use no memo'

import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import { Button } from '@workspace/ui/components/button'
import { Upload } from 'lucide-react'

/**
 * Trigger CSV download
 */
export function triggerCsvDownload(filename: string, rows: string[]) {
  const csvContent = rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape a cell value for CSV output.
 * Handles strings, numbers, booleans, dates, arrays, null, and undefined.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (value instanceof Date) {
    return `"${value.toISOString()}"`
  }

  if (Array.isArray(value)) {
    const joined = value.map(String).join(', ')
    return `"${joined.replace(/"/g, '""')}"`
  }

  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)

  // Default: treat as string and escape quotes
  const str = String(value)
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface ExportTableToCSVOptions<TData> {
  /** Filename for the exported CSV (without extension). @default "table" */
  filename?: string
  /** Column IDs to exclude from export. */
  excludeColumns?: (keyof TData)[]
  /** Whether to export only selected rows. @default false */
  onlySelected?: boolean
  /**
   * Use human-readable labels from `column.columnDef.meta.label` as CSV
   * header names instead of raw column IDs.
   * @default false
   */
  useHeaderLabels?: boolean
  /**
   * Optional per-column value transformers before writing CSV.
   * Useful for mapping enum codes to display labels (e.g. "Active" -> "ทำงาน").
   */
  valueTransformers?: Partial<
    Record<string, (value: unknown, row: TData) => unknown>
  >
  /**
   * Optional row exploder for nested data (e.g. employee -> courses[]).
   * Produces one CSV row per child item.
   */
  explodeRows?: {
    /** Return child items for a parent row. */
    getSubRows: (row: TData) => unknown[] | undefined | null
    /**
     * Columns that should be sourced from each child item.
     * Example: ["courseName"]
     */
    childColumnIds: string[]
    /**
     * Parent value rendering for exploded rows:
     * - "repeat": repeat parent values in every child row
     * - "first-only": write parent values only on first child row
     * @default "repeat"
     */
    parentRowMode?: 'repeat' | 'first-only'
    /**
     * Resolve value for child columns from a child item.
     */
    getChildValue: (args: {
      child: unknown
      childIndex: number
      columnId: string
      row: TData
    }) => unknown
    /**
     * Optional summary row appended after all child rows of each parent.
     * Useful for totals such as total course duration per employee.
     */
    summaryRow?: {
      /**
       * Build summary values by column id.
       * Return null/undefined to skip summary row for this parent.
       */
      getValues: (args: {
        row: TData
        children: unknown[]
      }) => Partial<Record<string, unknown>> | null | undefined
      /**
       * Also render summary row when there are no children.
       * @default false
       */
      includeWhenNoChildren?: boolean
    }
  }
}

/**
 * Core utility function to export a TanStack Table to CSV.
 * This is the base implementation that can be used directly or wrapped in components.
 *
 * @param table - The TanStack Table instance
 * @param opts - Export options
 *
 * @example
 * ```ts
 * import { exportTableToCSV } from "@/components/niko-table/filters/table-export-button"
 *
 * // Basic export
 * exportTableToCSV(table, { filename: "users" })
 *
 * // Export with human-readable headers
 * exportTableToCSV(table, { filename: "users", useHeaderLabels: true })
 *
 * // Export only selected rows
 * exportTableToCSV(table, { filename: "selected-users", onlySelected: true })
 * ```
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: ExportTableToCSVOptions<TData> = {}
): void {
  const {
    filename = 'table',
    excludeColumns = [],
    onlySelected = false,
    useHeaderLabels = false,
    valueTransformers,
    explodeRows,
  } = opts

  // Retrieve columns, filtering out excluded ones
  const columns = table
    .getAllLeafColumns()
    .filter((column) => !excludeColumns.includes(column.id as keyof TData))

  // Build header row — use meta.label when available and useHeaderLabels is true
  const headerRow = columns
    .map((column) => {
      if (useHeaderLabels) {
        const label = (
          column.columnDef.meta as Record<string, unknown> | undefined
        )?.label as string | undefined
        return escapeCsvValue(label ?? column.id)
      }
      return escapeCsvValue(column.id)
    })
    .join(',')

  // Column IDs for value lookup
  const columnIds = columns.map((column) => column.id)

  // Build data rows.
  // Keep export order aligned with the table view (sorting/filtering/pagination).
  const visibleRows = table.getRowModel().rows
  const rows = onlySelected
    ? visibleRows.filter((row) => row.getIsSelected())
    : visibleRows

  const dataRows = rows.flatMap((row) => {
    if (!explodeRows) {
      const rowCsv = columnIds
        .map((id) => {
          const rawValue = row.getValue(id)
          const transformedValue = valueTransformers?.[id]
            ? valueTransformers[id](rawValue, row.original)
            : rawValue
          return escapeCsvValue(transformedValue)
        })
        .join(',')
      return [rowCsv]
    }

    const {
      getSubRows,
      childColumnIds,
      getChildValue,
      parentRowMode = 'repeat',
      summaryRow,
    } = explodeRows

    const children = getSubRows(row.original) ?? []
    const items = children.length > 0 ? children : [null]

    const explodedDataRows = items.map((child, childIndex) =>
      columnIds
        .map((id) => {
          const isChildColumn = childColumnIds.includes(id)

          let rawValue: unknown

          if (isChildColumn) {
            rawValue =
              child == null
                ? ''
                : getChildValue({
                    child,
                    childIndex,
                    columnId: id,
                    row: row.original,
                  })
          } else {
            const parentValue = row.getValue(id)
            rawValue =
              parentRowMode === 'first-only' && childIndex > 0
                ? ''
                : parentValue
          }

          const transformedValue = valueTransformers?.[id]
            ? valueTransformers[id](rawValue, row.original)
            : rawValue

          return escapeCsvValue(transformedValue)
        })
        .join(',')
    )

    const shouldIncludeSummary =
      Boolean(summaryRow) &&
      (children.length > 0 || summaryRow?.includeWhenNoChildren)

    if (!shouldIncludeSummary || !summaryRow) {
      return explodedDataRows
    }

    const summaryValues = summaryRow.getValues({
      row: row.original,
      children,
    })

    if (!summaryValues) {
      return explodedDataRows
    }

    const summaryCsvRow = columnIds
      .map((id) => {
        const hasValue = Object.prototype.hasOwnProperty.call(summaryValues, id)
        const rawValue = hasValue ? summaryValues[id] : ''
        const transformedValue = valueTransformers?.[id]
          ? valueTransformers[id](rawValue, row.original)
          : rawValue
        return escapeCsvValue(transformedValue)
      })
      .join(',')

    return [...explodedDataRows, summaryCsvRow]
  })

  const csvContent = [headerRow, ...dataRows].join('\n')

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface TableExportButtonProps<TData> {
  /**
   * The table instance from TanStack Table
   */
  table: Table<TData>
  /**
   * Optional filename for the exported CSV (without extension)
   * @default "table"
   */
  filename?: string
  /**
   * Columns to exclude from the export
   */
  excludeColumns?: (keyof TData)[]
  /**
   * Whether to export only selected rows
   * @default false
   */
  onlySelected?: boolean
  /**
   * Use human-readable labels from column.columnDef.meta.label as CSV
   * header names instead of raw column IDs.
   * @default false
   */
  useHeaderLabels?: boolean
  /**
   * Optional per-column value transformers before writing CSV.
   */
  valueTransformers?: Partial<
    Record<string, (value: unknown, row: TData) => unknown>
  >
  /**
   * Optional row exploder for nested data (e.g. employee -> courses[]).
   */
  explodeRows?: ExportTableToCSVOptions<TData>['explodeRows']
  /**
   * Button variant
   * @default "outline"
   */
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  /**
   * Button size
   * @default "sm"
   */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /**
   * Custom button label
   * @default "Export CSV"
   */
  label?: string
  /**
   * Show icon
   * @default true
   */
  showIcon?: boolean
  /**
   * Additional className
   */
  className?: string
}

/**
 * Core export button component that accepts a table prop directly.
 * Use this when you want to manage the table instance yourself.
 *
 * @example
 * ```tsx
 * const table = useReactTable({ ... })
 * <TableExportButton table={table} filename="products" />
 * ```
 */
export function TableExportButton<TData>({
  table,
  filename = 'table',
  excludeColumns,
  onlySelected = false,
  useHeaderLabels = false,
  valueTransformers,
  explodeRows,
  variant = 'outline',
  size = 'sm',
  label = 'Export CSV',
  showIcon = true,
  className,
}: TableExportButtonProps<TData>) {
  const handleExport = React.useCallback(() => {
    exportTableToCSV(table, {
      filename,
      excludeColumns,
      onlySelected,
      useHeaderLabels,
      valueTransformers,
      explodeRows,
    })
  }, [
    table,
    filename,
    excludeColumns,
    onlySelected,
    useHeaderLabels,
    valueTransformers,
    explodeRows,
  ])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={className}
    >
      {showIcon && <Upload className="mr-1 size-4" />}
      {label}
    </Button>
  )
}

TableExportButton.displayName = 'TableExportButton'
