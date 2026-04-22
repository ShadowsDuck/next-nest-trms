'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type {
  EmployeeImportDryRunResponse,
  EmployeeImportRawRow,
  EmployeeImportResponse,
} from '@workspace/schemas'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@workspace/ui/components/alert'
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
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import {
  CircleAlertIcon,
  FileSpreadsheetIcon,
  Loader2Icon,
  UploadIcon,
} from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import {
  dryRunImportEmployees,
  importEmployees,
} from '@/domains/employees/actions'
import { formatBytes, useFileUpload } from '@/shared/hooks/use-file-upload'
import { triggerCsvDownload } from '@/shared/lib/csv'
import { EMPLOYEES_QUERY_KEY } from '../options/query-options'

const TEMPLATE_COLUMNS = [
  'รหัสพนักงาน',
  'คำนำหน้า',
  'ชื่อ-นามสกุล',
  'วันที่เริ่มงาน',
  'Plant',
  'ระดับงาน',
  'ส่วนงาน',
  'ฝ่าย',
  'สายงาน',
  'BU',
  'บัตรประชาชน',
] as const

type EmployeeCsvImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type CsvRowRecord = Record<string, string | undefined>

export function EmployeeCsvImportDialog({
  open,
  onOpenChange,
}: EmployeeCsvImportDialogProps) {
  const queryClient = useQueryClient()
  const [csvRows, setCsvRows] = useState<EmployeeImportRawRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isDryRunning, setIsDryRunning] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [dryRunResult, setDryRunResult] =
    useState<EmployeeImportDryRunResponse | null>(null)
  const [importResult, setImportResult] =
    useState<EmployeeImportResponse | null>(null)

  const [
    { files, isDragging, errors: uploadErrors },
    {
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    accept: '.csv,text/csv',
    multiple: false,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onFilesChange: (newFiles) => {
      setDryRunResult(null)
      setImportResult(null)
      setParseErrors([])

      const firstFile = newFiles[0]?.file
      if (!(firstFile instanceof File)) {
        setCsvRows([])
        return
      }

      void parseCsvFile(firstFile)
    },
    onError: (errors) => {
      setParseErrors(errors)
    },
  })

  const selectedFile = files[0]?.file instanceof File ? files[0].file : null

  const hasValidDryRunRows = (dryRunResult?.summary.valid ?? 0) > 0

  const localizedUploadErrors = useMemo(
    () =>
      uploadErrors.map((error) => {
        if (error.includes('not an accepted file type')) {
          return 'ชนิดไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ .csv เท่านั้น'
        }
        if (error.includes('exceeds the maximum size')) {
          return 'ขนาดไฟล์เกินกำหนด (สูงสุด 10 MB)'
        }
        return error
      }),
    [uploadErrors]
  )

  const errorMessages = useMemo(
    () => [...localizedUploadErrors, ...parseErrors],
    [localizedUploadErrors, parseErrors]
  )

  // แปลงไฟล์ CSV เป็นโครงข้อมูลที่ backend ใช้ตรวจสอบและนำเข้า
  async function parseCsvFile(file: File) {
    setIsParsing(true)

    try {
      const result = await new Promise<Papa.ParseResult<CsvRowRecord>>(
        (resolve, reject) => {
          Papa.parse<CsvRowRecord>(file, {
            header: true,
            skipEmptyLines: 'greedy',
            transformHeader: (header) => header.trim(),
            transform: (value) => value.trim(),
            complete: resolve,
            error: reject,
          })
        }
      )

      if (result.errors.length > 0) {
        setCsvRows([])
        setParseErrors(
          result.errors.map(
            (error) =>
              `แถว ${(error.row ?? 0) + 1}: ${error.message || 'รูปแบบข้อมูลไม่ถูกต้อง'}`
          )
        )
        return
      }

      const parsedHeaders = (result.meta.fields ?? []).map((field) =>
        field.trim()
      )
      const missingColumns = TEMPLATE_COLUMNS.filter(
        (column) => !parsedHeaders.includes(column)
      )

      if (missingColumns.length > 0) {
        setCsvRows([])
        setParseErrors([
          `ไฟล์ CSV ไม่มีคอลัมน์ที่จำเป็น: ${missingColumns.join(', ')}`,
        ])
        return
      }

      const rows = result.data
        .map((row, index): EmployeeImportRawRow => {
          const sourceRow = index + 2

          return {
            sourceRow,
            employeeNo: row['รหัสพนักงาน'],
            prefix: row['คำนำหน้า'],
            fullName: row['ชื่อ-นามสกุล'],
            hireDate: row['วันที่เริ่มงาน'],
            plantName: row.Plant,
            jobLevel: row['ระดับงาน'],
            departmentName: row['ส่วนงาน'],
            divisionName: row['ฝ่าย'],
            functionName: row['สายงาน'],
            buName: row.BU,
            idCardNo: row['บัตรประชาชน'],
          }
        })
        .filter((row) =>
          [
            row.employeeNo,
            row.prefix,
            row.fullName,
            row.hireDate,
            row.plantName,
            row.jobLevel,
            row.departmentName,
            row.divisionName,
            row.functionName,
            row.buName,
            row.idCardNo,
          ].some((value) => value != null && String(value).trim().length > 0)
        )

      if (rows.length === 0) {
        setCsvRows([])
        setParseErrors(['ไม่พบข้อมูลพนักงานในไฟล์ CSV'])
        return
      }

      setCsvRows(rows)
      toast.success(`โหลดไฟล์สำเร็จ ${rows.length} รายการ`)
    } catch {
      setCsvRows([])
      setParseErrors(['อ่านไฟล์ CSV ไม่สำเร็จ'])
    } finally {
      setIsParsing(false)
    }
  }

  // เคลียร์ช่องว่างให้เป็น undefined ก่อนส่งไป backend
  function buildApiRows(rows: EmployeeImportRawRow[]): EmployeeImportRawRow[] {
    return rows.map((row) => ({
      ...row,
      idCardNo:
        row.idCardNo != null && String(row.idCardNo).trim() === ''
          ? undefined
          : row.idCardNo,
      hireDate:
        row.hireDate != null && String(row.hireDate).trim() === ''
          ? undefined
          : row.hireDate,
    }))
  }

  function handleDownloadTemplate() {
    triggerCsvDownload('เทมเพลตนำเข้าพนักงาน', [TEMPLATE_COLUMNS.join(',')])
  }

  function handleResetState() {
    clearFiles()
    setCsvRows([])
    setParseErrors([])
    setDryRunResult(null)
    setImportResult(null)
  }

  async function handleDryRun() {
    if (csvRows.length === 0) {
      toast.error('กรุณาเลือกไฟล์ CSV ก่อน')
      return
    }

    try {
      setIsDryRunning(true)
      setImportResult(null)
      const result = await dryRunImportEmployees({
        rows: buildApiRows(csvRows),
      })
      setDryRunResult(result)
      toast.success(
        `ตรวจสอบเสร็จสิ้น: ผ่าน ${result.summary.valid} / ไม่ผ่าน ${result.summary.invalid}`
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ตรวจสอบไฟล์ก่อนนำเข้าไม่สำเร็จ'
      )
    } finally {
      setIsDryRunning(false)
    }
  }

  async function handleImport() {
    if (!hasValidDryRunRows) {
      toast.error('กรุณา Dry-run ให้มีรายการที่พร้อมนำเข้าก่อน')
      return
    }

    await executeImport()
  }

  // อัปโหลดทันทีโดยไม่ต้อง dry-run ก่อน (backend จะคัดแถวที่ไม่ผ่านและข้ามให้เอง)
  async function handleQuickImport() {
    if (csvRows.length === 0) {
      toast.error('กรุณาเลือกไฟล์ CSV ก่อน')
      return
    }

    await executeImport()
  }

  // ดำเนินการนำเข้าข้อมูลจริง และแสดงผลเฉพาะฝั่ง import (ไม่ซ้อนกับผล dry-run)
  async function executeImport() {
    try {
      setIsImporting(true)
      setDryRunResult(null)
      setImportResult(null)
      const result = await importEmployees({ rows: buildApiRows(csvRows) })

      await queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] })

      const isFullySuccessful = result.summary.failed === 0

      if (isFullySuccessful) {
        // ถ้าสำเร็จทั้งหมด ให้รีเซ็ตทันทีเพื่อเริ่มรอบใหม่ และไม่ต้องแสดงกล่องผลนำเข้า
        setImportResult(null)
        clearFiles()
        setCsvRows([])
        setParseErrors([])
        setDryRunResult(null)
        onOpenChange(false)
      } else {
        // ถ้ามีรายการไม่สำเร็จ ให้แสดงผลนำเข้าเพื่อให้ผู้ใช้ตรวจข้อผิดพลาด
        setImportResult(result)
      }

      toast.success(
        `นำเข้าข้อมูลเสร็จสิ้น: สำเร็จ ${result.summary.imported} / ไม่สำเร็จ ${result.summary.failed}`
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'นำเข้าข้อมูลไม่สำเร็จ'
      )
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleResetState()
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="max-w-2xl gap-4 sm:max-w-2xl"
        onInteractOutside={(event) => {
          event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            อัปโหลดไฟล์ CSV
          </DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูลลงในตาราง
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'border-muted-foreground/30 hover:border-muted-foreground/50 relative rounded-xl border border-dashed p-6 text-center transition-colors',
            isDragging && 'border-primary bg-primary/5'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input {...getInputProps()} className="sr-only" />

          <div className="flex flex-col items-center gap-3">
            <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
              <UploadIcon />
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">ลากไฟล์ CSV มาวางที่นี่</p>
              <p className="text-muted-foreground text-sm">
                หรือกดปุ่มเพื่อเลือกไฟล์
              </p>
            </div>
            <Button type="button" variant="outline" onClick={openFileDialog}>
              <UploadIcon data-icon="inline-start" />
              เลือกไฟล์ CSV
            </Button>
          </div>
        </div>

        {selectedFile && (
          <div className="bg-muted/30 border-border flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
                <FileSpreadsheetIcon className="size-4" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatBytes(selectedFile.size)}
                </span>
              </span>
            </span>
            <Badge variant="outline">{csvRows.length} รายการ</Badge>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold">ต้องการไฟล์ตัวอย่าง?</p>
            <p className="text-muted-foreground text-xs">
              ดาวน์โหลดเทมเพลต CSV สำหรับนำเข้าข้อมูล
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
          >
            ดาวน์โหลดเทมเพลต
          </Button>
        </div>

        {errorMessages.length > 0 && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>เกิดข้อผิดพลาดกับไฟล์ CSV</AlertTitle>
            <AlertDescription>
              {errorMessages.map((error, index) => (
                <p key={`${error}-${index}`}>{error}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {dryRunResult && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">ผลตรวจสอบก่อนนำเข้า</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  ทั้งหมด: {dryRunResult.summary.total}
                </Badge>
                <Badge variant="outline">
                  ผ่าน: {dryRunResult.summary.valid}
                </Badge>
                <Badge variant="outline">
                  ไม่ผ่าน: {dryRunResult.summary.invalid}
                </Badge>
              </div>
            </div>

            {dryRunResult.summary.invalid > 0 && (
              <div className="bg-muted/30 max-h-40 overflow-y-auto rounded-md border p-2">
                <div className="flex flex-col gap-1.5">
                  {dryRunResult.rows
                    .filter((row) => !row.ok)
                    .map((row) => (
                      <div key={row.sourceRow} className="text-xs">
                        <span className="font-medium">
                          แถว {row.sourceRow}:
                        </span>{' '}
                        {row.errors.join(', ')}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {importResult && (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">ผลการนำเข้าข้อมูล</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  ทั้งหมด: {importResult.summary.total}
                </Badge>
                <Badge variant="outline">
                  สำเร็จ: {importResult.summary.imported}
                </Badge>
                <Badge variant="outline">
                  ไม่สำเร็จ: {importResult.summary.failed}
                </Badge>
              </div>
            </div>

            {importResult.summary.failed > 0 && (
              <div className="bg-muted/30 max-h-32 overflow-y-auto rounded-md border p-2">
                <div className="flex flex-col gap-1.5">
                  {importResult.rows
                    .filter((row) => !row.ok)
                    .map((row) => (
                      <div key={row.sourceRow} className="text-xs">
                        <span className="font-medium">
                          แถว {row.sourceRow}:
                        </span>{' '}
                        {row.error}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleQuickImport()}
            disabled={
              isImporting ||
              isDryRunning ||
              isParsing ||
              csvRows.length === 0 ||
              errorMessages.length > 0
            }
          >
            {isImporting && (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            )}
            อัปโหลดทันที
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDryRun()}
            disabled={
              isParsing ||
              isDryRunning ||
              isImporting ||
              csvRows.length === 0 ||
              errorMessages.length > 0
            }
          >
            {(isParsing || isDryRunning) && (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            )}
            ตรวจสอบก่อนนำเข้า
          </Button>
          <Button
            type="button"
            onClick={() => void handleImport()}
            disabled={
              isImporting ||
              isDryRunning ||
              !hasValidDryRunRows ||
              errorMessages.length > 0
            }
          >
            {isImporting && (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            )}
            นำเข้าและบันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
