# Orphan Tasting Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the missing cascade in `delete_whiskeys_by_theme` and ship a one-shot CLI script that cleans up the 50 polluted tasting rows on staging caused by TinyDB recycling whiskey IDs.

**Architecture:** Two independent backend changes — a tiny code fix in `apps/backend/app/database.py` (deletes tastings whenever whiskeys are removed), and a new standalone script `apps/backend/scripts/cleanup_orphan_tastings.py` that classifies/deletes orphan and stale tastings on demand. The script reuses the existing `Database` class so schema knowledge stays in one place. Deployment + cleanup execution on staging is a human-run runbook documented in `apps/backend/scripts/CLEANUP_RUNBOOK.md`.

**Tech Stack:** Python 3.10+, TinyDB 4.8+, pytest 8.0+. Backend uses a `.venv` at `apps/backend/.venv/`.

**Spec:** `docs/superpowers/specs/2026-05-27-orphan-tasting-cleanup-design.md`

**Pre-existing artifact:** A redacted copy of the staging database lives at `/tmp/issue2/staging.json` (50 polluted rows of 76 total). Used by Task 2 and Task 3 for end-to-end verification.

---

## File Structure

- **Modify** `apps/backend/app/database.py` (Task 1)
  - `delete_whiskeys_by_theme` (currently lines 186–190): cascade-delete tastings before removing whiskeys.
  - `delete_theme` (~line 142): the misleading "Note: tastings are deleted via cascade" comment becomes accurate; no other edit needed.

- **Modify** `apps/backend/tests/test_database.py` (Task 1)
  - Add two tests in the existing `TestDatabaseTastings` class (line 203) so the cascade integrity tests live with the tasting-side behaviour they verify.

- **Create** `apps/backend/scripts/__init__.py` (Task 2, empty file so the script can import siblings if needed later)

- **Create** `apps/backend/scripts/cleanup_orphan_tastings.py` (Tasks 2 & 3)
  - Argparse-driven CLI. Imports `Database` from `app.database`. Single file, ~100 lines.

- **Modify** `Dockerfile` (Task 4)
  - Add a `COPY apps/backend/scripts /app/backend/scripts` line so the script ships in the image. Currently the Dockerfile only copies `app/`, not `scripts/`.

- **Create** `apps/backend/scripts/CLEANUP_RUNBOOK.md` (Task 5)
  - Operator-facing markdown. Exact `docker` commands for the staging host with the cleanup flow.

---

## Task 1: Cascade-delete tastings when whiskeys are removed

**Files:**
- Modify: `apps/backend/app/database.py:186-190`
- Test: `apps/backend/tests/test_database.py` (add 2 tests inside `TestDatabaseTastings`)

- [ ] **Step 1: Write the failing tests**

Open `apps/backend/tests/test_database.py`, locate the `TestDatabaseTastings` class (starts at line 203), and append these two methods at the end of the class (after `test_get_user_tastings_for_theme`, before the `class TestDatabaseStats` line at 295):

```python
    def test_delete_whiskeys_by_theme_cascades_to_tastings(self, test_db):
        """Deleting whiskeys for a theme must also delete their tastings.

        Otherwise orphan tastings persist, and if TinyDB later recycles the
        whiskey doc_id (which it does after process restart when the deleted
        doc held the high-water mark), the orphan rows will appear as scores
        for the new whiskey.
        """
        theme = test_db.create_theme("Test Theme", "")
        user = test_db.get_or_create_user("Alice")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        test_db.create_or_update_tasting(
            user_id=user["id"],
            whiskey_id=whiskey["id"],
            aroma_score=4.0,
            flavor_score=4.0,
            finish_score=4.0,
            personal_rank=1,
        )

        assert len(test_db.get_tastings_by_theme(theme["id"])) == 1

        test_db.delete_whiskeys_by_theme(theme["id"])

        # The whiskey is gone, so get_tastings_by_theme returns []. Verify
        # the row is also gone from the underlying tastings table directly,
        # since that is the orphan we care about.
        assert test_db.tastings.all() == []

    def test_delete_theme_cascades_to_tastings(self, test_db):
        """The public delete_theme path must cascade tastings via
        delete_whiskeys_by_theme. Guards against future regressions if
        delete_theme is ever refactored to bypass that helper."""
        theme = test_db.create_theme("Test Theme", "")
        user = test_db.get_or_create_user("Alice")
        whiskey = test_db.create_whiskey(theme["id"], "Test Whiskey", 45.0)
        test_db.create_or_update_tasting(
            user_id=user["id"],
            whiskey_id=whiskey["id"],
            aroma_score=4.0,
            flavor_score=4.0,
            finish_score=4.0,
            personal_rank=1,
        )

        test_db.delete_theme(theme["id"])

        assert test_db.tastings.all() == []
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from the repo root:

```
apps/backend/.venv/bin/pytest apps/backend/tests/test_database.py::TestDatabaseTastings::test_delete_whiskeys_by_theme_cascades_to_tastings apps/backend/tests/test_database.py::TestDatabaseTastings::test_delete_theme_cascades_to_tastings -v
```

Expected: both FAIL with `AssertionError: assert [...] == []` — the tastings list still contains the orphan row because `delete_whiskeys_by_theme` does not delete tastings.

- [ ] **Step 3: Implement the cascade fix**

In `apps/backend/app/database.py`, replace the existing `delete_whiskeys_by_theme` (lines 186–190):

```python
    def delete_whiskeys_by_theme(self, theme_id: int) -> int:
        """Delete all whiskeys for a theme."""
        Whiskey = Query()
        removed = self.whiskeys.remove(Whiskey.theme_id == theme_id)
        return len(removed)
```

with:

```python
    def delete_whiskeys_by_theme(self, theme_id: int) -> int:
        """Delete all whiskeys for a theme and their associated tastings.

        Tastings must be cascaded because TinyDB recycles whiskey doc_ids
        after process restart (when the deleted whiskey held the high-water
        mark), and any orphan tasting whose whiskey_id matches the recycled
        id would silently re-attach to the new whiskey as a phantom score.
        """
        Whiskey = Query()
        whiskeys_to_delete = self.whiskeys.search(Whiskey.theme_id == theme_id)
        whiskey_ids = [w["id"] for w in whiskeys_to_delete]
        if whiskey_ids:
            Tasting = Query()
            self.tastings.remove(Tasting.whiskey_id.one_of(whiskey_ids))
        removed = self.whiskeys.remove(Whiskey.theme_id == theme_id)
        return len(removed)
```

- [ ] **Step 4: Run the tests to verify they pass**

```
apps/backend/.venv/bin/pytest apps/backend/tests/test_database.py::TestDatabaseTastings::test_delete_whiskeys_by_theme_cascades_to_tastings apps/backend/tests/test_database.py::TestDatabaseTastings::test_delete_theme_cascades_to_tastings -v
```

Expected: both PASS.

- [ ] **Step 5: Run the full backend test suite to check for regressions**

```
apps/backend/.venv/bin/pytest apps/backend/tests/ -v
```

Expected: all tests pass. The existing `test_delete_whiskeys_by_theme` (line 141) and `test_delete_theme` (line 77) still pass because they don't assert anything about tastings.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/database.py apps/backend/tests/test_database.py
git commit -m "Cascade-delete tastings when whiskeys are removed"
```

---

## Task 2: Cleanup script — classification + dry-run output

**Files:**
- Create: `apps/backend/scripts/__init__.py` (empty)
- Create: `apps/backend/scripts/cleanup_orphan_tastings.py`

**Verification surface:** The staging-DB copy at `/tmp/issue2/staging.json` — known counts: 26 orphan, 24 stale, 2 preserved, 24 clean (76 total).

- [ ] **Step 1: Create the empty package marker**

```bash
mkdir -p apps/backend/scripts
: > apps/backend/scripts/__init__.py
```

- [ ] **Step 2: Write the cleanup script (dry-run only)**

Create `apps/backend/scripts/cleanup_orphan_tastings.py` with this content:

```python
"""One-shot cleanup script for orphan and stale tasting rows.

Background: TinyDB recycles whiskey doc_ids after process restart when the
deleted doc held the high-water mark. Prior to the cascade fix in
`delete_whiskeys_by_theme`, tastings whose whiskey was deleted persisted as
orphans; if a new whiskey was later assigned the same id, those orphans
appeared as scores for the new whiskey ("stale" rows).

This script identifies and (with --apply) removes both classes. Dry-run by
default — pass --apply to actually delete.

Run inside the running container, or against a copied database.json on any
host:
    python -m scripts.cleanup_orphan_tastings           # dry-run, default DB
    python -m scripts.cleanup_orphan_tastings --apply   # delete
    python -m scripts.cleanup_orphan_tastings --db /tmp/database.json
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Allow running as `python scripts/cleanup_orphan_tastings.py` from
# `apps/backend/`, which puts `app/` on sys.path implicitly through cwd.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Database  # noqa: E402


def classify(db: Database):
    """Bucket every tasting into orphan / stale / preserved / clean.

    Returns a 4-tuple of lists. Each tasting dict is annotated with a
    'whiskey' key for printing (None for orphans).
    """
    whiskeys_by_id = {w["id"]: w for w in db.whiskeys.all()}

    orphan, stale, preserved, clean = [], [], [], []
    for t in db.tastings.all():
        w = whiskeys_by_id.get(t["whiskey_id"])
        annotated = dict(t)
        annotated["whiskey"] = w
        if w is None:
            orphan.append(annotated)
        elif t["created_at"] >= w["created_at"]:
            clean.append(annotated)
        elif t["updated_at"] < w["created_at"]:
            stale.append(annotated)
        else:
            preserved.append(annotated)
    return orphan, stale, preserved, clean


def format_row(t: dict, users_by_id: dict, *, include_whiskey_created: bool) -> str:
    uname = users_by_id.get(t["user_id"], {}).get("name", f"id={t['user_id']}")
    w = t["whiskey"]
    wname = repr(w["name"]) if w else "(deleted)"
    line = (
        f"  tasting #{t['id']:3d}  user={uname:<8s}  whiskey_id={t['whiskey_id']:<3d}"
        f"  {wname}\n"
        f"                created={t['created_at']}"
    )
    if include_whiskey_created and w is not None:
        line += f"  whiskey.created={w['created_at']}"
    line += f"  updated={t['updated_at']}"
    return line


def report(orphan, stale, preserved, clean, users_by_id, *, applied: bool) -> None:
    print(f"Orphan tastings (whiskey_id no longer exists): {len(orphan)}")
    for t in orphan:
        print(format_row(t, users_by_id, include_whiskey_created=False))
    print()

    print(f"Stale tastings (updated_at < whiskey.created_at — implies id reuse): {len(stale)}")
    for t in stale:
        print(format_row(t, users_by_id, include_whiskey_created=True))
    print()

    print(f"Preserved tastings (touched after whiskey existed; values reflect real scoring): {len(preserved)}")
    for t in preserved:
        print(format_row(t, users_by_id, include_whiskey_created=True))
    print()

    print(f"Clean tastings (created after their whiskey): {len(clean)}")
    print()

    to_delete = len(orphan) + len(stale)
    if applied:
        print(f"APPLIED — deleted {to_delete} rows under Orphan + Stale.")
    else:
        print(f"DRY RUN — pass --apply to delete the {to_delete} rows listed under Orphan + Stale.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually delete the listed rows. Default is dry-run.",
    )
    parser.add_argument(
        "--db",
        type=Path,
        default=None,
        help="Path to database.json. Defaults to settings.db_path.",
    )
    args = parser.parse_args(argv)

    db = Database(args.db) if args.db else Database()
    try:
        orphan, stale, preserved, clean = classify(db)
        users_by_id = {u["id"]: u for u in db.users.all()}

        if args.apply:
            doc_ids = [t.doc_id for t in db.tastings.all() if t["whiskey_id"] in
                       {x["whiskey_id"] for x in (orphan + stale)}
                       and t["id"] in {x["id"] for x in (orphan + stale)}]
            db.tastings.remove(doc_ids=doc_ids)

        report(orphan, stale, preserved, clean, users_by_id, applied=args.apply)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Note on the `--apply` deletion block in `main`: Task 3 will harden it (the current version works but is ugly). For Task 2 it is dead code — `args.apply` is always False in dry-run runs — so we ship it as-is, then refine in Task 3.

- [ ] **Step 3: Run the script in dry-run against the staging-DB copy**

```
cd apps/backend
.venv/bin/python -m scripts.cleanup_orphan_tastings --db /tmp/issue2/staging.json
```

Expected: the output ends with these lines (counts are the contract):

```
Orphan tastings (whiskey_id no longer exists): 26
...
Stale tastings (updated_at < whiskey.created_at — implies id reuse): 24
...
Preserved tastings (touched after whiskey existed; values reflect real scoring): 2
...
Clean tastings (created after their whiskey): 24

DRY RUN — pass --apply to delete the 50 rows listed under Orphan + Stale.
```

The two preserved rows must be tastings #7 (Tanner, Frey Ranch Rye) and #36 (Tanner, Whiskey 1).

If any count is off, stop and re-read `classify()` — the heuristic is the contract.

- [ ] **Step 4: Verify the staging-DB copy was NOT modified**

```
sha256sum /tmp/issue2/staging.json
```

Run the script again, then re-hash. Expected: same SHA both times (dry-run is read-only).

- [ ] **Step 5: Commit**

```bash
git add apps/backend/scripts/__init__.py apps/backend/scripts/cleanup_orphan_tastings.py
git commit -m "Add orphan/stale tasting cleanup script (dry-run)"
```

---

## Task 3: Cleanup script — `--apply` mode

**Files:**
- Modify: `apps/backend/scripts/cleanup_orphan_tastings.py` (clean up the `main` deletion block from Task 2)

- [ ] **Step 1: Replace the awkward deletion block with a clean implementation**

In `apps/backend/scripts/cleanup_orphan_tastings.py`, the `main` function currently contains this clunky block from Task 2:

```python
        if args.apply:
            doc_ids = [t.doc_id for t in db.tastings.all() if t["whiskey_id"] in
                       {x["whiskey_id"] for x in (orphan + stale)}
                       and t["id"] in {x["id"] for x in (orphan + stale)}]
            db.tastings.remove(doc_ids=doc_ids)
```

`classify()` returns annotated dicts that have the tasting's `id` key (the stored row id). TinyDB's `remove(doc_ids=...)` wants the *doc_id*. In this schema `id == doc_id` (set in `create_or_update_tasting` via `self.tastings.update({"id": tasting_id}, doc_ids=[tasting_id])`). So we can just use the stored `id` directly.

Replace the block with:

```python
        if args.apply:
            ids_to_delete = [t["id"] for t in orphan + stale]
            if ids_to_delete:
                db.tastings.remove(doc_ids=ids_to_delete)
```

- [ ] **Step 2: Make a fresh copy of the staging-DB sample**

```bash
cp /tmp/issue2/staging.json /tmp/issue2/staging-copy.json
```

This is a scratch copy. We will run `--apply` against it and verify the result.

- [ ] **Step 3: Run with `--apply` against the copy**

```bash
cd apps/backend
.venv/bin/python -m scripts.cleanup_orphan_tastings --db /tmp/issue2/staging-copy.json --apply
```

Expected output footer:

```
APPLIED — deleted 50 rows under Orphan + Stale.
```

- [ ] **Step 4: Verify the copy has exactly 26 tastings remaining**

```bash
.venv/bin/python -c "
import json
with open('/tmp/issue2/staging-copy.json') as f:
    db = json.load(f)
print('remaining tastings:', len(db['tastings']))
print('remaining ids:', sorted(int(k) for k in db['tastings'].keys()))
"
```

Expected: `remaining tastings: 26`. The 26 surviving doc_ids should be the union of the 24 clean + 2 preserved (`#7`, `#36`). They should NOT include any of the 26 orphan (`#8`–`#10`, `#11`–`#16`, `#66`–`#82` excluding `#79`/`#80` which are clean) or 24 stale (`#17`–`#41` minus `#36`) tastings.

- [ ] **Step 5: Run the script a second time against the cleaned copy**

```bash
.venv/bin/python -m scripts.cleanup_orphan_tastings --db /tmp/issue2/staging-copy.json
```

Expected:

```
Orphan tastings (whiskey_id no longer exists): 0
Stale tastings (updated_at < whiskey.created_at — implies id reuse): 0
Preserved tastings (touched after whiskey existed; values reflect real scoring): 2
Clean tastings (created after their whiskey): 24

DRY RUN — pass --apply to delete the 0 rows listed under Orphan + Stale.
```

This proves idempotence — re-running on a clean DB is a no-op.

- [ ] **Step 6: Verify the original sample is untouched**

```bash
.venv/bin/python -c "
import json
with open('/tmp/issue2/staging.json') as f:
    db = json.load(f)
print('original tastings:', len(db['tastings']))
"
```

Expected: `original tastings: 76`. (Only the `-copy.json` was modified.)

- [ ] **Step 7: Clean up the scratch copy**

```bash
rm /tmp/issue2/staging-copy.json
```

- [ ] **Step 8: Commit**

```bash
git add apps/backend/scripts/cleanup_orphan_tastings.py
git commit -m "Wire --apply path in orphan tasting cleanup script"
```

---

## Task 4: Ship the script in the Docker image

**Files:**
- Modify: `Dockerfile`

The current Dockerfile copies `apps/backend/app` into the image but not
`apps/backend/scripts/`. Without this change, the new script never reaches
the staging container and the runbook's `docker exec` calls would fail with
`ModuleNotFoundError: No module named 'scripts'`.

- [ ] **Step 1: Add the COPY line for `scripts/`**

In `Dockerfile`, find the existing Backend Setup block (around line 77–78):

```dockerfile
COPY apps/backend/pyproject.toml /app/backend/
COPY apps/backend/app /app/backend/app
```

Add a third COPY line immediately after the `app` copy:

```dockerfile
COPY apps/backend/pyproject.toml /app/backend/
COPY apps/backend/app /app/backend/app
COPY apps/backend/scripts /app/backend/scripts
```

The subsequent `RUN useradd ... && chown -R appuser:appuser /app` (around
line 117–118) already handles permissions for everything under `/app`, so
nothing else changes.

- [ ] **Step 2: Build the image locally and verify the script is present**

```bash
cd /home/reasel/git/Whiskey-Tasting
docker build -t whiskey-tasting:local-cleanup-test .
docker run --rm whiskey-tasting:local-cleanup-test \
  ls /app/backend/scripts/
```

Expected output (order may vary):

```
CLEANUP_RUNBOOK.md
__init__.py
cleanup_orphan_tastings.py
```

(`CLEANUP_RUNBOOK.md` will be present only after Task 5 lands; for this
task's verification, just confirm `__init__.py` and `cleanup_orphan_tastings.py`
appear.)

- [ ] **Step 3: Verify the script runs inside the image**

```bash
docker run --rm -w /app/backend whiskey-tasting:local-cleanup-test \
  python -m scripts.cleanup_orphan_tastings --help
```

Expected: argparse help text printed, including `--apply` and `--db` flags.
No `ModuleNotFoundError`.

- [ ] **Step 4: Clean up the test image**

```bash
docker rmi whiskey-tasting:local-cleanup-test
```

- [ ] **Step 5: Commit**

```bash
git add Dockerfile
git commit -m "Ship cleanup script in the backend Docker image"
```

---

## Task 5: Deployment & cleanup runbook

**Files:**
- Create: `apps/backend/scripts/CLEANUP_RUNBOOK.md`

This is operator documentation. No tests; no code. The runbook is what *you* (the operator) follow on the staging host after the new image is deployed.

- [ ] **Step 1: Write the runbook**

Create `apps/backend/scripts/CLEANUP_RUNBOOK.md` with this content:

````markdown
# Orphan Tasting Cleanup — Staging Runbook

One-shot operational procedure for cleaning up the 50 polluted tasting rows
on the staging backend (`whiskey.mjelde.us`, container name `whiskey-tasting`).

This is **destructive**. Read the whole thing before running anything.

## Why

Prior to the cascade fix in `delete_whiskeys_by_theme`, deleted whiskeys
left orphan tasting rows behind. TinyDB recycles whiskey `doc_id`s after
container restarts, so those orphans re-attached to new whiskeys as phantom
scores. The cleanup script identifies and removes:

- **Orphans:** tastings whose `whiskey_id` no longer exists.
- **Stale:** tastings whose `updated_at` predates their current whiskey's
  `created_at` (the row was attached via id reuse, not a real submission).

Tastings whose `updated_at` is after the whiskey's `created_at` are
**preserved** — those are real user submissions whose rows happened to start
as stale data but were overwritten by `create_or_update_tasting`.

See `docs/superpowers/specs/2026-05-27-orphan-tasting-cleanup-design.md` for
the full root-cause analysis.

## Prerequisites

- The deployed image already contains `apps/backend/scripts/cleanup_orphan_tastings.py`
  and the cascade fix (commits in this branch).
- You have shell access to the docker host running the `whiskey-tasting`
  compose stack.
- The volume `whiskey-data` is mounted at `/app/backend/data` inside the
  container, with `database.json` at that path.

## Procedure

All commands run on the docker host.

### 1. Back up the live database

```bash
docker cp whiskey-tasting:/app/backend/data/database.json \
  ./database-pre-cleanup-$(date -u +%Y%m%dT%H%M%SZ).json
ls -la database-pre-cleanup-*.json
```

Keep this file around. It is your rollback.

### 2. Dry-run the cleanup against the live DB (read-only)

The container's default `WORKDIR` is `/app`; the script lives at
`/app/backend/scripts/`. Use `-w` to set the working directory for the
exec'd process so `python -m scripts.cleanup_orphan_tastings` resolves.

```bash
docker exec -w /app/backend whiskey-tasting \
  python -m scripts.cleanup_orphan_tastings
```

Expected on a freshly-deployed staging that has not been cleaned before:

```
Orphan tastings (whiskey_id no longer exists): 26
...
Stale tastings (updated_at < whiskey.created_at — implies id reuse): 24
...
Preserved tastings (touched after whiskey existed; values reflect real scoring): 2
...
Clean tastings (created after their whiskey): 24

DRY RUN — pass --apply to delete the 50 rows listed under Orphan + Stale.
```

Read the listed rows. If any preserved row looks wrong, STOP and investigate
before proceeding. If the orphan + stale numbers look way off from 50, STOP —
either the DB has drifted significantly since the spec was written, or the
script is misbehaving.

### 3. Stop the container before applying

`create_or_update_tasting` can be called by a live user mid-cleanup, which
would interleave writes. Quiesce the app first.

```bash
docker stop whiskey-tasting
```

### 4. Apply the cleanup

The script runs against the file directly via `--db`, which means we need a
container with the image but no running app. The simplest path: start a
one-shot container with the same image and volume.

```bash
docker run --rm \
  -v whiskey-data:/app/backend/data \
  -w /app/backend \
  reasel/whiskey-tasting:staging \
  python -m scripts.cleanup_orphan_tastings --apply
```

Expected output footer:

```
APPLIED — deleted 50 rows under Orphan + Stale.
```

### 5. Re-dry-run to confirm idempotence

```bash
docker run --rm \
  -v whiskey-data:/app/backend/data \
  -w /app/backend \
  reasel/whiskey-tasting:staging \
  python -m scripts.cleanup_orphan_tastings
```

Expected:

```
Orphan tastings (whiskey_id no longer exists): 0
Stale tastings (updated_at < whiskey.created_at — implies id reuse): 0
Preserved tastings (touched after whiskey existed; values reflect real scoring): 2
Clean tastings (created after their whiskey): 24

DRY RUN — pass --apply to delete the 0 rows listed under Orphan + Stale.
```

### 6. Restart the app

```bash
docker start whiskey-tasting
```

Wait for the healthcheck to report healthy (`docker ps` shows `(healthy)`),
then load the app on a phone or browser.

### 7. Verify in the UI

- Open the Data View for the "Test theme" → it should show scores from
  Tanner only. D.A.D., Dave, Rich, and Walt should be gone.
- Open the Data View for "Wolcott by Barton 1792" → it should show only
  scores submitted after 2026-02-07 (the whiskeys' creation date). The
  January phantom scores from D.A.D./Dave/Rich/Tanner/Walt should be gone.

If anything looks wrong, see Rollback below.

## Rollback

If the post-cleanup state is wrong:

```bash
docker stop whiskey-tasting
docker cp ./database-pre-cleanup-<TIMESTAMP>.json \
  whiskey-tasting:/app/backend/data/database.json
docker start whiskey-tasting
```

That restores the live DB to its pre-cleanup state. Then investigate before
re-attempting.

## Future themes

Once this runbook is executed, the cascade fix prevents new orphans from
being created. New themes can be deleted and recreated freely without
producing phantom data. The cleanup script should never be needed again on
this DB unless the cascade fix is regressed.
````

- [ ] **Step 2: Commit**

```bash
git add apps/backend/scripts/CLEANUP_RUNBOOK.md
git commit -m "Add staging cleanup runbook for orphan tastings"
```

---

## Post-Implementation: Issues.md update

(Not a code task — a single Issues.md edit recording status. Do this after Task 4 commits land.)

- [ ] In `Issues.md` (project root), under **Issue 2** flip the three acceptance checkboxes to `[x]` and append a **Status** paragraph that:
  - Notes the root cause was TinyDB doc_id recycling + missing cascade on whiskey delete (not seed data).
  - Confirms `GET /users` already returns the full known-users list (no hardcoded subset of 5).
  - Calls out that the runbook at `apps/backend/scripts/CLEANUP_RUNBOOK.md` must be executed on staging to finish the resolution.
  - Mentions the commits.

Commit message: `Mark Issue 2 acceptance criteria complete`.
