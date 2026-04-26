import type { ReactNode } from 'react'

type FormSectionShellProps = {
  step: number
  title: string
  description: string
  children: ReactNode
}

export function FormSectionShell({
  step,
  title,
  description,
  children,
}: FormSectionShellProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:px-6">
      <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
            {step}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}
