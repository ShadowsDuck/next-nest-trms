## Why

The summary report module currently owns two different kinds of complexity at once: source-specific snapshot assembly in `apps/api` and snapshot-to-analytics projection in `apps/web`. The service branches directly on source and knows implementation details of both the employee and course modules, while the analytics file mixes snapshot normalization with downstream calculations.

This makes the summary report seam shallow. Deleting the current module would mostly move the same complexity back into callers instead of concentrating it in one place. The goal of this refactor is to deepen the seam by separating source adapters from report projection while keeping the current employee and course report behavior unchanged.

## What

Refactor the summary report module so that:

- snapshot creation uses source-specific adapters behind a summary report seam
- analytics projection consumes a normalized report dataset instead of rebuilding participant and course projections inline
- current sources remain limited to `employees` and `courses`
- report payload shape, report page behavior, and generated analytics remain unchanged

## Constraints

- Must: keep the refactor limited to `employees` and `courses` summary report flows
- Must: preserve current report request/response shapes and analytics output
- Must: use simple adapter and projection modules, not a broad plugin system
- Must Not: add a new report source in this round
- Must Not: redesign the summary report page UI
- Must Not: change persistence shape for saved reports unless strictly required for no-behavior-change refactoring
- Out of Scope: new report source types, analytics redesign, chart redesign, or cross-report caching

## Execution Strategy

- Branch: `codex/architecture-seam-refactors`
- Commit Policy: `do` proposes one short commit message per task; actual commits happen in final integration
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: inventory current source branching and projection logic, extract adapters and normalized dataset helpers, and rewire the service/page to consume them
- Agent-doable: add focused regression coverage where extracted pure logic currently has no tests
- User-required: none

## Tasks

T1 — Define the minimal summary report seam split between source-specific snapshot assembly in `apps/api` and normalized projection in `apps/web` by inventorying the current employee and course flows · File: `apps/api/src/modules/summary-reports/summary-reports.service.ts`, `apps/api/src/modules/employees/employees.service.ts`, `apps/api/src/modules/courses/courses.service.ts`, `apps/web/features/summary-report/lib/report-analytics.ts` · Verify: the implementation plan keeps the scope limited to snapshot creation and analytics derivation for current sources only

T2 — Extract source-specific snapshot adapters for `employees` and `courses` so `SummaryReportsService` no longer owns direct branching over source implementation details · File: `apps/api/src/modules/summary-reports/summary-reports.service.ts`, plus new or updated source-specific files under `apps/api/src/modules/summary-reports/` if needed · Verify: `pnpm --filter api typecheck` passes and source branching is delegated behind a summary report seam

T3 — Extract a normalized report projection module that converts `SummaryReportSnapshot` into a stable intermediate dataset reused by analytics builders instead of repeating participant and course projection logic inline · File: `apps/web/features/summary-report/lib/report-analytics.ts` plus any new adjacent projection file under `apps/web/features/summary-report/lib/` if needed · Verify: `pnpm --filter web typecheck` passes and repeated snapshot normalization logic is removed from analytics callers

T4 — Rewire summary report analytics and any directly affected call sites to consume the new adapters and projection seam without changing output shape or page behavior · File: `apps/web/features/summary-report/components/summary-report-page.tsx`, `apps/web/features/summary-report/lib/report-analytics.ts`, and directly affected summary report files · Verify: diffs outside the extracted seam are limited to adoption and preserve the current report page flow

T5 — Add focused regression coverage for source adapter behavior and normalized projection helpers, then run final verification · File: tests adjacent to summary report modules or existing test locations · Verify: `pnpm --filter api typecheck`, `pnpm --filter web typecheck`, `pnpm --filter web lint`, and the added summary report tests pass with no behavioral change
