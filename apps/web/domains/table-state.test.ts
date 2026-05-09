import assert from 'node:assert/strict'
import test from 'node:test'
import type { ColumnFiltersState } from '@tanstack/react-table'
import {
  auditLogTableFilterConfig,
  auditLogTableFilterDefaults,
  serializeAuditLogParams,
} from './audit-logs/lib/search-params'
import {
  courseTableFilterConfig,
  courseTableFilterDefaults,
  serializeCourseParams,
} from './courses/lib/search-params'
import {
  employeeTableFilterConfig,
  employeeTableFilterDefaults,
  serializeEmployeeParams,
} from './employees/lib/search-params'
import {
  buildColumnFiltersFromParams,
  buildFilterParamsFromColumnFilters,
} from '../shared/lib/table-state'

test('employee table state keeps the existing query format', () => {
  const query = serializeEmployeeParams({
    page: 2,
    limit: 25,
    search: 'john',
    prefix: ['Mr'],
    jobLevel: ['S1'],
    divisionName: ['Manufacturing'],
    departmentName: ['QA'],
    status: ['Active'],
  })

  assert.equal(
    query,
    '?page=2&limit=25&search=john&prefix=Mr&jobLevel=S1&divisionName=Manufacturing&departmentName=QA&status=Active'
  )
})

test('course table state keeps the existing query format', () => {
  const query = serializeCourseParams({
    page: 3,
    limit: 25,
    search: 'safety',
    type: ['Internal'],
    tagName: ['Compliance'],
    dateRange: [1715126400000, 1715731200000],
    durationRange: [1, 8],
    accreditationStatus: ['Approved'],
  })

  assert.equal(
    query,
    '?page=3&limit=25&search=safety&type=Internal&tagName=Compliance&dateRange=1715126400000,1715731200000&durationRange=1,8&accreditationStatus=Approved'
  )
})

test('audit log table state keeps the existing query format', () => {
  const query = serializeAuditLogParams({
    page: 4,
    limit: 25,
    search: 'export',
    model: ['Employee'],
    action: ['Export'],
    dateRange: [1715126400000, 1715731200000],
  })

  assert.equal(
    query,
    '?page=4&limit=25&search=export&model=Employee&action=Export&dateRange=1715126400000,1715731200000'
  )
})

test('employee filter config round-trips params and column filters', () => {
  const filters = buildColumnFiltersFromParams(
    {
      prefix: ['Mr'],
      jobLevel: ['S1'],
      divisionName: ['Manufacturing'],
      departmentName: ['QA'],
      status: ['Active'],
    },
    employeeTableFilterConfig
  )

  assert.deepEqual(filters, [
    { id: 'prefix', value: ['Mr'] },
    { id: 'jobLevel', value: ['S1'] },
    { id: 'divisionName', value: ['Manufacturing'] },
    { id: 'departmentName', value: ['QA'] },
    { id: 'status', value: ['Active'] },
  ])

  assert.deepEqual(
    buildFilterParamsFromColumnFilters(
      filters,
      employeeTableFilterConfig,
      employeeTableFilterDefaults
    ),
    {
      prefix: ['Mr'],
      jobLevel: ['S1'],
      divisionName: ['Manufacturing'],
      departmentName: ['QA'],
      status: ['Active'],
    }
  )
})

test('course filter config preserves mapped numeric columns', () => {
  const filters = buildColumnFiltersFromParams(
    {
      type: ['Internal'],
      tagName: ['Compliance'],
      dateRange: [1715126400000, 1715731200000],
      durationRange: [1, 8],
      accreditationStatus: ['Approved'],
    },
    courseTableFilterConfig
  )

  assert.deepEqual(filters, [
    { id: 'type', value: ['Internal'] },
    { id: 'tagName', value: ['Compliance'] },
    { id: 'dateRange', value: [1715126400000, 1715731200000] },
    { id: 'duration', value: [1, 8] },
    { id: 'accreditationStatus', value: ['Approved'] },
  ])

  const nextFilters: ColumnFiltersState = [
    { id: 'type', value: ['Internal'] },
    { id: 'tagName', value: ['Compliance'] },
    { id: 'dateRange', value: [1715126400000, 1715731200000] },
    { id: 'duration', value: [1, 8] },
    { id: 'accreditationStatus', value: ['Approved'] },
  ]

  assert.deepEqual(
    buildFilterParamsFromColumnFilters(
      nextFilters,
      courseTableFilterConfig,
      courseTableFilterDefaults
    ),
    {
      type: ['Internal'],
      tagName: ['Compliance'],
      dateRange: [1715126400000, 1715731200000],
      durationRange: [1, 8],
      accreditationStatus: ['Approved'],
    }
  )
})

test('audit log filter config preserves timestamp mapping and enum filtering', () => {
  const nextFilters: ColumnFiltersState = [
    { id: 'model', value: ['Employee'] },
    { id: 'action', value: ['Export', 'InvalidAction'] },
    { id: 'timestamp', value: [1715126400000, 1715731200000] },
  ]

  assert.deepEqual(
    buildFilterParamsFromColumnFilters(
      nextFilters,
      auditLogTableFilterConfig,
      auditLogTableFilterDefaults
    ),
    {
      model: ['Employee'],
      action: ['Export'],
      dateRange: [1715126400000, 1715731200000],
    }
  )
})
