# Canonical Workspace Rule — CA-firm / Brains & Taxes SaaS

1. **Always use `G:\CA-firm`** as the sole workspace for reading, editing, typechecking (`npx tsc --noEmit`), building (`npm run build`), running dev/start servers, and executing `git` commands for the CA-firm / Brains & Taxes SaaS project.
2. **Never edit or build inside Antigravity Git worktrees** (`C:\Users\Chetan\.gemini\antigravity\worktrees\CA-firm\...` or `C:\Users\Chetan\.gemini\antigravity\worktrees\eager-fermi\...`), even if a conversation was opened inside a worktree path, unless the user explicitly instructs otherwise for a specific task.
3. If the session's `Active Workspaces` or `Command Working Directory` points to a C: worktree, target all `read_file`, `edit_file`, `write_file`, and `run_command` paths directly to `G:\CA-firm`.
