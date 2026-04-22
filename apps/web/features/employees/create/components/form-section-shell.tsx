import type { ReactNode } from 'react'
import { Separator } from '@workspace/ui/components/separator'

type FormSectionShellProps = {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}

export function FormSectionShell({
  icon,
  title,
  description,
  children,
}: FormSectionShellProps) {
  return (
    <section className="bg-background rounded-lg border p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="bg-muted text-foreground mt-0.5 rounded-md p-2">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
      <Separator className="my-5" />
      {children}
    </section>
  )
}

