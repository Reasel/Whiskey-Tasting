# Orphan Tasting Cleanup — Design

**Date:** 2026-05-27
**Issue:** Issues.md → Issue 2
**Scope:** backend only (`apps/backend/`)

## Problem

On the staging backend (`whiskey.mjelde.us`), creating a brand-new theme with one
whiskey ("Test theme" / "Whiskey 1") shows existing scores for D.A.D., Dave, Rich,
Tanner, and Walt — even though only Tanner has actually submitted for that whiskey.

Root cause is a combination of three things:

1. **Missing cascade.** `delete_whiskeys_by_theme` (`apps/backend/app/database.py:186`)
   removes whiskey rows but never deletes the associated `tastings` rows. The
   comment in `delete_theme` claims tastings are cascade-deleted; the code does not
   match the comment.
2. **TinyDB recycles `doc_id`s after process restart.** On reopen, `_next_id`
   is rebuilt as `max(current doc_ids) + 1`. If the deleted document held the
   high-water-mark id, the next insert reuses that id. A container restart is
   sufficient to trigger this.
3. **Stale tastings adopt the new whiskey.** An orphan tasting with
   `whiskey_id = N` continues to satisfy backend score queries the moment a new
   whiskey is assigned `id = N`. `create_or_update_tasting` then *updates* the
   stale row in place when the same user re-submits, which also explains why
   Tanner's `created_at` for whiskey 23 still shows January.

The staging DB shows 26 fully-orphan tastings (`whiskey_id` ∈ {1–6, 10–13},
none of which currently exist) and 24 stale tastings — every whiskey created
after 2026-02-07 has pollution from earlier-deleted whiskeys whose ids were
recycled. Two further tastings are time-inverted (`created_at` precedes the
current whiskey's creation) but have an `updated_at` after the whiskey was
created — these are real user submissions whose rows were re-used by
`create_or_update_tasting`; they must be preserved. Total polluted rows to
delete: 50 of 76 tastings.

The local dev DB does not exhibit the bug because no whiskey has been deleted
there, so no orphans exist to be re-attached.

## Goal

Stop new themes from inheriting phantom scores, and remove the 50 polluted rows
already in the staging DB. Make the cleanup repeatable and inspectable rather
than silent and automatic.

## Architecture

Two independent backend changes:

- **Code change** — `delete_whiskeys_by_theme` cascades to `tastings`. This
  prevents any future orphan from being created when a theme/whiskey is removed.
  With no orphans, future `doc_id` reuse becomes harmless: there is nothing
  stale left to bind to.
- **Operational tool** — a standalone CLI script that scans the database file
  for orphan and stale tastings, prints them, and (with `--apply`) deletes
  them. Run once on staging to clean up the existing 50 rows.

No new API endpoint, no startup migration, no schema change. The TinyDB
`_next_id` behavior is left alone — the cascade fix makes id reuse safe.

## Code change: cascade

`apps/backend/app/database.py:186` — replace:

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
    """Delete all whiskeys for a theme and their associated tastings."""
    Whiskey = Query()
    whiskeys_to_delete = self.whiskeys.search(Whiskey.theme_id == theme_id)
    whiskey_ids = [w["id"] for w in whiskeys_to_delete]
    if whiskey_ids:
        Tasting = Query()
        self.tastings.remove(Tasting.whiskey_id.one_of(whiskey_ids))
    removed = self.whiskeys.remove(Whiskey.theme_id == theme_id)
    return len(removed)
```

The misleading comment in `delete_theme` ("Note: tastings are deleted via
cascade when whiskeys are deleted") becomes true and stays.

## Operational tool: cleanup script

**Location:** `apps/backend/scripts/cleanup_orphan_tastings.py` (new file, new
directory).

**Usage:**

```
python scripts/cleanup_orphan_tastings.py [--apply] [--db PATH]
```

- Default: dry-run. Prints findings, deletes nothing.
- `--apply`: actually delete the listed rows.
- `--db PATH`: override the database file path. Default is
  `settings.db_path`, which inside the running container resolves to
  `/app/backend/data/database.json`.

**Classification, per tasting row in `db.tastings.all()`:**

- **Orphan** — `whiskey_id` not found in the current `whiskeys` table.
- **Stale (id-reuse contamination)** — whiskey exists, but the tasting's
  `updated_at` is earlier than the referenced whiskey's `created_at`. The
  tasting has not been touched since the current whiskey was created, so
  the values cannot reflect any rating of the current whiskey — they were
  inherited via id reuse. The inversion on the staging DB is weeks-to-months,
  well outside any plausible clock-skew window.
- **Preserved** — whiskey exists and the tasting's `updated_at` is at or after
  the whiskey's `created_at`. The values may have started as stale data but
  have since been overwritten by `create_or_update_tasting`, so they reflect
  the current user's actual scoring intent for the current whiskey. Kept as-is.
  (Tanner's whiskey-23 row falls into this category: `created_at`=January, but
  `updated_at`=today, just after whiskey 23 was created.)
- **Clean** — everything else (tasting created after its whiskey). Not touched.

**Output format (dry-run example):**

```
Orphan tastings (whiskey_id no longer exists): 26
  tasting #66  user=Dave    whiskey_id=10  created=2026-02-07T02:58:52  updated=2026-02-07T02:58:52
  ...

Stale tastings (updated_at < whiskey.created_at — implies id reuse): 24
  tasting #21  user=D.A.D.  whiskey_id=23  ('Whiskey 1')
                created=2026-01-21T02:11:00  whiskey.created=2026-05-27T13:38:36  updated=2026-01-21T02:11:00
  ...

Preserved tastings (touched after whiskey existed; values reflect real scoring): 2
  tasting #  7  user=Tanner  whiskey_id=15  ('Frey Ranch Rye')
                created=2026-01-13T00:46:02  whiskey.created=2026-01-21T21:42:38  updated=2026-02-07T03:10:06
  tasting # 36  user=Tanner  whiskey_id=23  ('Whiskey 1')
                created=2026-01-21T02:14:02  whiskey.created=2026-05-27T13:38:36  updated=2026-05-27T13:39:08

DRY RUN — pass --apply to delete the 50 rows listed under Orphan + Stale.
```

**Deletion mechanics:** `db.tastings.remove(doc_ids=[...])` for the union of
the two sets in a single call. TinyDB writes atomically; no transaction needed.

**Safety:** the script reuses the existing `Database` class (imports
`from app.database import Database`), so schema knowledge is not duplicated.
Caller is expected to back up `database.json` before passing `--apply` as
standard hygiene. The README/operational note for the script will say so.

## Tests

`apps/backend/tests/test_database.py` gains two cases:

- `test_delete_whiskeys_by_theme_cascades_to_tastings` — create a theme +
  whiskey + tasting, call `delete_whiskeys_by_theme`, assert the tasting row
  is gone.
- `test_delete_theme_cascades_to_tastings` — same, but exercising the
  public `delete_theme` path that already calls `delete_whiskeys_by_theme`.

No test for the standalone cleanup script: it is a one-shot operational tool
whose dry-run output is the verification surface.

## Acceptance criteria

- [ ] `delete_whiskeys_by_theme` removes the associated tastings; both new
      tests pass; the existing `delete_theme` cascade comment is now accurate.
- [ ] `cleanup_orphan_tastings.py` exists, defaults to dry-run, supports
      `--apply` and `--db`, and uses the project's `Database` class.
- [ ] On a copy of the current staging DB, dry-run reports 26 orphan + 24
      stale rows (and 2 preserved: Tanner's whiskey-15 and whiskey-23
      submissions, which have `updated_at` after their whiskey's creation).
      `--apply` removes exactly those 50 rows; the 2 preserved rows plus the
      24 clean tastings (26 total) remain.
- [ ] After running `--apply` on staging and reopening the app, the "Test
      theme" Data View shows scores from Tanner only — his real submission
      today survives because the heuristic uses `updated_at`, not
      `created_at`. D.A.D., Dave, Rich, and Walt are gone from the new theme.
- [ ] Issue 2 acceptance criteria 2 and 3 (`identify/remove seed data`,
      `audit user list source`) are addressed by reporting in the Issues.md
      status paragraph: no seed injection exists; `GET /users` already
      returns the full known-users list.

## Out of scope

- Any frontend change. Data View, dashboard People dropdown, and Taste tab
  user picker render correctly once the data is clean.
- Preventing TinyDB id reuse at the source (e.g., a `_meta` table tracking
  monotonic high-water marks per table). The cascade fix makes id reuse
  harmless; prevention is unnecessary complexity.
- Migrating off TinyDB.
- Exposing cleanup as an HTTP admin endpoint. A CLI inside the container is
  enough for a one-shot operation.
- Auto-cleanup on startup. Silent deletion based on a heuristic is too risky.
- A unit test for the standalone cleanup script.
- Cleanup of the local dev DB. It has no orphans; running the script there is
  a no-op.
