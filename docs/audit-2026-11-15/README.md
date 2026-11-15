# Historical audit reproduction tools

The findings and verification summaries are maintained in [the original recheck](../project-recheck-2026-11-15.md) and [the remediation report](../remediation-2026-11-15.md).

This directory retains the diagnostic source files and database verification scripts. The probes describe the state at the time of the original audit; they are not the current regression suite. Current automated tests live under `icrowd_api/src/test/` and `iCrowd_UI/tests/`.

Raw `.txt` logs and `.json` snapshots are generated output and are ignored by Git. Existing local copies were preserved during repository cleanup. New test output should remain local or be attached as CI artifacts. Do not put credentials, database dumps, uploaded receipts, or customer records in this directory.
