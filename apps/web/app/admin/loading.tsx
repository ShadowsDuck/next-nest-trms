import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex min-h-0 w-full flex-1 items-center justify-center rounded-lg shadow-sm">
      <div className="text-muted-foreground flex flex-col items-center gap-2">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  )
}
