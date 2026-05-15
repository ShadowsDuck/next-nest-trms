# Spec: Dependency Cleanup

## Why
Remove unused and redundant dependencies identified by the `fallow` analysis tool. This reduces the security attack surface, decreases `node_modules` size, and simplifies dependency management.

## What
Uninstall specific unused dependencies from `apps/web` and `apps/api` packages.

## How it works
1. Remove `jose` and `@workspace/database` from `apps/web/package.json` as they are not used in the web codebase.
2. Remove `cmdk`, `radix-ui`, and `vaul` from `apps/web/package.json` because they are already managed and provided by `@workspace/ui`.
3. Remove `@nestjs/mapped-types` from `apps/api/package.json` as it is not used in the API codebase.
4. Run `pnpm install` to update the lockfile.
5. Verify project health.

## Constraints
- Must: Surgical edits to `package.json` files only.
- Must Not: Remove `@workspace/schemas`.
- Must Not: Modify any source code or component structure.

## Execution Strategy
- Branch: `codex/dependency-cleanup`
- Commit Policy: One commit for each package's dependency removal.
- Merge Policy: Run `ship` after all tasks are done.

## Prerequisites
- Agent-doable: All tasks.
- User-required: None.

## Tasks

T1 — Remove unused dependencies from web · File: `apps/web/package.json` · Verify: Run `grep` for each removed package to ensure no imports remain.
T2 — Remove unused dependencies from api · File: `apps/api/package.json` · Verify: Run `grep` to ensure no imports remain.
T3 — Sync lockfile · File: `pnpm-lock.yaml` · Verify: Run `pnpm install`.
T4 — Final health check · File: N/A · Verify: Run `pnpm analyze:health` and ensure it passes (or shows fewer issues).
