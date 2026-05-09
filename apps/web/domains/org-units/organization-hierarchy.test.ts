import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createEmptyOrganizationHierarchyOptions,
  getOrganizationHierarchyResetFields,
  OrganizationHierarchyLoadError,
} from './lib/hierarchy'

test('organization hierarchy reset fields keep the existing cascade order', () => {
  assert.deepEqual(getOrganizationHierarchyResetFields('plantId'), [
    'buId',
    'functionId',
    'divisionId',
    'departmentId',
  ])
  assert.deepEqual(getOrganizationHierarchyResetFields('buId'), [
    'functionId',
    'divisionId',
    'departmentId',
  ])
  assert.deepEqual(getOrganizationHierarchyResetFields('functionId'), [
    'divisionId',
    'departmentId',
  ])
  assert.deepEqual(getOrganizationHierarchyResetFields('divisionId'), [
    'departmentId',
  ])
})

test('organization hierarchy starts with empty options for every level', () => {
  assert.deepEqual(createEmptyOrganizationHierarchyOptions(), {
    plantOptions: [],
    buOptions: [],
    functionOptions: [],
    divisionOptions: [],
    departmentOptions: [],
  })
})

test('organization hierarchy load error keeps the partially loaded options snapshot', () => {
  const options = {
    plantOptions: [{ id: 'plant-1', name: 'Plant 1' }],
    buOptions: [],
    functionOptions: [],
    divisionOptions: [],
    departmentOptions: [],
  }

  const error = new OrganizationHierarchyLoadError('businessUnits', options)

  assert.equal(error.level, 'businessUnits')
  assert.deepEqual(error.options, options)
})
