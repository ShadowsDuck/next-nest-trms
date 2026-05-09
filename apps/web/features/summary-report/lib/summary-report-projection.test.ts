import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSummaryReportProjection } from './summary-report-projection'

test('summary report projection normalizes employee snapshots into shared participant and enrollment datasets', () => {
  const projection = buildSummaryReportProjection({
    source: 'employees',
    selectedIds: ['EMP-001'],
    generatedAt: '2026-05-09T00:00:00.000Z',
    filtersSnapshot: {
      page: 1,
      limit: 25,
      search: '',
      prefix: [],
      jobLevel: [],
      divisionName: [],
      departmentName: [],
      status: [],
    },
    employees: [
      {
        id: 'EMP-ID-001',
        employeeNo: 'EMP-001',
        prefix: 'Mr',
        firstName: 'John',
        lastName: 'Doe',
        idCardNo: null,
        hireDate: '2024-01-01',
        jobLevel: 'S1',
        status: 'Active',
        plantId: 'PLANT-001',
        buId: 'BU-001',
        functionId: 'FUNCTION-001',
        divisionId: 'DIVISION-001',
        departmentId: 'DEPARTMENT-001',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        plantName: 'Plant A',
        buName: 'BU A',
        functionName: 'Fn A',
        divisionName: 'Div A',
        departmentName: 'Dept A',
        trainingRecords: [
          {
            id: 'TR-001',
            employeeId: 'EMP-ID-001',
            courseId: 'COURSE-001',
            certFilePath: null,
            createdByUserId: 'USER-001',
            updatedByUserId: 'USER-001',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            course: {
              id: 'COURSE-001',
              title: 'Safety',
              type: 'Internal',
              startDate: '2024-01-01',
              endDate: '2024-01-01',
              startTime: null,
              endTime: null,
              duration: 4,
              lecturer: null,
              institute: null,
              expense: 1200,
              accreditationStatus: 'Approved',
              accreditationFilePath: null,
              attendanceFilePath: null,
              tagId: 'TAG-1',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              tag: { id: 'TAG-1', name: 'Compliance' },
              participants: [],
            },
          },
        ],
      },
    ],
  })

  assert.equal(projection.participants.length, 1)
  assert.equal(projection.uniqueCourses.length, 1)
  assert.equal(projection.enrollments.length, 1)
  assert.equal(projection.uniqueCourses[0]?.expense, 1200)
  assert.equal(projection.enrollments[0]?.participantKey, 'EMP-001')
})

test('summary report projection de-duplicates course participants across selected courses', () => {
  const projection = buildSummaryReportProjection({
    source: 'courses',
    selectedIds: ['COURSE-001', 'COURSE-002'],
    generatedAt: '2026-05-09T00:00:00.000Z',
    filtersSnapshot: {
      page: 1,
      limit: 25,
      search: '',
      type: [],
      tagName: [],
      dateRange: [],
      durationRange: [],
      accreditationStatus: [],
    },
    courses: [
      {
        id: 'COURSE-001',
        title: 'Safety',
        type: 'Internal',
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        startTime: null,
        endTime: null,
        duration: 4,
        lecturer: null,
        institute: null,
        expense: 1000,
        accreditationStatus: 'Approved',
        accreditationFilePath: null,
        attendanceFilePath: null,
        tagId: 'TAG-1',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        tag: { id: 'TAG-1', name: 'Compliance' },
        participants: [
          {
            id: 'PARTICIPANT-001',
            employeeNo: 'EMP-001',
            prefix: 'Mr',
            firstName: 'John',
            lastName: 'Doe',
            hireDate: '2024-01-01',
            jobLevel: 'S1',
            status: 'Active',
            plantName: 'Plant A',
            buName: 'BU A',
            functionName: 'Fn A',
            divisionName: 'Div A',
            departmentName: 'Dept A',
          },
        ],
      },
      {
        id: 'COURSE-002',
        title: 'First Aid',
        type: 'External',
        startDate: '2024-02-01',
        endDate: '2024-02-01',
        startTime: null,
        endTime: null,
        duration: 8,
        lecturer: null,
        institute: null,
        expense: 800,
        accreditationStatus: 'Approved',
        accreditationFilePath: null,
        attendanceFilePath: null,
        tagId: 'TAG-2',
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T00:00:00.000Z',
        tag: { id: 'TAG-2', name: 'Medical' },
        participants: [
          {
            id: 'PARTICIPANT-001',
            employeeNo: 'EMP-001',
            prefix: 'Mr',
            firstName: 'John',
            lastName: 'Doe',
            hireDate: '2024-01-01',
            jobLevel: 'S1',
            status: 'Active',
            plantName: 'Plant A',
            buName: 'BU A',
            functionName: 'Fn A',
            divisionName: 'Div A',
            departmentName: 'Dept A',
          },
        ],
      },
    ],
  })

  assert.equal(projection.participants.length, 1)
  assert.equal(projection.uniqueCourses.length, 2)
  assert.equal(projection.enrollments.length, 2)
})
