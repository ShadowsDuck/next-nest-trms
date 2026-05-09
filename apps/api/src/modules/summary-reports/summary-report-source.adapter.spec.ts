import { NotFoundException } from '@nestjs/common';
import {
  buildSummaryReportSnapshot,
  buildSummaryReportSourceAdapters,
} from './summary-report-source.adapter';

describe('summary report source adapters', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('builds an employee summary snapshot through the employee adapter', async () => {
    const employeesService = {
      findByEmployeeNosForReport: jest.fn().mockResolvedValueOnce([
        {
          employeeNo: 'EMP-001',
          prefix: 'Mr',
          firstName: 'John',
          lastName: 'Doe',
          idCardNo: null,
          hireDate: '2024-01-01T00:00:00.000Z',
          jobLevel: 'S1',
          status: 'Active',
          plantName: 'Plant A',
          buName: 'BU A',
          functionName: 'Fn A',
          divisionName: 'Div A',
          departmentName: 'Dept A',
          trainingRecords: [],
        },
      ]),
    };
    const coursesService = {
      findByCourseIdsForReport: jest.fn(),
    };
    const adapters = buildSummaryReportSourceAdapters(
      employeesService as never,
      coursesService as never,
    );

    const snapshot = await buildSummaryReportSnapshot(
      adapters,
      {
        source: 'employees',
        selectedIds: ['EMP-001'],
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
      },
      '2026-05-09T00:00:00.000Z',
    );

    expect(employeesService.findByEmployeeNosForReport).toHaveBeenCalledWith([
      'EMP-001',
    ]);
    expect(snapshot).toMatchObject({
      source: 'employees',
      selectedIds: ['EMP-001'],
      generatedAt: '2026-05-09T00:00:00.000Z',
    });
  });

  it('builds a course summary snapshot through the course adapter', async () => {
    const employeesService = {
      findByEmployeeNosForReport: jest.fn(),
    };
    const coursesService = {
      findByCourseIdsForReport: jest.fn().mockResolvedValueOnce([
        {
          id: 'COURSE-001',
          title: 'Safety',
          type: 'Internal',
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          startTime: null,
          endTime: null,
          duration: 4,
          lecturer: null,
          institute: null,
          expense: 1000,
          accreditationStatus: 'Approved',
          accreditationFilePath: null,
          attendanceFilePath: null,
          tag: null,
          participants: [],
        },
      ]),
    };
    const adapters = buildSummaryReportSourceAdapters(
      employeesService as never,
      coursesService as never,
    );

    const snapshot = await buildSummaryReportSnapshot(
      adapters,
      {
        source: 'courses',
        selectedIds: ['COURSE-001'],
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
      },
      '2026-05-09T00:00:00.000Z',
    );

    expect(coursesService.findByCourseIdsForReport).toHaveBeenCalledWith([
      'COURSE-001',
    ]);
    expect(snapshot).toMatchObject({
      source: 'courses',
      selectedIds: ['COURSE-001'],
      generatedAt: '2026-05-09T00:00:00.000Z',
    });
  });

  it('keeps the existing employee not-found error when no report data exists', async () => {
    const adapters = buildSummaryReportSourceAdapters(
      {
        findByEmployeeNosForReport: jest.fn().mockResolvedValueOnce([]),
      } as never,
      {
        findByCourseIdsForReport: jest.fn(),
      } as never,
    );

    await expect(
      buildSummaryReportSnapshot(
        adapters,
        {
          source: 'employees',
          selectedIds: ['EMP-001'],
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
        },
        '2026-05-09T00:00:00.000Z',
      ),
    ).rejects.toEqual(
      new NotFoundException('ไม่พบข้อมูลพนักงานที่เลือกสำหรับสร้างรายงาน'),
    );
  });
});
