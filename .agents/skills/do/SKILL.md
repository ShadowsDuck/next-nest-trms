---
name: do
description: The "Execute" phase. Implement a specific task (e.g., T1) from a spec file. Focuses on surgical changes and following constraints.
---

# Do

This skill is for active implementation of a specific task.

## Process

1.  **Context**: Read the spec (e.g., `docs/specs/feature.md`) and the target task (e.g., `T1`).
2.  **Pre-flight Review**: Before writing any code, quickly review the target files and the task. If there's a missing dependency, unclear instruction, or an obvious conflict, stop and ask the user. Do not guess.
3.  **Surgical Implementation**:
    - Only touch files listed in the task.
    - Follow **Thai Comment** rules (as per AGENTS.md).
    - No unrelated refactors.
4.  **Verify**: Run the verification command or perform manual check.
5.  **Task Tracking**: Once the task is successfully implemented and verified, update the spec file (`docs/specs/*.md`) to change the task's checkboxes from `- [ ]` to `- [x]`.
6.  **Report**: State what was done and the result of verification. Suggest `ship` if all tasks are done.
