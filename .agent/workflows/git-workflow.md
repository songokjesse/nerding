---
description: Standard Git Workflow for Feature Development
---

1.  **Check Status**: Run `git status` to ensure the working directory is clean.
2.  **Checkout Main**: Run `git checkout main` (or master) to start from the base branch.
3.  **Pull Latest**: Run `git pull origin main` to ensure you have the latest changes.
4.  **Create Branch**: Run `git checkout -b feature/your-feature-name` to create a new branch for the task.
    *   Naming convention: `feature/`, `fix/`, `refactor/` followed by a descriptive name.
5.  **Make Changes**: Implement the requested changes.
6.  **Commit**: Run `git add .` and `git commit -m "feat: description of changes"` (using Conventional Commits).
7.  **Verify**: Run tests or build to ensure stability.
