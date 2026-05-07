'use client'

import type { AuditLog } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet'
import { cn } from '@workspace/ui/lib/utils'
import { getAuditActionDisplay } from './columns'

interface AuditLogDetailDrawerProps {
  auditLog: AuditLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// แปลงเวลา ISO ให้เป็นรูปแบบวันเวลาแบบไทยสำหรับ panel รายละเอียด
function formatThaiDateTime(value: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date(value))
}

// แปลง JSON ให้แสดงผลแบบอ่านง่ายในกล่อง code block
function formatJsonValue(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

// ตรวจว่า action นี้ต้องซ่อน section การเปลี่ยนแปลงหรือไม่
function shouldHideChangesSection(action: AuditLog['action']): boolean {
  return action === 'Import' || action === 'Export' || action === 'Failed'
}

// ตรวจว่าค่าการเปลี่ยนแปลงว่างทั้งสองฝั่งหรือไม่
function hasNoChangeData(auditLog: AuditLog): boolean {
  return auditLog.oldValues == null && auditLog.newValues == null
}

// แสดงข้อมูล 1 แถวในส่วน Activity Overview
function OverviewItem({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="text-sm">{value}</div>
    </div>
  )
}

// แสดงกล่อง JSON เดี่ยวสำหรับข้อมูลก่อนหรือหลังการเปลี่ยนแปลง
function JsonPanel({
  title,
  value,
  tone,
}: {
  title: string
  value: unknown
  tone: 'before' | 'after'
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div
        className={cn(
          'border-b px-4 py-3 text-sm font-medium',
          tone === 'before'
            ? 'bg-destructive/5 text-destructive'
            : 'bg-success/5 text-success'
        )}
      >
        {title}
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 whitespace-pre-wrap">
        {formatJsonValue(value)}
      </pre>
    </div>
  )
}

// แสดง section Activity Overview ของ audit log ที่เลือกอยู่
function ActivityOverviewSection({ auditLog }: { auditLog: AuditLog }) {
  const actionDisplay = getAuditActionDisplay(auditLog.action)

  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-base font-semibold">Activity Overview</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <OverviewItem
          label="ผู้ใช้งาน"
          value={
            <div className="flex flex-col">
              <span className="font-medium">{auditLog.user.name}</span>
              <span className="text-muted-foreground text-sm">
                {auditLog.user.email}
              </span>
            </div>
          }
        />
        <OverviewItem
          label="กิจกรรม"
          value={
            <Badge variant={actionDisplay.variant}>{actionDisplay.label}</Badge>
          }
        />
        <OverviewItem label="โมเดล" value={auditLog.model} />
        <OverviewItem label="รหัสรายการ" value={auditLog.recordId ?? '-'} />
        <OverviewItem
          label="วันเวลา"
          value={
            <span className="tabular-nums">
              {formatThaiDateTime(auditLog.timestamp)}
            </span>
          }
        />
        <OverviewItem label="IP Address" value={auditLog.ipAddress ?? '-'} />
        <OverviewItem
          label="User Agent"
          value={
            <span className="text-sm break-all">
              {auditLog.userAgent ?? '-'}
            </span>
          }
          className="md:col-span-2"
        />
      </div>
    </section>
  )
}

// แสดง section การเปลี่ยนแปลงตามกติกาของ action แต่ละประเภท
function ChangesSection({ auditLog }: { auditLog: AuditLog }) {
  if (shouldHideChangesSection(auditLog.action)) {
    return null
  }

  return (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-4 text-base font-semibold">Changes (JSON Diff)</h2>

      {hasNoChangeData(auditLog) ? (
        <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-sm">
          ไม่มีข้อมูลการเปลี่ยนแปลง
        </div>
      ) : null}

      {auditLog.action === 'Create' && auditLog.newValues != null ? (
        <JsonPanel title="หลังสร้าง" value={auditLog.newValues} tone="after" />
      ) : null}

      {auditLog.action === 'Delete' && auditLog.oldValues != null ? (
        <JsonPanel title="ก่อนลบ" value={auditLog.oldValues} tone="before" />
      ) : null}

      {auditLog.action === 'Update' &&
      (auditLog.oldValues != null || auditLog.newValues != null) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <JsonPanel
            title="ก่อนแก้ไข"
            value={auditLog.oldValues ?? {}}
            tone="before"
          />
          <JsonPanel
            title="หลังแก้ไข"
            value={auditLog.newValues ?? {}}
            tone="after"
          />
        </div>
      ) : null}
    </section>
  )
}

// แสดง drawer รายละเอียดของ audit log ที่เลือกจากตาราง
export function AuditLogDetailDrawer({
  auditLog,
  open,
  onOpenChange,
}: AuditLogDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l bg-[#f7f8fa] p-0 sm:max-w-3xl"
      >
        {auditLog ? (
          <>
            <SheetHeader className="border-b bg-white px-6 py-5">
              <SheetTitle className="text-xl font-semibold">
                รายละเอียดประวัติการใช้งาน
              </SheetTitle>
              <SheetDescription>
                ตรวจสอบกิจกรรมและข้อมูลการเปลี่ยนแปลงของรายการนี้
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 p-6">
              <ActivityOverviewSection auditLog={auditLog} />
              <ChangesSection auditLog={auditLog} />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
