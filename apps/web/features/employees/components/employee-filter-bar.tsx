'use client'

import { employeeStatus, jobLevel, prefix } from '@workspace/schemas'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { MultiSelect } from '@workspace/ui/components/multi-select'
import { Search, X } from 'lucide-react'
import { useEmployeeFilters } from '../hooks/useEmployeeFilters'

export function EmployeeFilterBar() {
  const { params, setFilter } = useEmployeeFilters()

  const hasActiveFilters =
    params.search ||
    params.status.length > 0 ||
    params.prefix.length > 0 ||
    params.jobLevel.length > 0

  function clearAll() {
    setFilter({ search: '', status: [], prefix: [], jobLevel: [] })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-9 w-56 text-sm"
          placeholder="ค้นหารหัส, ชื่อ, เลขบัตร..."
          value={params.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
      </div>

      {/* Prefix */}
      <MultiSelect
        label="คำนำหน้า"
        options={prefix}
        value={params.prefix}
        onChange={(value) => setFilter({ prefix: value })}
      />

      {/* Job level */}
      <MultiSelect
        label="ระดับงาน"
        options={jobLevel}
        value={params.jobLevel}
        onChange={(value) => setFilter({ jobLevel: value })}
      />

      {/* Status */}
      <MultiSelect
        label="สถานะ"
        options={employeeStatus}
        value={params.status}
        onChange={(value) => setFilter({ status: value })}
      />

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          onClick={clearAll}
        >
          <X className="h-3.5 w-3.5" />
          ล้างตัวกรอง
        </Button>
      )}
    </div>
  )
}
