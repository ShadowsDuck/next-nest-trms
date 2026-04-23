---
name: to-prd
description: Turn the current conversation context and shared understanding into a structured PRD file in the docs/ directory. Use after a "grill-me" session or when a plan is finalized.
---

# To PRD

This skill synthesizes the current conversation context, design decisions, and codebase understanding into a formal Product Requirements Document (PRD).

## Process

1.  **Synthesize Understanding**: Review the conversation (especially any "grill-me" sessions) to capture all finalized decisions.
2.  **Determine Filename**: Suggest a descriptive, kebab-case filename based on the feature (e.g., `multi-step-approval.md`). Confirm with the user if unsure.
3.  **Structure Content**: Use the template below to ensure both product requirements and technical implementation details are captured in one place.
4.  **Save File**: Write the content to the `docs/` directory. Create the directory if it doesn't exist.

## PRD Template

```markdown
---
title: [Feature Name]
date: [YYYY-MM-DD]
status: Draft | In-Progress | Completed
author: Antigravity & User
---

# [Feature Name]

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A comprehensive list of user stories:

1. As an <actor>, I want a <feature>, so that <benefit>

## Implementation Details (Technical Design)

### Modules Affected

- List of modules to be built or modified.

### Schema Changes

- Any database changes required.

### API Contracts

- New or modified endpoints and data shapes.

### Architectural Decisions

- Why certain patterns or technologies were chosen.

## Testing Plan

- What behavior needs to be verified.
- Key test cases (Happy path & Edge cases).

## Out of Scope

- Things we are NOT doing in this iteration.

## Further Notes

- Any additional context or future considerations.
```

## Rules

- **No GitHub Issues**: Do not attempt to submit this to GitHub. Save only as a local file in `docs/`.
- **Single Source of Truth**: Ensure all major decisions from the "grill-me" session are reflected here.
- **Thai Comments**: (Project Rule) Any code snippets or specific Thai logic should follow the Thai comment rule.
