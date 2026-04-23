'use client'

import Link from 'next/link'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { EllipsisVertical, Eye, SquarePen, Trash } from 'lucide-react'

export interface DataTableRowActionsProps {
  /** ลิงก์สำหรับไปหน้าดูรายละเอียด */
  viewHref?: string
  /** ลิงก์สำหรับไปหน้าแก้ไขข้อมูล */
  editHref?: string
  /** ฟังก์ชันที่จะถูกเรียกเมื่อกดลบข้อมูล */
  onDelete?: () => void
}

/**
 * คอมโพเนนต์กลางสำหรับแสดงเมนู Actions (ดูรายละเอียด, แก้ไข, ลบ) ในแต่ละแถวของตาราง
 */
export function DataTableRowActions({
  viewHref,
  editHref,
  onDelete,
}: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-input/40 aria-expanded:bg-input/40 size-7 focus-visible:border-transparent focus-visible:ring-0"
        >
          <EllipsisVertical className="size-4" />
          <span className="sr-only">เปิดเมนู</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {viewHref && (
          <DropdownMenuItem asChild>
            <Link href={viewHref}>
              <Eye className="mr-2 size-4" />
              ดูรายละเอียด
            </Link>
          </DropdownMenuItem>
        )}

        {editHref && (
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <SquarePen className="mr-2 size-4" />
              แก้ไข
            </Link>
          </DropdownMenuItem>
        )}

        {onDelete && (
          <>
            {(viewHref || editHref) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={onDelete} variant="destructive">
              <Trash className="mr-2 size-4" />
              ลบ
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
