import Link from 'next/link'
import { Button } from '@workspace/ui/components/button'
import { Card } from '@workspace/ui/components/card'
import { BarChart3 } from 'lucide-react'

export function SummaryEmptyState() {
  return (
    <div className="flex min-h-[75svh] items-center justify-center px-4">
      <div className="from-background via-background to-muted/35 border-border/70 w-full max-w-3xl overflow-hidden rounded-4xl border bg-linear-to-br shadow-sm">
        <div className="from-primary/10 via-chart-2/10 to-chart-3/10 border-border/60 border-b bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-from),transparent_45%),linear-gradient(135deg,var(--tw-gradient-via),var(--tw-gradient-to))] px-8 py-8">
          <div className="bg-background/90 text-primary ring-border/60 inline-flex size-12 items-center justify-center rounded-2xl shadow-xs ring-1">
            <BarChart3 className="size-5" />
          </div>
          <h1 className="text-foreground mt-5 text-3xl font-semibold tracking-tight">
            ยังไม่มีรายงานให้แสดง
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-6">
            เลือกรายการจากหน้าพนักงานหรือหลักสูตรก่อน แล้วกดปุ่ม
            `ไปที่รายงานสรุป` เพื่อสร้างมุมมองสรุปจากข้อมูลที่เลือกไว้
          </p>
        </div>

        <div className="grid gap-4 px-8 py-8 md:grid-cols-2">
          <Card className="bg-muted/25 ring-border/60 p-5">
            <div>
              <div className="text-foreground text-sm font-medium">
                เริ่มจากข้อมูลพนักงาน
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                เหมาะเมื่ออยากดูภาพรวมการฝึกอบรมของคนที่เลือกไว้ เช่น หน่วยงาน
                ระดับงาน และค่าใช้จ่ายที่เกี่ยวข้อง
              </p>
            </div>
            <Button className="mt-auto w-full" asChild>
              <Link href="/admin/employees">ไปหน้าพนักงาน</Link>
            </Button>
          </Card>

          <Card className="bg-muted/25 ring-border/60 p-5">
            <div>
              <div className="text-foreground text-sm font-medium">
                เริ่มจากข้อมูลหลักสูตร
              </div>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                เหมาะเมื่ออยากดูผลลัพธ์ของหลักสูตรที่เลือก เช่น จำนวนผู้เข้าอบรม
                ประเภทหลักสูตร และสัดส่วนผู้เข้าร่วม
              </p>
            </div>
            <Button className="mt-auto w-full" asChild>
              <Link href="/admin/courses">ไปหน้าหลักสูตร</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
