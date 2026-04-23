---
name: do
description: The "Execute" phase. Implement a specific task (e.g., T1) from a spec file. Focuses on surgical changes and following constraints.
---

# Do

This skill is for active implementation of a specific task.

## Process

1.  **Context**: Read the spec (e.g., `.ai/specs/feature.md`) and the target task (e.g., `T1`).
2.  **Surgical Implementation**:
    - Only touch files listed in the task.
    - Follow **Thai Comment** rules (as per AGENTS.md).
    - No unrelated refactors.
3.  **Verify**: Run the verification command or perform manual check.
4.  **Report**: State what was done and the result of verification. Suggest `ship` if done.
