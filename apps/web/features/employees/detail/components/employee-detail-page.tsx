'use client'

import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import type {
  EmployeeDetailResponse,
  TrainingRecordResponse,
} from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { cn } from '@workspace/ui/lib/utils'
import {
  Award,
  BookOpen,
  Calendar,
  Clock3,
  GraduationCap,
  Pen,
  Upload,
  UserRound,
  Workflow,
} from 'lucide-react'
import { env } from '@/shared/lib/env'
import {
  buildCertificateFileUrl,
  buildEmployeeDetailStats,
  formatCourseDateRange,
  formatThaiDate,
} from '../lib/employee-detail'
import { EmployeeTrainingHistoryTable } from './training-history-table'
import { Separator } from '@workspace/ui/components/separator'

const prefixLabelByValue = new Map<string, string>([
  ['Mr', 'นาย'],
  ['Mrs', 'นาง'],
  ['Miss', 'นางสาว'],
])

const statusLabelByValue = new Map<string, string>([
  ['Active', 'ทำงาน'],
  ['Resigned', 'ลาออก'],
])

const courseTypeLabelByValue = new Map<string, string>([
  ['Internal', 'ภายใน'],
  ['External', 'ภายนอก'],
])

function getEmployeeDisplayName(employee: EmployeeDetailResponse): string {
  const prefixLabel = prefixLabelByValue.get(employee.prefix) ?? employee.prefix
  return `${prefixLabel} ${employee.firstName} ${employee.lastName}`
}

function buildOrganizationHierarchy(employee: EmployeeDetailResponse) {
  return [
    { label: 'โรงงาน', value: employee.plantName },
    { label: 'หน่วยธุรกิจ', value: employee.buName },
    { label: 'สายงาน', value: employee.functionName },
    { label: 'ฝ่าย', value: employee.divisionName },
    { label: 'แผนก', value: employee.departmentName },
  ]
}

function DetailStatCard({
  icon: Icon,
  label,
  value,
  toneClassName,
  valueClassName,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  toneClassName: string
  valueClassName?: string
}) {
  return (
    <Card className="gap-0 rounded-xl bg-white shadow-none">
      <CardContent className="flex items-center gap-5 px-5 py-1">
        <div
          className={cn(
            'flex size-16 shrink-0 items-center justify-center rounded-full',
            toneClassName
          )}
        >
          <Icon className="size-8" />
        </div>
        <div className="min-w-0">
          <p className="text-md font-medium text-slate-500">{label}</p>
          <p
            className={cn(
              'mt-1 truncate text-2xl font-semibold tracking-tight text-slate-900',
              valueClassName
            )}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailFieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">
        {value}
      </span>
    </div>
  )
}

function EmployeeCertificateDialog({
  employeeName,
  trainingRecord,
  open,
  onOpenChange,
}: {
  employeeName: string
  trainingRecord: TrainingRecordResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const certificateUrl = useMemo(
    () =>
      buildCertificateFileUrl(
        trainingRecord?.certFilePath,
        env.NEXT_PUBLIC_API_URL
      ),
    [trainingRecord]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-xl font-semibold">
            ตัวอย่างใบรับรอง
          </DialogTitle>
          <DialogDescription>
            ตรวจสอบใบรับรองของ {employeeName}
            {trainingRecord?.course?.title
              ? ` สำหรับหลักสูตร ${trainingRecord.course.title}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {certificateUrl ? (
              <iframe
                title="ตัวอย่างใบรับรอง"
                src={certificateUrl}
                className="h-[62vh] w-full"
              />
            ) : (
              <div className="flex h-[62vh] items-center justify-center px-6 text-center text-sm text-slate-500">
                ไม่พบไฟล์ใบรับรองสำหรับรายการนี้
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">
              รายละเอียดใบรับรอง
            </h3>
            <div className="mt-4 space-y-4">
              <DetailFieldRow label="ชื่อพนักงาน" value={employeeName} />
              <DetailFieldRow
                label="หลักสูตร"
                value={trainingRecord?.course?.title ?? '-'}
              />
              <DetailFieldRow
                label="ช่วงวันที่"
                value={
                  trainingRecord ? formatCourseDateRange(trainingRecord) : '-'
                }
              />
              <DetailFieldRow
                label="ประเภท"
                value={
                  courseTypeLabelByValue.get(
                    trainingRecord?.course?.type ?? ''
                  ) ??
                  trainingRecord?.course?.type ??
                  '-'
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 px-6 py-5 sm:justify-between">
          <p className="text-sm text-slate-500">
            หาก preview ไม่แสดงผล สามารถดาวน์โหลดไฟล์เพื่อตรวจสอบได้
          </p>
          {certificateUrl ? (
            <Button asChild>
              <a
                href={certificateUrl}
                target="_blank"
                rel="noreferrer"
                download
              >
                ดาวน์โหลดใบรับรอง
              </a>
            </Button>
          ) : (
            <Button disabled>ดาวน์โหลดใบรับรอง</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EmployeeDetailPage({
  employee,
}: {
  employee: EmployeeDetailResponse
}) {
  const stats = useMemo(() => buildEmployeeDetailStats(employee), [employee])
  const organizationHierarchy = useMemo(
    () => buildOrganizationHierarchy(employee),
    [employee]
  )
  const employeeName = useMemo(
    () => getEmployeeDisplayName(employee),
    [employee]
  )
  const [selectedTrainingRecord, setSelectedTrainingRecord] =
    useState<TrainingRecordResponse | null>(null)

  return (
    <>
      <div className="flex flex-1 bg-white">
        <div className="mx-auto flex w-full flex-col gap-6 px-2 py-2 md:py-4">
          <Card className="gap-0 rounded-lg bg-white shadow-none">
            <CardContent className="space-y-6">
              {/* header: ชื่อ + actions */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {employeeName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-7 rounded-lg border-slate-200 px-2.5 text-xs font-medium text-slate-600"
                    >
                      {employee.employeeNo}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="h-7 rounded-lg border-slate-200 px-2.5 text-xs font-medium text-slate-600"
                    >
                      {employee.jobLevel}
                    </Badge>
                    <Badge
                      variant={
                        employee.status === 'Active' ? 'success' : 'inactive'
                      }
                      className="h-7 rounded-lg px-2.5 text-xs"
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          employee.status === 'Active'
                            ? 'bg-success'
                            : 'bg-gray-400'
                        )}
                      />
                      {statusLabelByValue.get(employee.status) ??
                        employee.status}
                    </Badge>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    ดูข้อมูลพนักงาน โครงสร้างองค์กร
                    และประวัติการอบรมทั้งหมดได้ในหน้าเดียว
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline">
                    <Upload className="mr-1 size-4" />
                    ส่งออก
                  </Button>
                  <Button type="button">
                    <Pen className="mr-1 size-4" />
                    แก้ไข
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailStatCard
                  icon={BookOpen}
                  label="จำนวนหลักสูตรทั้งหมด"
                  value={stats.totalTrainings.toLocaleString('th-TH')}
                  toneClassName="bg-[#EEF2FF] text-[#4F46E5]"
                />
                <DetailStatCard
                  icon={Clock3}
                  label="จำนวนชั่วโมงทั้งหมด"
                  value={`${stats.totalHours.toLocaleString('th-TH')} ชม.`}
                  toneClassName="bg-[#EFF6FF] text-[#2563EB]"
                  valueClassName="text-xl md:text-2xl"
                />
                <DetailStatCard
                  icon={Award}
                  label="ใบรับรอง"
                  value={stats.certificateCount.toLocaleString('th-TH')}
                  toneClassName="bg-[#F0FDF4] text-[#16A34A]"
                />
                <DetailStatCard
                  icon={Calendar}
                  label="อบรมล่าสุด"
                  value={formatThaiDate(stats.latestTrainingDate)}
                  toneClassName="bg-[#FFF7ED] text-[#F97316]"
                  valueClassName="text-lg md:text-xl"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {/* left column: span 1 */}
                <div className="space-y-3 sm:col-span-1 xl:col-span-1">
                  <Card className="gap-0 rounded-xl bg-white shadow-none">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-900">
                        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                          <UserRound className="size-4" />
                        </span>
                        ข้อมูลทั่วไป
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <DetailFieldRow
                        label="คำนำหน้า"
                        value={
                          prefixLabelByValue.get(employee.prefix) ??
                          employee.prefix
                        }
                      />
                      <DetailFieldRow label="ชื่อ" value={employee.firstName} />
                      <DetailFieldRow
                        label="นามสกุล"
                        value={employee.lastName}
                      />
                      <DetailFieldRow
                        label="เลขบัตรประชาชน"
                        value={employee.idCardNo ?? '-'}
                      />
                      <DetailFieldRow
                        label="วันที่เริ่มงาน"
                        value={formatThaiDate(employee.hireDate)}
                      />
                    </CardContent>
                  </Card>

                  <Card className="gap-0 rounded-xl bg-white shadow-none">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-900">
                        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                          <Workflow className="size-4" />
                        </span>
                        โครงสร้างองค์กร
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="relative">
                        <div className="absolute top-0 bottom-0 flex w-4 justify-center">
                          <div className="mt-[8px] mb-[8px] w-px bg-slate-900" />
                        </div>

                        <div className="space-y-5">
                          {organizationHierarchy.map((item) => (
                            <div
                              key={item.label}
                              className="grid grid-cols-[16px_80px_minmax(0,1fr)] items-start gap-x-3"
                            >
                              <div className="flex justify-center">
                                <span className="z-10 mt-[3px] block size-2.5 rounded-full bg-slate-900" />
                              </div>
                              <span className="text-sm text-slate-500">
                                {item.label}
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {item.value || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* right column: Training History — span 3 */}
                <Card className="gap-0 rounded-xl bg-white shadow-none sm:col-span-1 xl:col-span-3">
                  <CardHeader className="gap-2 pb-4">
                    <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-900">
                      <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                        <GraduationCap className="size-4" />
                      </span>
                      ประวัติการอบรม
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      ตารางนี้แสดงรายการอบรมทั้งหมดของพนักงาน
                      พร้อมดูใบรับรองจากแต่ละหลักสูตรได้ทันที
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <EmployeeTrainingHistoryTable
                      trainingRecords={employee.trainingRecords ?? []}
                      onPreviewCertificate={setSelectedTrainingRecord}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <EmployeeCertificateDialog
        employeeName={employeeName}
        trainingRecord={selectedTrainingRecord}
        open={selectedTrainingRecord != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTrainingRecord(null)
          }
        }}
      />
    </>
  )
}
