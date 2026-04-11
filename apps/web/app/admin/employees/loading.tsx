import { Loader2 } from 'lucide-react'

export default function CoursesLoading() {
  return (
    <div className="w-full flex-1 min-h-0 shadow-sm rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  )
}
