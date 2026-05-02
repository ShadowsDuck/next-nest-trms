'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { SummaryReportResponse } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  type ChartConfig,
  ChartContainer,
  RechartsPrimitive,
  ChartTooltip,
  ChartTooltipContent,
} from '@workspace/ui/components/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import {
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  PieChart as PieChartIcon,
  RefreshCcw,
  Users,
  Upload,
} from 'lucide-react'
import { deleteSummaryReport } from '@/domains/summary-reports/actions'
import {
  buildPeopleProfileRows,
  buildSummaryReportAnalytics,
} from '@/features/summary-report/lib/report-analytics'
import { SummaryEmptyState } from './empty-state'

const chartConfig = {
  count: {
    label: 'จำนวน',
    color: 'var(--chart-1)',
  },
  expense: {
    label: 'ค่าใช้จ่าย',
    color: 'var(--chart-2)',
  },
  participants: {
    label: 'ผู้เข้าอบรม',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const pieColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

const genderColorMap: Record<string, string> = {
  ชาย: 'oklch(0.62 0.16 255)',
  หญิง: 'oklch(0.86 0.07 250)',
  ไม่ระบุ: 'var(--chart-4)',
}

const courseTypeColorMap: Record<string, string> = {
  ภายใน: 'oklch(0.62 0.16 255)',
  ภายนอก: 'oklch(0.86 0.07 250)',
  ไม่ระบุ: 'var(--chart-4)',
}

function getFallbackPieColor(index: number) {
  return pieColors[index % pieColors.length] ?? 'var(--muted-foreground)'
}

function formatNumber(value: number) {
  return value.toLocaleString('th-TH')
}

function formatCurrency(value: number) {
  return `${value.toLocaleString('th-TH', {
    maximumFractionDigits: 0,
  })} บาท`
}

function MiniLegend({
  items,
  getColor,
  className,
}: {
  items: Array<{ label: string; count: number }>
  getColor?: (label: string, index: number) => string
  className?: string
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className={`mt-5 flex flex-wrap gap-2 ${className ?? ''}`}>
      {items.map((item, index) => (
        <div
          key={item.label}
          className="inline-flex items-center gap-2 px-1 py-1 text-[13px]"
        >
          <span
            className="size-2.5 rounded-full"
            style={{
              backgroundColor:
                getColor?.(item.label, index) ?? getFallbackPieColor(index),
            }}
          />
          <span className="text-foreground min-w-14 font-medium">
            {item.label}
          </span>
          <span className="text-foreground min-w-9 text-right">
            {formatNumber(item.count)}
          </span>
          <span className="text-muted-foreground min-w-12 text-right">
            (
            {total > 0
              ? ((item.count / total) * 100).toLocaleString('th-TH', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : '0.0'}
            %)
          </span>
        </div>
      ))}
    </div>
  )
}

function BreakdownTable({
  rows,
  countLabel = 'จำนวน',
  showExpense = false,
  showPerPerson = false,
  categoryLabel,
}: {
  rows: Array<{
    label: string
    count: number
    share: number
    expense?: number
    participants?: number
    expensePerPerson?: number
    category?: string
  }>
  countLabel?: string
  showExpense?: boolean
  showPerPerson?: boolean
  categoryLabel?: string
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>หัวข้อ</TableHead>
          {categoryLabel ? <TableHead>{categoryLabel}</TableHead> : null}
          <TableHead className="text-right">{countLabel}</TableHead>
          <TableHead className="text-right">สัดส่วน</TableHead>
          {showExpense ? (
            <TableHead className="text-right">ค่าใช้จ่าย</TableHead>
          ) : null}
          {showPerPerson ? (
            <TableHead className="text-right">ผู้เข้าอบรม</TableHead>
          ) : null}
          {showPerPerson ? (
            <TableHead className="text-right">เฉลี่ย/คน</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="font-medium">{row.label}</TableCell>
            {categoryLabel ? (
              <TableCell>{row.category ?? 'ไม่ระบุ'}</TableCell>
            ) : null}
            <TableCell className="text-right">
              {formatNumber(row.count)}
            </TableCell>
            <TableCell className="text-right">
              {row.share.toFixed(1)}%
            </TableCell>
            {showExpense ? (
              <TableCell className="text-right">
                {typeof row.expense === 'number'
                  ? formatCurrency(row.expense)
                  : '-'}
              </TableCell>
            ) : null}
            {showPerPerson ? (
              <TableCell className="text-right">
                {typeof row.participants === 'number'
                  ? formatNumber(row.participants)
                  : '-'}
              </TableCell>
            ) : null}
            {showPerPerson ? (
              <TableCell className="text-right">
                {typeof row.expensePerPerson === 'number'
                  ? formatCurrency(row.expensePerPerson)
                  : '-'}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const kpiIconMap = [Users, BriefcaseBusiness, PieChartIcon, CircleDollarSign]
const { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } =
  RechartsPrimitive

export function SummaryReportPage({
  initialReport,
}: {
  initialReport: SummaryReportResponse | null
}) {
  const router = useRouter()
  const [report, setReport] = useState(initialReport)
  const [isDeleting, setIsDeleting] = useState(false)
  const context = report?.reportSnapshot ?? null

  const analytics = useMemo(
    () => (context ? buildSummaryReportAnalytics(context) : null),
    [context]
  )
  const peopleProfileRows = useMemo(
    () => (context ? buildPeopleProfileRows(context) : []),
    [context]
  )

  if (!context || !analytics) {
    return <SummaryEmptyState />
  }
  const genderTotal = analytics.genderBreakdown.reduce(
    (sum, item) => sum + item.count,
    0
  )
  const courseTypeTotal = analytics.courseTypeBreakdown.reduce(
    (sum, item) => sum + item.count,
    0
  )

  return (
    <div className="flex flex-1 flex-col gap-3">
      <header className="bg-background px-1 py-2.5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div>
              <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                {analytics.title}
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                {analytics.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:mt-2.5">
            <Button
              onClick={async () => {
                if (!report) return

                try {
                  setIsDeleting(true)
                  await deleteSummaryReport(report.id)
                  setReport(null)
                  router.replace('/admin/reports/summary')
                  router.refresh()
                } finally {
                  setIsDeleting(false)
                }
              }}
              disabled={isDeleting}
              variant="outline"
            >
              <RefreshCcw data-icon="inline-start" className="mr-1 size-4" />
              {isDeleting ? 'กำลังล้างข้อมูลรายงาน...' : 'ล้างข้อมูลรายงาน'}
            </Button>
            <Button>
              <Upload data-icon="inline-start" className="mr-1 size-4" />
              ส่งออกรายงาน
            </Button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {analytics.kpis.map((item, index) => {
          const Icon = kpiIconMap[index] ?? BarChart3

          return (
            <Card
              key={item.label}
              className="bg-background gap-2 rounded-2xl shadow-none"
            >
              <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-2 pb-1">
                <div>
                  <CardDescription className="text-xs">
                    {item.label}
                  </CardDescription>
                  <CardTitle className="mt-1 text-2xl font-semibold">
                    {item.label === 'ค่าใช้จ่ายรวม'
                      ? formatCurrency(item.value)
                      : formatNumber(item.value)}
                  </CardTitle>
                </div>
                <div className="bg-muted text-muted-foreground rounded-xl p-2">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground pt-0 text-xs leading-4">
                {item.helperText}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        <Card className="bg-background gap-4 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>หน่วยงานที่ได้รับการฝึกอบรม</CardTitle>
            <CardDescription>
              แสดงฝ่ายที่มีผู้เข้าอบรมมากที่สุดในชุดข้อมูลนี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={analytics.topDivisionBreakdown}
                margin={{ left: 8, right: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={64}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-background gap-10 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>สัดส่วนผู้เข้าอบรมตามเพศ</CardTitle>
            <CardDescription>
              สรุปจากเพศของพนักงานที่อยู่ในรายงานนี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto flex w-full max-w-[520px] items-center justify-center gap-8">
              <ChartContainer
                config={chartConfig}
                className="relative h-[210px] w-[230px] shrink-0 sm:h-[230px] sm:w-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    wrapperStyle={{ zIndex: 40 }}
                    content={
                      <ChartTooltipContent
                        nameKey="label"
                        formatter={(value) => formatNumber(Number(value))}
                      />
                    }
                  />
                  <Pie
                    data={analytics.genderBreakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={70}
                    outerRadius={104}
                    paddingAngle={4}
                  >
                    {analytics.genderBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={
                          genderColorMap[entry.label] ??
                          getFallbackPieColor(index)
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-foreground text-3xl leading-none font-semibold">
                      {formatNumber(genderTotal)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      ผู้เข้าอบรม
                    </div>
                  </div>
                </div>
              </ChartContainer>
              <div className="min-w-fit">
                <MiniLegend
                  items={analytics.genderBreakdown}
                  className="mt-0 flex-col gap-1"
                  getColor={(label, index) =>
                    genderColorMap[label] ?? getFallbackPieColor(index)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background gap-4 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>ระดับงานของผู้เข้าอบรม</CardTitle>
            <CardDescription>
              ช่วยดูว่าสัดส่วนกลุ่มเป้าหมายกระจายอยู่ที่ระดับใด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={analytics.jobLevelBreakdown}
                margin={{ left: 8, right: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-participants)"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-background gap-10 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>ประเภทหลักสูตร</CardTitle>
            <CardDescription>
              ดูสัดส่วนการเข้าอบรมแยกตามประเภทหลักสูตร
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto flex w-full max-w-[520px] items-center justify-center gap-8">
              <ChartContainer
                config={chartConfig}
                className="relative h-[210px] w-[230px] shrink-0 sm:h-[230px] sm:w-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    wrapperStyle={{ zIndex: 40 }}
                    content={
                      <ChartTooltipContent
                        nameKey="label"
                        formatter={(value) => formatNumber(Number(value))}
                      />
                    }
                  />
                  <Pie
                    data={analytics.courseTypeBreakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={64}
                    outerRadius={98}
                    paddingAngle={4}
                  >
                    {analytics.courseTypeBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={
                          courseTypeColorMap[entry.label] ??
                          getFallbackPieColor(index)
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-foreground text-3xl leading-none font-semibold">
                      {formatNumber(courseTypeTotal)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      หลักสูตร
                    </div>
                  </div>
                </div>
              </ChartContainer>
              <div className="min-w-fit">
                <MiniLegend
                  items={analytics.courseTypeBreakdown}
                  className="mt-0 flex-col gap-1"
                  getColor={(label, index) =>
                    courseTypeColorMap[label] ?? getFallbackPieColor(index)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
        <Card className="bg-background gap-4 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>อายุงานของผู้เข้าอบรม</CardTitle>
            <CardDescription>
              แบ่งกลุ่มตามระยะเวลาการทำงานจากวันที่เริ่มงาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownTable rows={peopleProfileRows} countLabel="จำนวนคน" />
          </CardContent>
        </Card>

        <Card className="bg-background gap-4 rounded-2xl shadow-none">
          <CardHeader>
            <CardTitle>หมวดหมู่หลักสูตรที่ถูกเลือกมากที่สุด</CardTitle>
            <CardDescription>
              เรียงจากจำนวนการเข้าอบรมสูงสุดแยกตามหมวดหมู่
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownTable
              rows={analytics.topCourseBreakdown}
              countLabel="ครั้ง"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
