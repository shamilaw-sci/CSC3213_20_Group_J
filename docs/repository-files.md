# What belongs in Git

Keep the application source, automated tests, database setup and migration scripts, Maven/npm manifests and lockfiles, Maven wrapper scripts, GitHub workflows, startup scripts, sanitized environment examples, public image assets, and maintained project documentation. The presentation PDF is a project document, not a runtime log.

Do not commit:

- Real `.env` files and environment variants containing credentials. `.env.example` and `.env.sample` remain eligible for Git when they contain placeholders only.
- Database/configuration backups in `local-backups/`, or temporary source copies in `untracked_backup/`.
- Java crash/replay logs, application logs, heap dumps, and diagnostic recordings (`*.log`, `*.hprof`, `*.dmp`, `*.jfr`).
- Installed dependencies (`node_modules/`), compiled outputs (`target/`, `dist/`, `.class`, `.jar`), uploaded customer files, editor settings, or browser-test output.
- Raw historical audit `.txt` logs and `.json` snapshots. Keep useful conclusions in Markdown and attach fresh execution logs to CI runs.

The November 15 cleanup removes already tracked crash logs and generated audit output from the next commit while retaining the files locally. The incoming `untracked_backup/` copies are also kept locally; the current source versions preserve the later security fixes. Ignore rules prevent accidental re-addition. This does not remove files from older commits or rewrite shared history.

Before committing, review `git diff --cached --stat` and `git diff --cached --check`. A merge resolution must include new files as well as modified files; `git commit -am` alone does not add new files.
