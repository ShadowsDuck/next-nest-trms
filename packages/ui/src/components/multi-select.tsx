"use client"

import { Check, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MultiSelectProps<T extends string> {
  /** Label shown in the trigger button */
  label: string
  /** List of options to display */
  options: readonly T[]
  /** Currently selected values */
  value: T[]
  /** Callback when selection changes */
  onChange: (value: T[]) => void
  /** Placeholder for search input. Defaults to "ค้นหา..." */
  searchPlaceholder?: string
  /** Message when no options match search. Defaults to "ไม่พบผลลัพธ์" */
  emptyMessage?: string
  /** Disable the component */
  disabled?: boolean
  /** Additional className for the trigger button */
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  searchPlaceholder = "ค้นหา...",
  emptyMessage = "ไม่พบผลลัพธ์",
  disabled = false,
  className,
}: MultiSelectProps<T>) {
  function toggle(option: T) {
    onChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : [...value, option]
    )
  }

  const hasValue = value.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("h-9 gap-1.5 text-sm font-normal", className)}
        >
          <span className="text-muted-foreground">{label}</span>
          {hasValue && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs leading-none text-primary-foreground">
              {value.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option)
                return (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => toggle(option)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    {option}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
