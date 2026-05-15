---
name: git-commit-writer
description: Streamline git workflow by analyzing changes, matching repository style, staging files, and creating commits with AI-generated messages. Use when the user wants to commit changes, needs a commit message, or wants to automate the staging and committing process.
---

# Git Commit (Inspired by Anthropic /commit)

Streamline your git workflow with a single process for analyzing, staging, and committing changes with AI-generated messages that match your repository's style.

## When to Use

Trigger this skill when the user:

- Asks to "commit changes" or "/commit"
- Says "stage and commit this"
- Needs a commit message for their work
- Wants to ensure their commit message follows conventional standards and matches the project's existing style

## Workflow

### Step 1: Analyze Repository Context

```bash
# Check current status of all changes
git status

# Examine recent commit messages to match style
git log -n 10 --pretty=format:%s
```

Verify if there are any changes (staged or unstaged). If the repository is clean, inform the user.

### Step 2: Analyze Changes

```bash
# Review staged changes
git diff --cached

# Review unstaged changes
git diff
```

Analyze both staged and unstaged changes to understand the full scope of work. Identify files that should be staged and those that should be ignored (e.g., secrets).

### Step 3: Propose Staging & Message

Draft a **Conventional Commit** message following the project's style:

```
<type>(<scope>): <subject>
```

**Security Rules:**

- **NEVER** stage or commit files containing secrets (e.g., `.env`, `*.pem`, `credentials.json`, `*.key`).
- If such files are detected, warn the user and exclude them from staging.

**Staging Strategy:**

- If the user has unstaged changes that are relevant to the work, propose staging them: `git add <files>`.
- Always verify with the user before staging new files if there's any ambiguity.

### Step 4: Generate the Commit Message

**Rules for the message:**

- **Short & Concise**: Ideally under 72 characters.
- **Lowercase**: Use lowercase for type and scope.
- **Imperative Mood**: "add feature" instead of "added feature".
- **Match Style**: If the repo uses specific prefixes or emojis, follow that pattern.

### Step 5: Execute Commit

Once the user approves the message and the files to be staged:

```bash
git add <relevant_files>
git commit -m "<generated_message>"
```

## Types (Conventional Commits)

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `chore`: Maintenance (deps, config, cleanup)
- `docs`: Documentation
- `style`: Formatting (no code change)
- `test`: Adding/fixing tests
- `perf`: Performance
- `build`: Build system
- `ci`: CI/CD

## Examples

### Example: Auto-Staging & Style Matching

**Git Status**: `Modified: src/auth/login.ts` (unstaged), `Modified: README.md` (staged)
**Recent Logs**: `feat(web): update dashboard`, `fix(api): handle timeout`

**Action**:

1. Propose staging `src/auth/login.ts`.
2. Generate message:

   ```
   feat(auth): implement login validation logic
   ```

## Notes

- **Proactive Staging**: Unlike a simple writer, this skill helps the user stage their work.
- **Style Consistency**: Always look at `git log` first to ensure we aren't introducing a different naming convention.
- **Validation**: Always show the `git diff` summary to the user before finalizing.
