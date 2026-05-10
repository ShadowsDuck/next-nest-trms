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
  FileX,
  Search,
  Download,
} from 'lucide-react'
import { env } from '@/shared/lib/env'
import { useEffect } from 'react'
import {
  buildCertificateFileUrl,
  buildEmployeeDetailStats,
  formatCourseDateRange,
  formatThaiDate,
} from '../lib/employee-detail'
import { EmployeeTrainingHistoryTable } from './training-history-table'
import { Separator } from '@workspace/ui/components/separator'
import Link from 'next/link'

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
          <p className="text-md text-muted-foreground font-medium">{label}</p>
          <p
            className={cn(
              'text-foreground mt-1 truncate text-2xl font-semibold tracking-tight',
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
    <div className="border-border flex items-center justify-between gap-4 border-b py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground text-right text-sm font-medium">
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
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'error'>(
    'idle'
  )

  const certificateUrl = useMemo(
    () =>
      buildCertificateFileUrl(
        trainingRecord?.certFilePath,
        env.NEXT_PUBLIC_API_URL
      ),
    [trainingRecord]
  )

  useEffect(() => {
    if (!open || !certificateUrl) {
      setStatus('idle')
      return
    }

    const checkFile = async () => {
      setStatus('checking')
      try {
        const response = await fetch(certificateUrl, { method: 'HEAD' })
        if (response.ok) {
          setStatus('ready')
        } else {
          setStatus('error')
        }
      } catch (err) {
        // Fallback to ready if fetch is blocked by CORS, letting iframe handle it
        console.warn('Certificate availability check failed (CORS?):', err)
        setStatus('ready')
      }
    }

    void checkFile()
  }, [open, certificateUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl! gap-0 overflow-hidden p-0 sm:rounded-2xl">
        <DialogHeader className="border-border bg-muted/50 border-b px-6 py-5">
          <DialogTitle className="text-foreground text-xl font-bold">
            ใบรับรอง
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            ตรวจสอบความถูกต้องของใบรับรองอิเล็กทรอนิกส์
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
          {/* Preview Area */}
          <div className="bg-muted relative flex min-h-[400px] flex-col lg:h-[65vh]">
            {status === 'checking' && (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
                <div className="relative">
                  <div className="border-t-primary border-border size-16 animate-spin rounded-full border-4" />
                  <Search className="text-muted-foreground absolute inset-0 m-auto size-6" />
                </div>
                <p className="text-foreground mt-6 text-base font-medium">
                  กำลังเตรียมการแสดงผล...
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  ระบบกำลังตรวจสอบไฟล์ใบรับรองของคุณ
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="text-destructive bg-destructive/10 ring-destructive/20 mb-6 flex size-24 items-center justify-center rounded-full ring-8">
                  <FileX className="size-12" />
                </div>
                <h3 className="text-foreground text-xl font-bold">
                  ไม่พบไฟล์ใบรับรอง
                </h3>
                <p className="text-muted-foreground mt-3 max-w-xs text-sm leading-relaxed">
                  ขออภัย ระบบไม่พบไฟล์ใบรับรองในฐานข้อมูล
                  หรือไฟล์อาจถูกย้ายตำแหน่ง โปรดตรวจสอบอีกครั้งภายหลัง
                </p>
              </div>
            )}

            {status === 'ready' && certificateUrl && (
              <iframe
                title="ตัวอย่างใบรับรอง"
                src={certificateUrl}
                className="h-full w-full border-none"
              />
            )}

            {!certificateUrl && status !== 'checking' && (
              <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center p-12 text-center">
                <FileX className="mb-4 size-12 opacity-20" />
                ไม่พบข้อมูลไฟล์ใบรับรองสำหรับรายการนี้
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="border-border flex flex-col border-l bg-white p-6">
            <h3 className="text-foreground flex items-center gap-2 text-base font-bold">
              <Award className="text-primary size-4" />
              รายละเอียด
            </h3>
            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  พนักงาน
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {employeeName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  หลักสูตร
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {trainingRecord?.course?.title ?? '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  ช่วงเวลาที่อบรม
                </p>
                <p className="text-foreground text-sm font-semibold">
                  {trainingRecord ? formatCourseDateRange(trainingRecord) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  ประเภทหลักสูตร
                </p>
                <Badge variant="secondary" className="mt-1 font-medium">
                  {courseTypeLabelByValue.get(
                    trainingRecord?.course?.type ?? ''
                  ) ??
                    trainingRecord?.course?.type ??
                    '-'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-border flex-col border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="text-muted-foreground flex items-center gap-2">
            <div className="bg-border size-1.5 rounded-full" />
            <p className="text-[13px]">
              สามารถดาวน์โหลดไฟล์เก็บไว้เป็นหลักฐานได้
            </p>
          </div>
          <div className="mt-3 flex items-center sm:mt-0">
            {certificateUrl ? (
              <Button asChild>
                <Link
                  href={certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                >
                  <Download className="mr-1 size-4" />
                  ดาวน์โหลดไฟล์
                </Link>
              </Button>
            ) : (
              <Button disabled className="h-10 px-6">
                ไม่มีไฟล์ให้ดาวน์โหลด
              </Button>
            )}
          </div>
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
                      className="border-border text-muted-foreground h-7 rounded-lg px-2.5 text-xs font-medium"
                    >
                      {employee.employeeNo}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-border text-muted-foreground h-7 rounded-lg px-2.5 text-xs font-medium"
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
                            : 'bg-inactive'
                        )}
                      />
                      {statusLabelByValue.get(employee.status) ??
                        employee.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground max-w-2xl text-sm leading-6">
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
                  toneClassName="bg-primary/10 text-primary"
                />
                <DetailStatCard
                  icon={Clock3}
                  label="จำนวนชั่วโมงทั้งหมด"
                  value={`${stats.totalHours.toLocaleString('th-TH')} ชม.`}
                  toneClassName="bg-sidebar-primary/10 text-sidebar-primary"
                  valueClassName="text-xl md:text-2xl"
                />
                <DetailStatCard
                  icon={Award}
                  label="ใบรับรอง"
                  value={stats.certificateCount.toLocaleString('th-TH')}
                  toneClassName="bg-success/10 text-success"
                />
                <DetailStatCard
                  icon={Calendar}
                  label="อบรมล่าสุด"
                  value={formatThaiDate(stats.latestTrainingDate)}
                  toneClassName="bg-warning/10 text-warning"
                  valueClassName="text-lg md:text-xl"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {/* left column: span 1 */}
                <div className="space-y-3 sm:col-span-1 xl:col-span-1">
                  <Card className="gap-0 rounded-xl bg-white shadow-none">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground flex items-center gap-3 text-base font-semibold">
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
                      <CardTitle className="text-foreground flex items-center gap-3 text-base font-semibold">
                        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                          <Workflow className="size-4" />
                        </span>
                        โครงสร้างองค์กร
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="relative">
                        <div className="absolute top-0 bottom-0 flex w-4 justify-center">
                          <div className="bg-foreground mt-[8px] mb-[8px] w-px" />
                        </div>

                        <div className="space-y-5">
                          {organizationHierarchy.map((item) => (
                            <div
                              key={item.label}
                              className="grid grid-cols-[16px_80px_minmax(0,1fr)] items-start gap-x-3"
                            >
                              <div className="flex justify-center">
                                <span className="bg-foreground z-10 mt-[3px] block size-2.5 rounded-full" />
                              </div>
                              <span className="text-muted-foreground text-sm">
                                {item.label}
                              </span>
                              <span className="text-foreground text-sm font-medium">
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
                    <CardTitle className="text-foreground flex items-center gap-3 text-base font-semibold">
                      <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                        <GraduationCap className="size-4" />
                      </span>
                      ประวัติการอบรม
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
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
