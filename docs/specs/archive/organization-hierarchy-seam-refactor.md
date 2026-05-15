## Why

The organization hierarchy rules for `Plant -> Business Unit -> Function -> Division -> Department` are currently split across the employee create flow in `apps/web`, the option-loading hook, and backend validation in `apps/api`. That makes the `organization-units` module shallow: callers still need to know too much about the hierarchy instead of depending on a single seam.

This refactor deepens the organization hierarchy seam without changing behavior. The goal is to make one module own hierarchy validation and lookup rules so the employee create flow becomes a consumer of that interface rather than a second implementation of the same logic.

## What

Refactor the organization hierarchy seam for the employee create flow so that:

- backend hierarchy validation is owned by the `organization-units` module
- employee creation depends on that seam instead of implementing chain validation inline
- the web employee create flow consumes a simpler feature-facing hierarchy interface for cascading options
- existing option-loading behavior, request shape, and validation messages remain unchanged

## Constraints

- Must: keep the refactor limited to employee create flow and backend hierarchy validation
- Must: preserve the current `Plant -> Business Unit -> Function -> Division -> Department` behavior and validation outcomes
- Must: keep existing API request and response shapes unchanged
- Must: use simple module extraction and delegation, not a new generic framework
- Must Not: refactor CRUD resource behavior for `organization-units`
- Must Not: redesign the employee create UI
- Must Not: change the hierarchy labels or user-facing workflow
- Out of Scope: admin management screens for organization units, new hierarchy levels, or broader employee form redesign

## Execution Strategy

- Branch: `codex/architecture-seam-refactors`
- Commit Policy: `do` proposes one short commit message per task; actual commits happen in final integration
- Merge Policy: run `ship` only when all tasks are done and committed

## Prerequisites

- Agent-doable: inspect the current hierarchy flow across web and api, extract the minimal seam, and update the employee create flow to use it
- Agent-doable: add focused coverage for hierarchy validation and cascading option behavior where current tests are missing
- User-required: none

## Tasks

T1 — Define the minimal hierarchy seam for the employee create flow by inventorying where hierarchy knowledge currently lives across the employee create hook, web org-unit domain, and backend employee validation · File: `apps/web/features/employees/create/hooks/use-organization-unit-options.ts`, `apps/web/domains/org-units/**`, `apps/api/src/modules/employees/employees.service.ts`, `apps/api/src/modules/organization-units/organization-units.service.ts` · Verify: the implementation plan isolates hierarchy validation and cascading lookup responsibilities without expanding into org-unit CRUD work

T2 — Extract backend hierarchy validation into the `organization-units` module so employee creation delegates chain validation through a single seam · File: `apps/api/src/modules/organization-units/organization-units.service.ts`, `apps/api/src/modules/employees/employees.service.ts`, plus any new hierarchy-focused support file under `apps/api/src/modules/organization-units/` if needed · Verify: `pnpm --filter api typecheck` passes and `employees.service.ts` no longer owns the hierarchy chain algorithm directly

T3 — Introduce a feature-facing organization hierarchy lookup interface in the web domain so the employee create hook no longer coordinates the hierarchy rules inline · File: `apps/web/domains/org-units/**`, `apps/web/features/employees/create/hooks/use-organization-unit-options.ts` · Verify: `pnpm --filter web typecheck` passes and the employee create hook consumes a domain seam rather than duplicating hierarchy reset and lookup responsibilities

T4 — Apply only the minimal employee create call-site updates needed to adopt the deepened hierarchy seam without changing form behavior or field structure · File: `apps/web/features/employees/create/components/organization-unit-section.tsx`, `apps/web/features/employees/create/components/create-employee-page.tsx`, and any directly affected employee create files · Verify: diffs in component files are limited to seam adoption and preserve the existing field flow and messages

T5 — Add focused regression coverage for backend hierarchy validation and any extracted web hierarchy logic, then run final verification · File: tests adjacent to the extracted hierarchy seam or existing module test locations · Verify: `pnpm --filter api typecheck`, `pnpm --filter web typecheck`, `pnpm --filter web lint`, and the added hierarchy tests pass with no behavioral change
