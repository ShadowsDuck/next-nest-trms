---
name: git-commit-writer
description: Generate concise conventional commit messages by analyzing git diff. Use when the user asks to write a commit message, create a commit, generate commit text, or needs help with git commit format. Also trigger when user mentions "commit", "git message", or shows staged changes needing a commit message.
---

# Git Commit Writer

Automatically generate concise, conventional commit messages by analyzing staged changes with `git diff`.

## When to Use

Trigger this skill when the user:

- Asks to "write a commit message"
- Says "commit this" or "create a commit"
- Mentions "git commit" or "commit message"
- Shows staged changes and asks what to commit
- Wants help writing conventional commits

## Workflow

### Step 1: Check Git Status

```bash
git status
```

Verify there are staged changes. If nothing is staged, inform the user and stop.

### Step 2: Analyze Changes

```bash
git diff --cached
```

Review the diff output to understand:

- Which files changed
- What kind of changes (new features, fixes, refactoring, etc.)
- Scope of changes (which module/component)

### Step 3: Generate Commit Message

Follow the **Conventional Commits** format:

```
<type>(<scope>): <subject>
```

**Rules:**

- Keep it **SHORT** (ideally under 72 characters)
- Use lowercase for type and scope
- Subject starts with lowercase verb
- No period at the end
- Be specific but concise

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `chore`: Maintenance tasks (deps, config, cleanup)
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons (no code change)
- `test`: Adding or fixing tests
- `perf`: Performance improvements
- `build`: Build system changes
- `ci`: CI/CD changes

**Scope Examples:**

- Module name: `api`, `web`, `database`
- Component: `auth`, `users`, `tags`
- Area: `deps`, `config`, `types`

### Step 4: Present Message

Show the generated commit message to the user in a code block:

```
feat(api): add user authentication middleware
```

If the changes are complex or span multiple logical changes, suggest splitting into multiple commits.

## Examples

### Example 1: New Feature

**Diff summary:** Added Prisma singleton and Hono auth middleware

**Output:**

```
feat(api): setup prisma db singleton and hono auth middleware
```

### Example 2: Refactoring

**Diff summary:** Converted health, users, tags routes from NestJS to Hono

**Output:**

```
feat(api): refactor health, users, and tags to hono routers
```

### Example 3: Cleanup

**Diff summary:** Removed NestJS decorators, controllers, modules

**Output:**

```
chore(api): remove remaining nestjs artifacts
```

### Example 4: Bug Fix

**Diff summary:** Fixed TypeScript errors and ESLint warnings

**Output:**

```
fix(api): resolve all lint warnings and type errors
```

### Example 5: Code Quality

**Diff summary:** Used Zod type inference, removed duplicate code

**Output:**

```
refactor(api): use zod inference for service payloads and clean up redundant code
```

## Edge Cases

**Multiple unrelated changes:**

```
You have changes in 3 different areas:
1. New auth feature
2. Bug fix in user service
3. Updated dependencies

Consider splitting into separate commits:
- feat(api): add jwt authentication
- fix(users): handle null email validation
- chore(deps): update hono to v4.12.18
```

**Large refactoring:**
For massive refactors, use a broader scope:

```
refactor(api): migrate from nestjs to hono framework
```

**Configuration changes:**

```
chore(config): update typescript compiler options
```

## Notes

- **Always run `git diff --cached` first** to see what's actually staged
- If diff is too large (>500 lines), summarize the main theme
- Don't include implementation details in the message
- Focus on **what changed** and **why**, not **how**
- When in doubt, prefer `feat` or `refactor` over vague types like `chore`
