'use client'

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  ColumnFiltersState,
  ColumnPinningState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
} from '@tanstack/react-table'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { AlertCircle, Loader2, SearchX, UserSearch } from 'lucide-react'
import {
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryStates,
} from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { DataTableColumnDateFilterMenu } from '@/components/niko-table/components/data-table-column-date-filter-options'
import { DataTableColumnFacetedFilterMenu } from '@/components/niko-table/components/data-table-column-faceted-filter'
import { DataTableColumnHeader } from '@/components/niko-table/components/data-table-column-header'
import { DataTableColumnSliderFilterMenu } from '@/components/niko-table/components/data-table-column-slider-filter-options'
import { DataTableColumnSortMenu } from '@/components/niko-table/components/data-table-column-sort'
import { DataTableColumnTitle } from '@/components/niko-table/components/data-table-column-title'
import {
  DataTableEmptyDescription,
  DataTableEmptyFilteredMessage,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from '@/components/niko-table/components/data-table-empty-state'
import { DataTableFilterMenu } from '@/components/niko-table/components/data-table-filter-menu'
import { DataTableInlineFilter } from '@/components/niko-table/components/data-table-inline-filter'
import { DataTablePagination } from '@/components/niko-table/components/data-table-pagination'
import { DataTableSearchFilter } from '@/components/niko-table/components/data-table-search-filter'
import { DataTableSortMenu } from '@/components/niko-table/components/data-table-sort-menu'
import { DataTableToolbarSection } from '@/components/niko-table/components/data-table-toolbar-section'
import { DataTableViewMenu } from '@/components/niko-table/components/data-table-view-menu'
import { DataTable } from '@/components/niko-table/core/data-table'
import { DataTableRoot } from '@/components/niko-table/core/data-table-root'
import {
  DataTableBody,
  DataTableEmptyBody,
  DataTableHeader,
  DataTableSkeleton,
} from '@/components/niko-table/core/data-table-structure'
import { serializeFiltersForUrl } from '@/components/niko-table/filters/table-filter-menu'
import { useDebounce } from '@/components/niko-table/hooks/use-debounce'
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
} from '@/components/niko-table/lib/constants'
import { processFiltersForLogic } from '@/components/niko-table/lib/data-table'
import { daysAgo } from '@/components/niko-table/lib/format'
import type {
  DataTableColumnDef,
  ExtendedColumnFilter,
} from '@/components/niko-table/types'

type Todo = {
  userId: number
  id: number
  title: string
  completed: boolean
}

type Product = Todo // Alias to avoid having to rename across the entire 1800-line file

// Server-side API simulation
type ServerResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  facets: Record<string, string[]>
}

type FetchParams = {
  page: number
  pageSize: number
  sorting: SortingState
  globalFilter: string | object
  columnFilters: ColumnFiltersState
}

// Helper function to check if a product matches a single filter
function matchesFilter(
  product: Product,
  filter: ExtendedColumnFilter<Product>
): boolean {
  const productValue = product[filter.id as keyof Product]
  const filterValue = filter.value

  if (
    filter.operator === FILTER_OPERATORS.EMPTY ||
    filter.operator === FILTER_OPERATORS.NOT_EMPTY
  ) {
    // These don't need a value
  } else if (!filterValue || filterValue === '') {
    return true
  }

  switch (filter.operator) {
    case FILTER_OPERATORS.EQ:
      return (
        String(productValue).toLowerCase() === String(filterValue).toLowerCase()
      )
    case FILTER_OPERATORS.NEQ:
      return (
        String(productValue).toLowerCase() !== String(filterValue).toLowerCase()
      )
    case FILTER_OPERATORS.ILIKE:
      return String(productValue)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    case FILTER_OPERATORS.NOT_ILIKE:
      return !String(productValue)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    case FILTER_OPERATORS.GT:
      return Number(productValue) > Number(filterValue)
    case FILTER_OPERATORS.LT:
      return Number(productValue) < Number(filterValue)
    case FILTER_OPERATORS.GTE:
      return Number(productValue) >= Number(filterValue)
    case FILTER_OPERATORS.LTE:
      return Number(productValue) <= Number(filterValue)
    case FILTER_OPERATORS.EMPTY:
      return (
        productValue === null ||
        productValue === undefined ||
        String(productValue).trim() === ''
      )
    case FILTER_OPERATORS.NOT_EMPTY:
      return (
        productValue !== null &&
        productValue !== undefined &&
        String(productValue).trim() !== ''
      )
    case FILTER_OPERATORS.IN:
      if (Array.isArray(filterValue)) {
        return filterValue.some(
          (v) => String(productValue).toLowerCase() === String(v).toLowerCase()
        )
      }
      return false
    case FILTER_OPERATORS.NOT_IN:
      if (Array.isArray(filterValue)) {
        return !filterValue.some(
          (v) => String(productValue).toLowerCase() === String(v).toLowerCase()
        )
      }
      return true
    default:
      return true
  }
}

// Filter products using all filter params, optionally excluding one column's filter.
// Used for both main data filtering and facet computation (where we exclude the
// facet column's own filter so users can see all available values for that column).
function filterProductsByParams(
  products: Product[],
  params: FetchParams,
  excludeColumnId?: string
): Product[] {
  let filtered = [...products]

  // Apply global search filter (server-side) - string search
  if (typeof params.globalFilter === 'string' && params.globalFilter) {
    const searchTerm = params.globalFilter.toLowerCase()
    filtered = filtered.filter((product) =>
      Object.values(product).some((value) =>
        String(value).toLowerCase().includes(searchTerm)
      )
    )
  }

  // Apply OR filters from globalFilter (when it's an object with filters)
  if (
    typeof params.globalFilter === 'object' &&
    params.globalFilter &&
    'filters' in params.globalFilter
  ) {
    const filterObj = params.globalFilter as {
      filters: ExtendedColumnFilter<Product>[]
      joinOperator: string
    }
    const orFilters = (filterObj.filters || []).filter(
      (f) =>
        f.value &&
        f.value !== '' &&
        (!excludeColumnId || f.id !== excludeColumnId)
    )

    if (orFilters.length > 0) {
      filtered = filtered.filter((product) =>
        orFilters.some((filter) => matchesFilter(product, filter))
      )
    }
  }

  // Apply AND filters from columnFilters (server-side)
  if (params.columnFilters.length > 0) {
    filtered = filtered.filter((product) => {
      return params.columnFilters.every((filter) => {
        // Skip excluded column
        if (excludeColumnId && filter.id === excludeColumnId) return true

        const value = filter.value

        // Skip empty filters
        if (
          !value ||
          (typeof value === 'object' && 'value' in value && !value.value)
        ) {
          return true
        }

        // Handle ExtendedColumnFilter format
        if (typeof value === 'object' && 'id' in value) {
          const extendedFilter = value as ExtendedColumnFilter<Product>
          return matchesFilter(product, extendedFilter)
        }

        return true
      })
    })
  }

  return filtered
}

// Simulate server-side filtering, sorting, and pagination
async function fetchProducts(
  params: FetchParams
): Promise<ServerResponse<Product>> {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos')
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    const allProducts: Product[] = await response.json()

    // Apply all filters
    const filtered = filterProductsByParams(allProducts, params)

    // Compute facets: for each select column, get distinct values from
    // data filtered by all OTHER column filters (excluding that column's own)
    // This enables cross-filter behavior in the UI
    const facetColumns = ['userId', 'completed'] as const
    const facets: Record<string, string[]> = {}
    for (const col of facetColumns) {
      const facetFiltered = filterProductsByParams(allProducts, params, col)
      facets[col] = [
        ...new Set(facetFiltered.map((p) => String(p[col as keyof Product]))),
      ]
        .filter((v) => v.trim() !== '')
        .sort()
    }

    // Apply server-side sorting
    if (params.sorting.length > 0) {
      filtered.sort((a, b) => {
        for (const sort of params.sorting) {
          const aValue = a[sort.id as keyof Product]
          const bValue = b[sort.id as keyof Product]

          if (aValue === bValue) continue

          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0

          return sort.desc ? -comparison : comparison
        }
        return 0
      })
    }

    const total = filtered.length
    const start = params.page * params.pageSize
    const end = start + params.pageSize
    const paginated = filtered.slice(start, end)

    return {
      data: paginated,
      total,
      page: params.page,
      pageSize: params.pageSize,
      facets,
    }
  } catch (error) {
    throw error
  }
}

const userOptions = Array.from({ length: 10 }).map((_, i) => ({
  label: `User ${i + 1}`,
  value: String(i + 1),
}))

const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: 'id',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'ID',
      variant: FILTER_VARIANTS.NUMBER,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'title',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'Title',
      variant: FILTER_VARIANTS.TEXT,
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'userId',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
        <DataTableColumnFacetedFilterMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'User ID',
      variant: FILTER_VARIANTS.SELECT,
      options: userOptions,
      autoOptions: false,
    },
    cell: ({ row }) => {
      return <span>User {row.getValue('userId')}</span>
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'completed',
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
        <DataTableColumnFacetedFilterMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: 'Status',
      variant: FILTER_VARIANTS.SELECT,
      options: [
        { label: 'Completed', value: 'true' },
        { label: 'Pending', value: 'false' },
      ],
      autoOptions: false,
    },
    cell: ({ row }) => {
      const isCompleted = Boolean(row.getValue('completed'))
      return (
        <Badge variant={isCompleted ? 'default' : 'secondary'}>
          {isCompleted ? 'Completed' : 'Pending'}
        </Badge>
      )
    },
    enableColumnFilter: true,
  },
]

function StandardFilterToolbar({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[] | null) => void
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter
          placeholder="Search products..."
          value={search}
          onChange={onSearchChange}
        />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSortMenu className="ml-auto" />
        <DataTableFilterMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

function InlineFilterToolbar({
  filters,
  onFiltersChange,
  search,
  onSearchChange,
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[]) => void
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter
          placeholder="Search products..."
          value={search}
          onChange={onSearchChange}
        />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableInlineFilter
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

/**
 * Normalize filters to ensure they have unique filterIds
 * This is critical when loading filters from URL, as they may not have filterIds
 * or may have duplicate IDs when multiple filters share the same column
 *
 * IMPORTANT: This function preserves filter object references when possible
 * to prevent unnecessary re-renders and focus loss in input fields.
 */
function normalizeFiltersWithUniqueIds<TData>(
  filters: (
    | Omit<ExtendedColumnFilter<TData>, 'filterId'>
    | ExtendedColumnFilter<TData>
  )[]
): ExtendedColumnFilter<TData>[] {
  // Quick check: if all filters already have unique filterIds, return as-is
  // This preserves object references and prevents unnecessary re-renders
  const hasAllIds = filters.every(
    (f): f is ExtendedColumnFilter<TData> => 'filterId' in f && !!f.filterId
  )
  if (hasAllIds) {
    const ids = new Set(
      filters.map((f) => (f as ExtendedColumnFilter<TData>).filterId)
    )
    // If all IDs are unique, return filters unchanged (preserve references)
    if (ids.size === filters.length) {
      return filters as ExtendedColumnFilter<TData>[]
    }
  }

  // Need to normalize - some filters missing IDs or have duplicates
  const seenIds = new Set<string>()

  return filters.map((filter, index) => {
    // If filter already has a filterId, check if it's unique
    if ('filterId' in filter && filter.filterId) {
      // If this ID was already seen, regenerate it to ensure uniqueness
      if (seenIds.has(filter.filterId)) {
        // Generate a new unique ID based on index (not value) to keep it stable
        const uniqueId = `filter-${filter.id}-${index}-dup${seenIds.size}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 100)

        seenIds.add(uniqueId)
        return {
          ...filter,
          filterId: uniqueId,
        } as ExtendedColumnFilter<TData>
      }

      // ID is unique, preserve it (and the filter object reference)
      seenIds.add(filter.filterId)
      return filter as ExtendedColumnFilter<TData>
    }

    // Filter doesn't have a filterId, generate one
    // IMPORTANT: Use index as the primary uniqueness factor, not value
    // This ensures filterId stays stable when only the value changes,
    // preventing React from treating it as a new filter and losing focus
    const uniqueId = `filter-${filter.id}-${index}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100)

    // Ensure the generated ID is unique (in case of collisions)
    let finalId = uniqueId
    let counter = 0
    while (seenIds.has(finalId)) {
      finalId = `${uniqueId}-${counter}`
      counter++
    }

    seenIds.add(finalId)
    return {
      ...filter,
      filterId: finalId,
    } as ExtendedColumnFilter<TData>
  })
}

// Define parsers for URL state management (following nuqs best practices)
const tableStateParsers = {
  pageIndex: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(10),
  sort: parseAsJson<SortingState>((value) => value as SortingState).withDefault(
    []
  ),
  filters: parseAsJson<ExtendedColumnFilter<Product>[]>(
    (value) => value as ExtendedColumnFilter<Product>[]
  ).withDefault([]),
  search: parseAsString.withDefault(''),
  // globalFilter should only be used for complex filter objects (OR/MIXED logic)
  // Simple text search uses the "search" param instead
  // When null/empty, nuqs will remove it from the URL
  globalFilter: parseAsJson<{ filters: unknown[]; joinOperator: string }>(
    (value) => {
      // Only accept objects with filters (complex filter logic)
      if (value && typeof value === 'object' && 'filters' in value) {
        return value as { filters: unknown[]; joinOperator: string }
      }
      // Reject everything else (strings, empty strings, etc.)
      // Return undefined to trigger default, which will be null
      return undefined as unknown as {
        filters: unknown[]
        joinOperator: string
      }
    }
  ).withDefault(
    null as unknown as { filters: unknown[]; joinOperator: string }
  ),
  columnVisibility: parseAsJson<VisibilityState>(
    (value) => value as VisibilityState
  ).withDefault({}),
  inlineFilters: parseAsJson<ExtendedColumnFilter<Product>[]>(
    (value) => value as ExtendedColumnFilter<Product>[]
  ).withDefault([]),
  filterMode: parseAsString.withDefault('standard'),
  pin: parseAsJson<ColumnPinningState>(
    (value) => value as ColumnPinningState
  ).withDefault({ left: [], right: [] }),
}

// Map internal state keys to URL query parameter names
const tableStateUrlKeys = {
  pageIndex: 'page',
  pageSize: 'perPage',
  sort: 'sort',
  filters: 'filters',
  search: 'search',
  globalFilter: 'global',
  columnVisibility: 'cols',

  filterMode: 'mode',
  pin: 'pin',
}

function ServerSideStateTableContent() {
  // URL state management with nuqs - using built-in parsers and URL key mapping
  const [urlParams, setUrlParams] = useQueryStates(tableStateParsers, {
    urlKeys: tableStateUrlKeys,
    history: 'replace',
    scroll: false,
    shallow: true,
  })

  // Get filter mode from URL
  const filterMode = (urlParams.filterMode || 'standard') as
    | 'standard'
    | 'inline'

  // Global filter from URL - handle both search string and OR filters
  const globalFilter = useMemo(() => {
    // If globalFilter is stored in URL as object (OR/MIXED logic), use it
    if (
      urlParams.globalFilter &&
      typeof urlParams.globalFilter === 'object' &&
      'filters' in urlParams.globalFilter
    ) {
      return urlParams.globalFilter
    }

    // Otherwise return search string
    return urlParams.search
  }, [urlParams.globalFilter, urlParams.search])

  // Convert URL state to TanStack Table format
  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: urlParams.pageIndex,
      pageSize: urlParams.pageSize,
    }),
    [urlParams.pageIndex, urlParams.pageSize]
  )

  // Parse sorting from URL
  const sorting: SortingState = useMemo(() => {
    return urlParams.sort || []
  }, [urlParams.sort])

  // Standard mode filters - convert from URL format to ColumnFiltersState
  const standardColumnFilters: ColumnFiltersState = useMemo(() => {
    // If globalFilter has OR/mixed filters, keep columnFilters EMPTY
    if (
      typeof globalFilter === 'object' &&
      globalFilter &&
      'filters' in globalFilter &&
      filterMode === 'standard'
    ) {
      return [] // Empty - filters are in globalFilter
    }
    // Otherwise use regular filters (AND logic via columnFilters)
    return urlParams.filters.map((filter: ExtendedColumnFilter<Product>) => ({
      id: filter.id,
      value: filter,
    }))
  }, [urlParams.filters, globalFilter, filterMode])

  // Inline mode filters - convert from URL format to ColumnFiltersState
  const inlineColumnFilters: ColumnFiltersState = useMemo(() => {
    // If globalFilter has OR/mixed filters, keep columnFilters EMPTY
    if (
      typeof globalFilter === 'object' &&
      globalFilter &&
      'filters' in globalFilter &&
      filterMode === 'inline'
    ) {
      return [] // Empty - filters are in globalFilter
    }
    // Otherwise use regular inline filters (AND logic via columnFilters)
    return urlParams.inlineFilters.map(
      (filter: ExtendedColumnFilter<Product>) => ({
        id: filter.id,
        value: filter,
      })
    )
  }, [urlParams.inlineFilters, globalFilter, filterMode])

  // Column pinning state from URL
  const columnPinning: ColumnPinningState = useMemo(() => {
    return urlParams.pin || { left: [], right: [] }
  }, [urlParams.pin])

  // Get active column filters based on filter mode
  const columnFilters =
    filterMode === 'standard' ? standardColumnFilters : inlineColumnFilters

  // PERFORMANCE: Debounce column filters to batch rapid filter changes (e.g. clicking
  // multiple faceted filter options) into a single server request instead of one per click
  const debouncedColumnFilters = useDebounce(columnFilters, 300)

  // Column visibility from URL
  const columnVisibility = urlParams.columnVisibility

  // Use TanStack Query for server-side data fetching
  // This provides automatic caching, refetching, and error handling
  // Using placeholderData: keepPreviousData prevents UI jumps during pagination
  // by keeping the previous data visible while new data is being fetched
  const {
    data: queryData,
    isLoading,
    error: queryError,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery({
    queryKey: [
      'products',
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      globalFilter,
      debouncedColumnFilters,
      filterMode,
    ],
    queryFn: () =>
      fetchProducts({
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        globalFilter,
        columnFilters: debouncedColumnFilters,
      }),
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    placeholderData: keepPreviousData, // Keep previous data visible during pagination
  })

  // Extract data and total from query response
  const data = queryData?.data ?? []
  const totalCount = queryData?.total ?? 0
  const facets = queryData?.facets

  // Create dynamic columns with faceted options passed directly to filter menus.
  // The `options` prop on DataTableColumnFacetedFilterMenu bypasses useGeneratedOptions
  // entirely, avoiding stale memo issues with table.getAllColumns().
  const dynamicColumns = useMemo(() => {
    const userOpts = facets?.userId
      ? userOptions.filter((opt) => facets.userId?.includes(opt.value))
      : userOptions

    return columns.map((col) => {
      const key = (col as { accessorKey?: string }).accessorKey
      if (key === 'userId') {
        return {
          ...col,
          header: () => (
            <DataTableColumnHeader>
              <DataTableColumnTitle />
              <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
              <DataTableColumnFacetedFilterMenu options={userOpts} />
            </DataTableColumnHeader>
          ),
        } as DataTableColumnDef<Product>
      }
      return col
    })
  }, [facets])

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Failed to fetch data'
    : null

  // Get query client for prefetching
  const queryClient = useQueryClient()

  // Track prefetching state
  const [prefetchingState, setPrefetchingState] = useState<{
    next: boolean
    previous: boolean
  }>({ next: false, previous: false })
  const effectRunRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Prefetch next and previous pages for smoother navigation
  useEffect(() => {
    const totalPages = Math.ceil(totalCount / pagination.pageSize)
    const currentPage = pagination.pageIndex
    const currentRun = ++effectRunRef.current

    // Abort any previous prefetch operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this effect run
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Reset prefetching state immediately when effect runs
    // Use startTransition to mark as non-urgent and avoid cascading renders
    startTransition(() => {
      setPrefetchingState({ next: false, previous: false })
    })

    // Helper to safely update state only if this effect run is still current
    const safeSetState = (
      updater: (prev: { next: boolean; previous: boolean }) => {
        next: boolean
        previous: boolean
      }
    ) => {
      if (
        currentRun === effectRunRef.current &&
        !abortController.signal.aborted
      ) {
        setPrefetchingState(updater)
      }
    }

    // Prefetch next page if it exists
    if (currentPage + 1 < totalPages && !abortController.signal.aborted) {
      safeSetState((prev) => ({ ...prev, next: true }))

      queryClient
        .prefetchQuery({
          queryKey: [
            'products',
            currentPage + 1,
            pagination.pageSize,
            sorting,
            globalFilter,
            columnFilters,
            filterMode,
          ],
          queryFn: () =>
            fetchProducts({
              page: currentPage + 1,
              pageSize: pagination.pageSize,
              sorting,
              globalFilter,
              columnFilters,
            }),
          staleTime: 30000,
        })
        .then(() => {
          safeSetState((prev) => ({ ...prev, next: false }))
        })
        .catch(() => {
          // Reset on error too
          safeSetState((prev) => ({ ...prev, next: false }))
        })
    }

    // Prefetch previous page if it exists
    if (currentPage > 0 && !abortController.signal.aborted) {
      safeSetState((prev) => ({ ...prev, previous: true }))

      queryClient
        .prefetchQuery({
          queryKey: [
            'products',
            currentPage - 1,
            pagination.pageSize,
            sorting,
            globalFilter,
            columnFilters,
            filterMode,
          ],
          queryFn: () =>
            fetchProducts({
              page: currentPage - 1,
              pageSize: pagination.pageSize,
              sorting,
              globalFilter,
              columnFilters,
            }),
          staleTime: 30000,
        })
        .then(() => {
          safeSetState((prev) => ({ ...prev, previous: false }))
        })
        .catch(() => {
          // Reset on error too
          safeSetState((prev) => ({ ...prev, previous: false }))
        })
    }

    // Cleanup function: reset state and abort operations when effect re-runs
    return () => {
      // Reset state immediately (cleanup is safe to do synchronously)
      setPrefetchingState({ next: false, previous: false })
      // Abort any ongoing prefetch operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      // Note: Don't reset effectRunRef.current here - it's already been incremented
      // by the new effect run. Setting it to 0 would break the safeSetState checks.
    }
  }, [
    queryClient,
    pagination.pageIndex,
    pagination.pageSize,
    totalCount,
    sorting,
    globalFilter,
    columnFilters,
    filterMode,
  ])

  // Handlers for pagination
  // Use functional update to avoid dependency on pagination state
  // This prevents stale closures and ensures the latest state is always used
  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      // Get current pagination from URL params to ensure we have latest state
      const currentPagination: PaginationState = {
        pageIndex: urlParams.pageIndex,
        pageSize: urlParams.pageSize,
      }
      const newPagination =
        typeof updater === 'function' ? updater(currentPagination) : updater
      void setUrlParams({
        pageIndex: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      })
    },
    [urlParams.pageIndex, urlParams.pageSize, setUrlParams]
  )

  // Handlers for sorting
  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater
      void setUrlParams({ sort: newSorting.length > 0 ? newSorting : null })
    },
    [sorting, setUrlParams]
  )

  // Handlers for column pinning
  const handleColumnPinningChange = useCallback(
    (updater: Updater<ColumnPinningState>) => {
      const newPinning =
        typeof updater === 'function' ? updater(columnPinning) : updater
      void setUrlParams({ pin: newPinning })
    },
    [columnPinning, setUrlParams]
  )

  // Handlers for filters (standard mode)
  const handleStandardColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === 'function' ? updater(standardColumnFilters) : updater

      // Extract the ExtendedColumnFilter from filter.value
      const filters = newFilters.map(
        (filter) => filter.value
      ) as ExtendedColumnFilter<Product>[]

      // Exclude filterId from URL to keep URLs shorter
      const urlFilters = serializeFiltersForUrl(
        filters
      ) as ExtendedColumnFilter<Product>[]
      void setUrlParams({ filters: urlFilters, pageIndex: 0 })
    },
    [standardColumnFilters, setUrlParams]
  )

  // Handlers for filters (inline mode)
  const handleInlineColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      const newFilters =
        typeof updater === 'function' ? updater(inlineColumnFilters) : updater

      // Extract the ExtendedColumnFilter from filter.value
      const filters = newFilters.map(
        (filter) => filter.value
      ) as ExtendedColumnFilter<Product>[]

      // Exclude filterId from URL to keep URLs shorter
      const urlFilters = serializeFiltersForUrl(
        filters
      ) as ExtendedColumnFilter<Product>[]
      void setUrlParams({ inlineFilters: urlFilters, pageIndex: 0 })
    },
    [inlineColumnFilters, setUrlParams]
  )

  // Track previous globalFilter value to prevent infinite loops
  const prevGlobalFilterRef = useRef<string | object | undefined>(undefined)

  // Handlers for global filter (handles both search string and OR filter object)
  const handleGlobalFilterChange = useCallback(
    (value: string | object) => {
      // Prevent infinite loops - check if value actually changed
      const valueStr = JSON.stringify(value)
      const prevStr = JSON.stringify(prevGlobalFilterRef.current)
      if (valueStr === prevStr) {
        return
      }

      // Update ref before calling setUrlParams
      prevGlobalFilterRef.current = value

      if (typeof value === 'string') {
        // Simple search string - only set search param
        // Keep globalFilter independent - both can coexist
        void setUrlParams({
          search: value || null, // null removes from URL if empty
          pageIndex: 0,
        })
      } else {
        // OR filter object - store in globalFilter
        // Keep search param independent - both can coexist
        // Exclude filterId from filters to keep URLs shorter
        const filterObj = value as {
          filters: ExtendedColumnFilter<Product>[]
          joinOperator: string
        }
        const serializedFilters = serializeFiltersForUrl(
          filterObj.filters
        ) as ExtendedColumnFilter<Product>[]
        void setUrlParams({
          globalFilter: {
            filters: serializedFilters,
            joinOperator: filterObj.joinOperator,
          },
          pageIndex: 0,
          // Don't clear search - it's independent from globalFilter
        })
      }
    },
    [setUrlParams]
  )

  // Handlers for column visibility
  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      const newVisibility =
        typeof updater === 'function'
          ? updater(urlParams.columnVisibility)
          : updater
      void setUrlParams({ columnVisibility: newVisibility })
    },
    [urlParams.columnVisibility, setUrlParams]
  )

  // Extract ExtendedColumnFilter from globalFilter or urlParams.filters (standard mode)
  const currentStandardFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
    if (
      typeof globalFilter === 'object' &&
      globalFilter &&
      'filters' in globalFilter &&
      filterMode === 'standard'
    ) {
      const filterObj = globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }

    // Otherwise use urlParams.filters directly (AND logic)
    return urlParams.filters || []
  }, [urlParams.filters, globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedStandardFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentStandardFilters),
    [currentStandardFilters]
  )

  // Extract ExtendedColumnFilter from globalFilter or urlParams.inlineFilters (inline mode)
  const currentInlineFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
    if (
      typeof globalFilter === 'object' &&
      globalFilter &&
      'filters' in globalFilter &&
      filterMode === 'inline'
    ) {
      const filterObj = globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }

    // Otherwise use urlParams.inlineFilters directly (AND logic)
    return urlParams.inlineFilters || []
  }, [urlParams.inlineFilters, globalFilter, filterMode])

  // Normalize filters to ensure they have unique filterIds
  // The normalization function is deterministic (uses index-based IDs), so it produces
  // stable results when filters haven't changed, preventing unnecessary re-renders
  const normalizedInlineFilters = useMemo(
    () => normalizeFiltersWithUniqueIds(currentInlineFilters),
    [currentInlineFilters]
  )

  // Direct filter change handlers - sync filter UI changes directly to URL
  const handleStandardFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[] | null) => {
      // When clearing filters (null or empty array), also clear globalFilter and search
      if (!filters || filters.length === 0) {
        void setUrlParams({
          filters: [],
          globalFilter: null, // null removes from URL
          search: null, // null removes from URL
          pageIndex: 0,
        })
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        // Exclude filterId from URL to keep URLs shorter
        const urlFilters = serializeFiltersForUrl(
          result.processedFilters
        ) as ExtendedColumnFilter<Product>[]

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          void setUrlParams({
            filters: [],
            globalFilter: {
              filters: urlFilters,
              joinOperator: result.joinOperator,
            },
            pageIndex: 0,
          })
        } else {
          // Use filters param for AND logic
          // Only clear globalFilter if it exists in URL (don't set it if it doesn't exist)
          const params: Record<string, unknown> = {
            filters: urlFilters,
            pageIndex: 0,
          }
          // Check if globalFilter exists in URL (not just default value)
          if (
            urlParams.globalFilter !== null &&
            typeof urlParams.globalFilter === 'object' &&
            'filters' in urlParams.globalFilter
          ) {
            params.globalFilter = null
          }
          void setUrlParams(params)
        }
      }
    },
    [setUrlParams, urlParams.globalFilter]
  )

  const handleInlineFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[]) => {
      // When clearing filters (empty array), also clear globalFilter and search
      if (filters.length === 0) {
        void setUrlParams({
          inlineFilters: [],
          globalFilter: null, // null removes from URL
          search: null, // null removes from URL
          pageIndex: 0,
        })
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        // Exclude filterId from URL to keep URLs shorter
        const urlFilters = serializeFiltersForUrl(
          result.processedFilters
        ) as ExtendedColumnFilter<Product>[]

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          void setUrlParams({
            inlineFilters: [],
            globalFilter: {
              filters: urlFilters,
              joinOperator: result.joinOperator,
            },
            pageIndex: 0,
            // Don't clear search - it's independent from globalFilter
          })
        } else {
          // Use inlineFilters param for AND logic
          // Only clear globalFilter if it exists in URL (don't set it if it doesn't exist)
          const params: Record<string, unknown> = {
            inlineFilters: urlFilters,
            pageIndex: 0,
          }
          // Check if globalFilter exists in URL (not just default value)
          if (
            urlParams.globalFilter !== null &&
            typeof urlParams.globalFilter === 'object' &&
            'filters' in urlParams.globalFilter
          ) {
            params.globalFilter = null
          }
          void setUrlParams(params)
        }
      }
    },
    [setUrlParams, urlParams.globalFilter]
  )

  // Manual refresh function - TanStack Query handles refetching automatically
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Calculate pageCount for manual pagination
  const pageCount =
    totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 1

  return (
    <div className="w-full space-y-4">
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="text-destructive h-5 w-5" />
            <div className="flex-1">
              <p className="text-destructive text-sm font-medium">
                Error loading data
              </p>
              <p className="text-muted-foreground text-xs">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between space-y-4">
        <Tabs
          value={filterMode}
          onValueChange={(value) => {
            const newMode = value as 'standard' | 'inline'

            if (newMode === 'standard') {
              // Switching to standard: clear inline filters
              void setUrlParams({
                filterMode: 'standard',
                inlineFilters: [],
                pageIndex: 0,
              })
            } else {
              // Switching to inline: clear standard filters
              void setUrlParams({
                filterMode: 'inline',
                filters: [],
                pageIndex: 0,
              })
            }
          }}
          className="w-full"
        >
          <div className="flex w-full items-center justify-between">
            <TabsList>
              <TabsTrigger value="standard">Standard Filters</TabsTrigger>
              <TabsTrigger value="inline">Inline Filters</TabsTrigger>
            </TabsList>

            {/* Loading Indicator */}
            {/* Only show loading indicator on initial load, not during pagination */}
            {isLoading && (
              <div className="bg-muted/30 flex items-center gap-2 rounded-lg border p-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">
                  Loading products from server...
                </span>
              </div>
            )}
            {/* Show subtle indicator during pagination/filtering (when using previous data) */}
            {isPlaceholderData && isFetching && (
              <div className="bg-muted/30 flex items-center gap-2 rounded-lg border p-2 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">
                  Loading new page...
                </span>
              </div>
            )}
            {/* Show prefetching indicators */}
            {!isLoading && !isPlaceholderData && (
              <div className="flex items-center gap-2">
                {prefetchingState.next && (
                  <div className="bg-muted/30 flex items-center gap-2 rounded-lg border p-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">
                      Prefetching next page...
                    </span>
                  </div>
                )}
                {prefetchingState.previous && (
                  <div className="bg-muted/30 flex items-center gap-2 rounded-lg border p-2 text-xs">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-muted-foreground">
                      Prefetching previous page...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <TabsContent value="standard" className="space-y-4">
            <DataTableRoot
              data={data}
              columns={dynamicColumns}
              isLoading={isLoading}
              config={{
                manualPagination: true,
                manualFiltering: true,
                manualSorting: true,
                pageCount,
              }}
              state={{
                globalFilter,
                sorting,
                columnFilters: standardColumnFilters,
                columnVisibility,
                columnPinning,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleStandardColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onPaginationChange={handlePaginationChange}
              onColumnPinningChange={handleColumnPinningChange}
            >
              <StandardFilterToolbar
                filters={normalizedStandardFilters}
                onFiltersChange={handleStandardFiltersChange}
                search={urlParams.search}
                onSearchChange={(value) => {
                  void setUrlParams({
                    search: value || null, // null removes from URL if empty
                    pageIndex: 0,
                  })
                }}
              />
              <DataTable>
                <DataTableHeader />
                <DataTableBody>
                  <DataTableSkeleton rows={pagination.pageSize} />
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <UserSearch className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No products found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        There are no products to display at this time.
                      </DataTableEmptyDescription>
                    </DataTableEmptyMessage>
                    <DataTableEmptyFilteredMessage>
                      <DataTableEmptyIcon>
                        <SearchX className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No matches found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        Try adjusting your filters or search to find what
                        you&apos;re looking for.
                      </DataTableEmptyDescription>
                    </DataTableEmptyFilteredMessage>
                  </DataTableEmptyBody>
                </DataTableBody>
              </DataTable>
              <DataTablePagination
                totalCount={totalCount}
                isLoading={isLoading}
                isFetching={isFetching}
                disableNextPage={isLoading}
                disablePreviousPage={isLoading}
              />
            </DataTableRoot>
          </TabsContent>

          <TabsContent value="inline" className="space-y-4">
            <DataTableRoot
              data={data}
              columns={dynamicColumns}
              isLoading={isLoading}
              config={{
                manualPagination: true,
                manualFiltering: true,
                manualSorting: true,
                pageCount,
              }}
              state={{
                globalFilter,
                sorting,
                columnFilters: inlineColumnFilters,
                columnVisibility,
                columnPinning,
                pagination,
              }}
              onGlobalFilterChange={handleGlobalFilterChange}
              onSortingChange={handleSortingChange}
              onColumnFiltersChange={handleInlineColumnFiltersChange}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onPaginationChange={handlePaginationChange}
              onColumnPinningChange={handleColumnPinningChange}
            >
              <InlineFilterToolbar
                filters={normalizedInlineFilters}
                onFiltersChange={handleInlineFiltersChange}
                search={urlParams.search}
                onSearchChange={(value) => {
                  void setUrlParams({
                    search: value || null, // null removes from URL if empty
                    pageIndex: 0,
                  })
                }}
              />
              <DataTable>
                <DataTableHeader />
                <DataTableBody>
                  <DataTableSkeleton rows={pagination.pageSize} />
                  <DataTableEmptyBody>
                    <DataTableEmptyMessage>
                      <DataTableEmptyIcon>
                        <UserSearch className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No products found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        There are no products to display at this time.
                      </DataTableEmptyDescription>
                    </DataTableEmptyMessage>
                    <DataTableEmptyFilteredMessage>
                      <DataTableEmptyIcon>
                        <SearchX className="size-12" />
                      </DataTableEmptyIcon>
                      <DataTableEmptyTitle>
                        No matches found
                      </DataTableEmptyTitle>
                      <DataTableEmptyDescription>
                        Try adjusting your filters or search to find what
                        you&apos;re looking for.
                      </DataTableEmptyDescription>
                    </DataTableEmptyFilteredMessage>
                  </DataTableEmptyBody>
                </DataTableBody>
              </DataTable>
              <DataTablePagination
                totalCount={totalCount}
                isLoading={isLoading}
                isFetching={isFetching}
                disableNextPage={isLoading}
                disablePreviousPage={isLoading}
              />
            </DataTableRoot>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * Main component wrapped in QueryClientProvider and NuqsAdapter
 *
 * This example includes both QueryClientProvider and NuqsAdapter at the component level
 * since it's a standalone example.
 *
 * For production apps, it's recommended to add these providers at your root layout instead:
 * - Next.js App Router: Wrap in app/layout.tsx
 * - Next.js Pages Router: Wrap in pages/_app.tsx
 * - React SPA: Wrap in src/main.tsx
 *
 * See the component documentation at the top of this file for detailed setup instructions.
 */
export default function ServerSideStateTableExample() {
  // Create a QueryClient instance with sensible defaults for server-side data tables
  // Using useState with lazy initializer ensures it's only created once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // Consider data fresh for 30 seconds
            gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
            refetchOnWindowFocus: false, // Don't refetch on window focus for data tables
            retry: 1, // Retry failed requests once
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ServerSideStateTableContent />
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
