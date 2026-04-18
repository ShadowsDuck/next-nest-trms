'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { SummaryReportResponse } from '@workspace/schemas'
import { Badge } from '@workspace/ui/components/badge'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs'
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  PieChart as PieChartIcon,
  RefreshCcw,
  Sparkles,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  buildPeopleProfileRows,
  buildSummaryReportAnalytics,
} from '@/features/summary-report/lib/report-analytics'
import { deleteSummaryReport } from '../actions'
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
  ชาย: 'var(--chart-1)',
  หญิง: 'var(--chart-2)',
  ไม่ระบุ: 'var(--chart-4)',
}

const courseTypeColorMap: Record<string, string> = {
  ภายใน: 'var(--chart-1)',
  ภายนอก: 'var(--chart-2)',
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
}: {
  items: Array<{ label: string; count: number }>
  getColor?: (label: string, index: number) => string
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <div
          key={item.label}
          className="border-border/60 bg-background/80 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-xs"
        >
          <span
            className="size-2.5 rounded-full"
            style={{
              backgroundColor:
                getColor?.(item.label, index) ?? getFallbackPieColor(index),
            }}
          />
          <span className="text-foreground font-medium">{item.label}</span>
          <span className="text-muted-foreground">
            {formatNumber(item.count)}
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
  categoryLabel,
}: {
  rows: Array<{
    label: string
    count: number
    share: number
    expense?: number
    category?: string
  }>
  countLabel?: string
  showExpense?: boolean
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const kpiIconMap = [Users, BriefcaseBusiness, PieChartIcon, CircleDollarSign]

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

  const originHref =
    context.source === 'employees' ? '/admin/employees' : '/admin/courses'
  const originLabel =
    context.source === 'employees' ? 'กลับไปหน้าพนักงาน' : 'กลับไปหน้าหลักสูตร'

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="border-border/70 from-primary/8 via-chart-2/6 to-chart-3/10 relative overflow-hidden rounded-4xl border bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-from),transparent_34%),linear-gradient(135deg,var(--tw-gradient-via),var(--tw-gradient-to))] px-6 py-7 shadow-sm">
        <div className="absolute inset-y-0 right-0 hidden w-80 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.12),transparent_60%)] lg:block" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {analytics.sourceLabel}
              </Badge>
              <Badge variant="outline" className="bg-background/70">
                สร้างเมื่อ {analytics.generatedAtLabel}
              </Badge>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-background/85 text-primary ring-border/60 hidden rounded-2xl p-3 shadow-xs ring-1 md:flex">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                  {analytics.title}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
                  {analytics.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={originHref}>
                <ArrowLeft data-icon="inline-start" />
                {originLabel}
              </Link>
            </Button>
            <Button
              variant="outline"
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
            >
              <RefreshCcw data-icon="inline-start" />
              {isDeleting ? 'กำลังล้างข้อมูลรายงาน...' : 'ล้างข้อมูลรายงาน'}
            </Button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.kpis.map((item, index) => {
          const Icon = kpiIconMap[index] ?? BarChart3

          return (
            <Card
              key={item.label}
              className="from-background to-muted/30 border-border/70 gap-4 bg-linear-to-br"
            >
              <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
                <div>
                  <CardDescription>{item.label}</CardDescription>
                  <CardTitle className="mt-2 text-3xl font-semibold">
                    {item.label === 'ค่าใช้จ่ายรวม'
                      ? formatCurrency(item.value)
                      : formatNumber(item.value)}
                  </CardTitle>
                </div>
                <div className="bg-primary/10 text-primary rounded-2xl p-2.5">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs leading-5">
                {item.helperText}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-border/70 gap-4">
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

        <Card className="border-border/70 gap-4">
          <CardHeader>
            <CardTitle>สัดส่วนผู้เข้าอบรมตามเพศ</CardTitle>
            <CardDescription>
              สรุปจากเพศของพนักงานที่อยู่ในรายงานนี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
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
            </ChartContainer>
            <MiniLegend
              items={analytics.genderBreakdown}
              getColor={(label, index) =>
                genderColorMap[label] ?? getFallbackPieColor(index)
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 gap-4">
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

        <Card className="border-border/70 gap-4">
          <CardHeader>
            <CardTitle>ประเภทหลักสูตร</CardTitle>
            <CardDescription>
              ดูสัดส่วนการเข้าอบรมแยกตามประเภทหลักสูตร
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
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
            </ChartContainer>
            <MiniLegend
              items={analytics.courseTypeBreakdown}
              getColor={(label, index) =>
                courseTypeColorMap[label] ?? getFallbackPieColor(index)
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-border/70 gap-4">
          <CardHeader>
            <CardTitle>โครงสร้างองค์กร</CardTitle>
            <CardDescription>
              สรุปจำนวนผู้เข้าอบรมแยกตามแต่ละระดับของหน่วยงาน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="division" className="gap-4">
              <TabsList
                variant="line"
                className="w-full justify-start overflow-x-auto"
              >
                <TabsTrigger value="plant">Plant</TabsTrigger>
                <TabsTrigger value="businessUnit">BU</TabsTrigger>
                <TabsTrigger value="function">สายงาน</TabsTrigger>
                <TabsTrigger value="division">ฝ่าย</TabsTrigger>
                <TabsTrigger value="department">ส่วนงาน</TabsTrigger>
              </TabsList>

              <TabsContent value="plant">
                <BreakdownTable
                  rows={analytics.orgBreakdowns.plant}
                  countLabel="จำนวนคน"
                />
              </TabsContent>
              <TabsContent value="businessUnit">
                <BreakdownTable
                  rows={analytics.orgBreakdowns.businessUnit}
                  countLabel="จำนวนคน"
                />
              </TabsContent>
              <TabsContent value="function">
                <BreakdownTable
                  rows={analytics.orgBreakdowns.function}
                  countLabel="จำนวนคน"
                />
              </TabsContent>
              <TabsContent value="division">
                <BreakdownTable
                  rows={analytics.orgBreakdowns.division}
                  countLabel="จำนวนคน"
                />
              </TabsContent>
              <TabsContent value="department">
                <BreakdownTable
                  rows={analytics.orgBreakdowns.department}
                  countLabel="จำนวนคน"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/70 gap-4">
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

          <Card className="border-border/70 gap-4">
            <CardHeader>
              <CardTitle>หลักสูตรที่ถูกเลือกมากที่สุด</CardTitle>
              <CardDescription>
                เรียงจากจำนวนการเข้าอบรมสูงสุดในรายงานชุดนี้
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BreakdownTable
                rows={analytics.topCourseBreakdown}
                countLabel="ครั้ง"
                categoryLabel="หมวดหมู่"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-border/70 gap-4">
          <CardHeader>
            <CardTitle>ค่าใช้จ่ายฝึกอบรม</CardTitle>
            <CardDescription>
              รวมค่าใช้จ่ายแบบหลักสูตรไม่ซ้ำภายในชุดข้อมูลรายงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="from-background to-muted/30 border-border/60 rounded-2xl border bg-linear-to-br p-4">
              <div className="text-muted-foreground text-xs tracking-wide uppercase">
                ค่าใช้จ่ายรวม
              </div>
              <div className="text-foreground mt-2 text-2xl font-semibold">
                {formatCurrency(analytics.totalExpense)}
              </div>
            </div>
            <BreakdownTable
              rows={analytics.expenseBreakdown}
              countLabel="จำนวนหลักสูตร"
              showExpense
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 gap-4">
          <CardHeader>
            <CardTitle>ที่มาของรายงาน</CardTitle>
            <CardDescription>
              ใช้สำหรับตรวจสอบว่ารายงานนี้สร้างจากข้อมูลชุดใด
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="border-border/60 from-background to-muted/25 rounded-2xl border bg-linear-to-br p-4">
              <div className="text-muted-foreground text-xs tracking-wide uppercase">
                แหล่งข้อมูล
              </div>
              <div className="text-foreground mt-1 font-medium">
                {analytics.sourceLabel}
              </div>
            </div>
            <div className="border-border/60 from-background to-muted/25 rounded-2xl border bg-linear-to-br p-4">
              <div className="text-muted-foreground text-xs tracking-wide uppercase">
                รายการที่เลือก
              </div>
              <div className="text-foreground mt-1 font-medium">
                {formatNumber(context.selectedIds.length)} รายการ
              </div>
            </div>
            <div className="border-border/60 from-background to-muted/25 rounded-2xl border bg-linear-to-br p-4">
              <div className="text-muted-foreground text-xs tracking-wide uppercase">
                เวลาที่สร้างรายงาน
              </div>
              <div className="text-foreground mt-1 font-medium">
                {analytics.generatedAtLabel}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
