'use client'
'use no memo'

/**
 * Table faceted filter component
 * @description A faceted filter component for DataTable that allows users to filter data based on multiple selectable options. It supports both single and multiple selection modes.
 */
import * as React from 'react'
import type { Column } from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@workspace/ui/components/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { Check, ChevronDown, XCircle, XIcon } from 'lucide-react'
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  JOIN_OPERATORS,
} from '../lib/constants'
import type { ExtendedColumnFilter, Option } from '../types'

export interface TableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: Option[]
  multiple?: boolean
  /**
   * Whether to show the search input inside the popover
   * @default true
   */
  showSearch?: boolean
  /**
   * Callback fired when filter value changes
   * Useful for server-side filtering or external state management
   */
  onValueChange?: (value: string[] | undefined) => void
  /**
   * Optional custom trigger element
   */
  trigger?: React.ReactNode
}

export function useTableFacetedFilter<TData>({
  column,
  onValueChange,
  multiple,
}: {
  column?: Column<TData, unknown>
  onValueChange?: (value: string[] | undefined) => void
  multiple?: boolean
}) {
  const columnFilterValue = column?.getFilterValue()

  // Handle both ExtendedColumnFilter format (new) and legacy array format
  const selectedValues = React.useMemo(() => {
    // Handle ExtendedColumnFilter format (from filter menu or new faceted filter)
    if (
      columnFilterValue &&
      typeof columnFilterValue === 'object' &&
      !Array.isArray(columnFilterValue) &&
      'value' in columnFilterValue
    ) {
      const filterValue = (columnFilterValue as ExtendedColumnFilter<TData>)
        .value
      return new Set(
        Array.isArray(filterValue) ? filterValue : [String(filterValue)]
      )
    }
    // Handle legacy array format (backward compatibility)
    return new Set(Array.isArray(columnFilterValue) ? columnFilterValue : [])
  }, [columnFilterValue])

  const onItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      if (!column) return

      if (multiple) {
        const newSelectedValues = new Set(selectedValues)
        if (isSelected) {
          newSelectedValues.delete(option.value)
        } else {
          newSelectedValues.add(option.value)
        }
        const filterValues = Array.from(newSelectedValues)

        if (filterValues.length === 0) {
          column.setFilterValue(undefined)
          onValueChange?.(undefined)
        } else {
          // Create ExtendedColumnFilter format for interoperability with filter menu
          // FORCE variant to multi_select when using IN operator to ensure it shows up in the menu
          const extendedFilter: ExtendedColumnFilter<TData> = {
            id: column.id as Extract<keyof TData, string>,
            value: filterValues,
            variant: FILTER_VARIANTS.MULTI_SELECT,
            operator: FILTER_OPERATORS.IN,
            filterId: `faceted-${column.id}`,
            joinOperator: JOIN_OPERATORS.AND,
          }
          column.setFilterValue(extendedFilter)
          onValueChange?.(filterValues)
        }
      } else {
        // Single selection
        if (isSelected) {
          column.setFilterValue(undefined)
          onValueChange?.(undefined)
        } else {
          // Create ExtendedColumnFilter format for single selection
          // Use EQUAL operator for single select
          const extendedFilter: ExtendedColumnFilter<TData> = {
            id: column.id as Extract<keyof TData, string>,
            value: option.value, // Single value, not array
            variant: FILTER_VARIANTS.SELECT,
            operator: FILTER_OPERATORS.EQ,
            filterId: `faceted-${column.id}`,
            joinOperator: JOIN_OPERATORS.AND,
          }
          column.setFilterValue(extendedFilter)
          onValueChange?.([option.value])
        }
      }
    },
    [column, multiple, selectedValues, onValueChange]
  )

  const onReset = React.useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation()
      column?.setFilterValue(undefined)
      onValueChange?.(undefined)
    },
    [column, onValueChange]
  )

  const onToggleAll = React.useCallback(
    (targetOptions: Option[], select: boolean) => {
      if (!column) return

      const newSelectedValues = new Set(selectedValues)

      targetOptions.forEach((opt) => {
        if (select) {
          newSelectedValues.add(opt.value)
        } else {
          newSelectedValues.delete(opt.value)
        }
      })

      const filterValues = Array.from(newSelectedValues)

      if (filterValues.length === 0) {
        column.setFilterValue(undefined)
        onValueChange?.(undefined)
      } else {
        const extendedFilter: ExtendedColumnFilter<TData> = {
          id: column.id as Extract<keyof TData, string>,
          value: filterValues,
          variant: FILTER_VARIANTS.MULTI_SELECT,
          operator: FILTER_OPERATORS.IN,
          filterId: `faceted-${column.id}`,
          joinOperator: JOIN_OPERATORS.AND,
        }
        column.setFilterValue(extendedFilter)
        onValueChange?.(filterValues)
      }
    },
    [column, selectedValues, onValueChange]
  )

  return {
    selectedValues,
    onItemSelect,
    onReset,
    onToggleAll,
  }
}

export function TableFacetedFilter<TData, TValue>({
  column,
  title,
  options = [],
  multiple,
  showSearch = true,
  onValueChange,
  trigger,
}: TableFacetedFilterProps<TData, TValue>) {
  const [open, setOpen] = React.useState(false)

  const { selectedValues, onItemSelect, onReset, onToggleAll } =
    useTableFacetedFilter({
      column,
      onValueChange,
      multiple,
    })

  // Wrap onItemSelect to close multiple=false popover
  const handleItemSelect = React.useCallback(
    (option: Option, isSelected: boolean) => {
      onItemSelect(option, isSelected)
      if (!multiple) {
        setOpen(false)
      }
    },
    [onItemSelect, multiple, setOpen]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="border-border h-9">
            {title}
            {selectedValues?.size > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-full" />
                <Badge
                  variant="secondary"
                  className="rounded-sm px-1 font-normal lg:hidden"
                >
                  {selectedValues.size}
                </Badge>
                <div className="hidden items-center gap-1 lg:flex">
                  {selectedValues.size > 2 ? (
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {selectedValues.size} ตัวกรอง
                    </Badge>
                  ) : (
                    options
                      .filter((option) => selectedValues.has(option.value))
                      .map((option) => (
                        <Badge
                          variant="secondary"
                          key={option.value}
                          className="rounded-sm px-1 font-normal"
                        >
                          {option.label}
                        </Badge>
                      ))
                  )}
                </div>
              </>
            )}
            {selectedValues?.size > 0 ? (
              <div
                role="button"
                aria-label={`Clear ${title} filter`}
                tabIndex={0}
                onClick={onReset}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onReset(e as unknown as React.MouseEvent)
                  }
                }}
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
      <PopoverContent className="w-52 p-0" align="start">
        <TableFacetedFilterContent
          title={title}
          options={options}
          selectedValues={selectedValues}
          onItemSelect={handleItemSelect}
          onReset={onReset}
          showSearch={showSearch}
          multiple={multiple}
          onToggleAll={onToggleAll}
        />
      </PopoverContent>
    </Popover>
  )
}

export function TableFacetedFilterContent({
  title,
  options,
  selectedValues,
  onItemSelect,
  onReset,
  showSearch = true,
  multiple,
  onToggleAll,
}: {
  title?: string
  options: Option[]
  selectedValues: Set<string>
  onItemSelect: (option: Option, isSelected: boolean) => void
  onReset: (event?: React.MouseEvent) => void
  showSearch?: boolean
  multiple?: boolean
  onToggleAll?: (options: Option[], select: boolean) => void
}) {
  const [searchValue, setSearchValue] = React.useState('')

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    const lower = searchValue.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(lower) ||
        String(o.value).toLowerCase().includes(lower)
    )
  }, [options, searchValue])

  const isAllFilteredSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((opt) => selectedValues.has(opt.value))

  const handleSelectAll = () => {
    onToggleAll?.(filteredOptions, !isAllFilteredSelected)
  }

  return (
    <Command shouldFilter={false}>
      {showSearch && (
        <CommandInput
          placeholder={title}
          className="pl-2"
          value={searchValue}
          onValueChange={setSearchValue}
        />
      )}
      <CommandList className="max-h-full">
        {filteredOptions.length === 0 && (
          <div className="text-muted-foreground py-6 text-center text-sm">
            ไม่พบข้อมูล
          </div>
        )}
        <CommandGroup className="max-h-75 overflow-x-hidden overflow-y-auto">
          {multiple && filteredOptions.length > 0 && (
            <CommandItem key="select-all" onSelect={handleSelectAll}>
              <div
                className={cn(
                  'border-muted-foreground/50 mr-2 flex size-4 items-center justify-center rounded-[4px] border',
                  isAllFilteredSelected
                    ? 'bg-primary border-primary'
                    : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <Check
                  className={cn(
                    'size-4',
                    isAllFilteredSelected && 'text-primary-foreground!'
                  )}
                />
              </div>
              <span className="truncate">เลือกทั้งหมด</span>
            </CommandItem>
          )}
          {filteredOptions.map((option) => {
            const isSelected = selectedValues.has(option.value)

            return (
              <CommandItem
                key={option.value}
                onSelect={() => onItemSelect(option, isSelected)}
              >
                <div
                  className={cn(
                    'border-muted-foreground/50 mr-2 flex size-4 items-center justify-center rounded-[4px] border',
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Check
                    className={cn(
                      'size-4',
                      isSelected && 'text-primary-foreground!'
                    )}
                  />
                </div>
                {option.icon && <option.icon className="mr-2 size-4" />}
                <span className="truncate">{option.label}</span>
                {option.count !== undefined && (
                  <span className="ml-auto font-mono text-xs">
                    {option.count}
                  </span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
        {selectedValues.size > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => onReset()}
                className="justify-center text-center [&>svg:last-child]:hidden"
              >
                <XIcon />
                ล้างตัวกรอง
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}

/**
 * @required displayName is required for auto feature detection
 * @see "feature-detection.ts"
 */

TableFacetedFilter.displayName = 'TableFacetedFilter'
