'use client'

import { useMemo, useState, useEffect } from 'react'
import type { TrainingRecordResponse } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Award, FileX, Search, Download } from 'lucide-react'
import { env } from '@/shared/lib/env'
import {
  buildCertificateFileUrl,
  formatCourseDateRange,
} from '../lib/employee-detail'
import Link from 'next/link'

const courseTypeLabelByValue = new Map<string, string>([
  ['Internal', 'ภายใน'],
  ['External', 'ภายนอก'],
])

/**
 * คอมโพเนนต์แสดงหน้าต่าง Dialog สำหรับพรีวิวและดาวน์โหลดใบรับรอง
 * ทำหน้าที่ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่ (ผ่าน HEAD request) และแสดง iframe หากมีไฟล์
 */
export function EmployeeCertificateDialog({
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
          <div className="bg-muted relative flex min-h-100 flex-col lg:h-[65vh]">
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
