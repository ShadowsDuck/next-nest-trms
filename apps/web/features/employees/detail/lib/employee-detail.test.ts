import assert from 'node:assert/strict'
import test from 'node:test'
import type { EmployeeResponse } from '@workspace/schemas'
import {
  buildCertificateFileUrl,
  buildEmployeeDetailStats,
} from './employee-detail'

const employeeFixture: EmployeeResponse = {
  id: 'EMP-ID-001',
  employeeNo: 'EMP-001',
  prefix: 'Mr',
  firstName: 'Ethan',
  lastName: 'Carter',
  idCardNo: '1234567890123',
  hireDate: '2022-01-15',
  jobLevel: 'S2',
  status: 'Active',
  plantId: 'plant-1',
  buId: 'bu-1',
  functionId: 'function-1',
  divisionId: 'division-1',
  departmentId: 'department-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  plantName: 'Acme Manufacturing Plant',
  buName: 'Product & Engineering',
  functionName: 'Engineering',
  divisionName: 'Software Engineering',
  departmentName: 'Platform Engineering',
  trainingRecords: [
    {
      id: 'TR-001',
      employeeId: 'EMP-ID-001',
      courseId: 'COURSE-001',
      certFilePath: '/uploads/certificates/ethan-react.pdf',
      createdByUserId: 'USER-001',
      updatedByUserId: 'USER-001',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      course: {
        id: 'COURSE-001',
        title: 'Advanced React Development',
        type: 'Internal',
        startDate: '2024-05-10',
        endDate: '2024-05-12',
        startTime: null,
        endTime: null,
        duration: 18,
        lecturer: null,
        institute: null,
        expense: 0,
        accreditationStatus: 'Approved',
        accreditationFilePath: null,
        attendanceFilePath: null,
        tagId: 'TAG-001',
        createdAt: '2024-05-01T00:00:00.000Z',
        updatedAt: '2024-05-01T00:00:00.000Z',
        tag: { id: 'TAG-001', name: 'Technical', colorCode: '#1D4ED8' },
        participants: [],
      },
    },
    {
      id: 'TR-002',
      employeeId: 'EMP-ID-001',
      courseId: 'COURSE-002',
      certFilePath: null,
      createdByUserId: 'USER-001',
      updatedByUserId: 'USER-001',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      course: {
        id: 'COURSE-002',
        title: 'Leadership Essentials',
        type: 'External',
        startDate: '2024-04-05',
        endDate: '2024-04-06',
        startTime: null,
        endTime: null,
        duration: 12,
        lecturer: null,
        institute: null,
        expense: 0,
        accreditationStatus: 'Approved',
        accreditationFilePath: null,
        attendanceFilePath: null,
        tagId: 'TAG-002',
        createdAt: '2024-04-01T00:00:00.000Z',
        updatedAt: '2024-04-01T00:00:00.000Z',
        tag: { id: 'TAG-002', name: 'Leadership', colorCode: '#7C3AED' },
        participants: [],
      },
    },
    {
      id: 'TR-003',
      employeeId: 'EMP-ID-001',
      courseId: 'COURSE-003',
      certFilePath: '/uploads/certificates/ethan-aws.pdf',
      createdByUserId: 'USER-001',
      updatedByUserId: 'USER-001',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      course: {
        id: 'COURSE-003',
        title: 'AWS Solutions Architect',
        type: 'External',
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        startTime: null,
        endTime: null,
        duration: 20,
        lecturer: null,
        institute: null,
        expense: 0,
        accreditationStatus: 'Approved',
        accreditationFilePath: null,
        attendanceFilePath: null,
        tagId: 'TAG-003',
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z',
        tag: { id: 'TAG-003', name: 'Cloud', colorCode: '#0E7490' },
        participants: [],
      },
    },
  ],
}

test('employee detail stats summarize real training data for the header cards', () => {
  const stats = buildEmployeeDetailStats(employeeFixture)

  assert.deepEqual(stats, {
    totalTrainings: 3,
    totalHours: 50,
    certificateCount: 2,
    latestTrainingDate: '2024-05-12',
  })
})

test('certificate file url uses api origin for relative file paths and preserves absolute urls', () => {
  assert.equal(
    buildCertificateFileUrl(
      '/uploads/certificates/ethan-react.pdf',
      'https://api.example.com'
    ),
    'https://api.example.com/uploads/certificates/ethan-react.pdf'
  )
  assert.equal(
    buildCertificateFileUrl(
      'https://cdn.example.com/certificate.pdf',
      'https://api.example.com'
    ),
    'https://cdn.example.com/certificate.pdf'
  )
  assert.equal(buildCertificateFileUrl(null, 'https://api.example.com'), null)
})
