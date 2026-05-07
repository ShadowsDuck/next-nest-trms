'use client'
'use no memo'

/**
 * A dropdown menu component that allows users to toggle the visibility of table columns.
 * It uses a popover to display a list of columns with checkboxes.
 * Users can search for columns and toggle their visibility.
 */
import * as React from 'react'
import type { Column } from '@tanstack/react-table'
import { Button } from '@workspace/ui/components/button'
import { Calendar } from '@workspace/ui/components/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { ChevronDown, XCircle } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

type DateSelection = Date[] | DateRange

function getIsDateRange(value: DateSelection): value is DateRange {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function parseAsDate(timestamp: number | string | undefined): Date | undefined {
  if (!timestamp) return undefined
  const numericTimestamp =
    typeof timestamp === 'string' ? Number(timestamp) : timestamp
  const date = new Date(numericTimestamp)
  return !Number.isNaN(date.getTime()) ? date : undefined
}

function parseColumnFilterValue(value: unknown) {
  if (value === null || value === undefined) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'number' || typeof item === 'string') {
        return item
      }
      return undefined
    })
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return [value]
  }

  return []
}

export interface TableDateFilterProps<TData> {
  column: Column<TData, unknown>
  title?: string
  multiple?: boolean
  trigger?: React.ReactNode
}

export function TableDateFilter<TData>({
  column,
  title,
  multiple,
  trigger,
}: TableDateFilterProps<TData>) {
  const [open, setOpen] = React.useState(false)
  const columnFilterValue = column.getFilterValue()

  const selectedDates = React.useMemo<DateSelection>(() => {
    if (!columnFilterValue) {
      return multiple ? { from: undefined, to: undefined } : []
    }

    if (multiple) {
      const timestamps = parseColumnFilterValue(columnFilterValue)
      return {
        from: parseAsDate(timestamps[0]),
        to: parseAsDate(timestamps[1]),
      }
    }

    const timestamps = parseColumnFilterValue(columnFilterValue)
    const date = parseAsDate(timestamps[0])
    return date ? [date] : []
  }, [columnFilterValue, multiple])

  const onSelect = React.useCallback(
    (date: Date | DateRange | undefined) => {
      if (!date) {
        column.setFilterValue(undefined)
        return
      }

      if (multiple) {
        // ในโหมด range, date จะเป็น object { from, to }
        const range = date as DateRange
        const from = range.from?.getTime()
        const to = range.to?.getTime()
        column.setFilterValue(from || to ? [from, to] : undefined)
      } else {
        // ในโหมด single, date จะเป็น Date object
        if (date instanceof Date) {
          column.setFilterValue(date.getTime())
        }
      }
    },
    [column, multiple]
  )

  const onReset = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      column.setFilterValue(undefined)
    },
    [column]
  )

  const hasValue = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return false
      return selectedDates.from || selectedDates.to
    }
    if (!Array.isArray(selectedDates)) return false
    return selectedDates.length > 0
  }, [multiple, selectedDates])

  const formatThaiDate = (value: DateSelection) => {
    const start = getIsDateRange(value) ? value.from : value[0]
    const end = getIsDateRange(value) ? value.to : value[value.length - 1]

    if (!start) return 'เลือกวันที่'

    if (!end || start === end) {
      return format(start, 'd MMM yyyy', { locale: th }).replace(/\d{4}/, (y) =>
        (Number.parseInt(y) + 543).toString()
      )
    }

    return `${format(start, 'd MMM yyyy', { locale: th }).replace(/\d{4}/, (y) => (Number.parseInt(y) + 543).toString())} - ${format(
      end,
      'd MMM yyyy',
      { locale: th }
    ).replace(/\d{4}/, (y) => (Number.parseInt(y) + 543).toString())}`
  }

  const label = React.useMemo(() => {
    if (multiple) {
      if (!getIsDateRange(selectedDates)) return null

      const hasSelectedDates = selectedDates.from || selectedDates.to
      const dateText = hasSelectedDates
        ? formatThaiDate(selectedDates)
        : 'เลือกช่วงวันที่'

      return (
        <span className="flex items-center gap-2">
          <span>{title}</span>
          {hasSelectedDates && (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 data-[orientation=vertical]:h-4"
              />
              <span>{dateText}</span>
            </>
          )}
        </span>
      )
    }

    if (getIsDateRange(selectedDates)) return null

    const hasSelectedDate = selectedDates.length > 0
    const dateText = hasSelectedDate
      ? formatThaiDate(selectedDates)
      : 'เลือกวันที่'

    return (
      <span className="flex items-center gap-2">
        <span>{title}</span>
        {hasSelectedDate && (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 data-[orientation=vertical]:h-4"
            />
            <span>{dateText}</span>
          </>
        )}
      </span>
    )
  }, [selectedDates, multiple, title])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="border-border h-9">
            {label}
            {hasValue ? (
              <div
                role="button"
                aria-label={`ล้างตัวกรอง ${title}`}
                tabIndex={0}
                onClick={onReset}
                className="focus-visible:ring-ring ml-1 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-1 focus-visible:outline-none"
              >
                <XCircle className="size-4" />
              </div>
            ) : (
              <ChevronDown
                className={cn(
                  'text-muted-foreground ml-1 size-4 transition-transform duration-200',
                  open && 'rotate-180'
                )}
              />
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {multiple ? (
          <Calendar
            captionLayout="dropdown"
            mode="range"
            selected={
              getIsDateRange(selectedDates)
                ? selectedDates
                : { from: undefined, to: undefined }
            }
            onSelect={onSelect}
            locale={th}
            formatters={{
              formatCaption: (date, options) => {
                const month = format(date, 'LLLL', { locale: options?.locale })
                const year = date.getFullYear() + 543
                return `${month} ${year}`
              },
              formatYearDropdown: (date) =>
                (date.getFullYear() + 543).toString(),
            }}
          />
        ) : (
          <Calendar
            captionLayout="dropdown"
            mode="single"
            selected={
              !getIsDateRange(selectedDates) ? selectedDates[0] : undefined
            }
            onSelect={onSelect}
            locale={th}
            formatters={{
              formatCaption: (date, options) => {
                const month = format(date, 'LLLL', { locale: options?.locale })
                const year = date.getFullYear() + 543
                return `${month} ${year}`
              },
              formatYearDropdown: (date) =>
                (date.getFullYear() + 543).toString(),
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableDateFilter.displayName = 'TableDateFilter'
