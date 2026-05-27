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

## Identify the actual volume name

Docker Compose prefixes named volumes with the project name. On this host
the volume is most likely `whiskey-tasting_whiskey-data`, but verify before
proceeding:

```bash
docker volume ls | grep whiskey
```

Note the exact volume name returned (e.g. `whiskey-tasting_whiskey-data`).
You will substitute this name in steps 4 and 5 below in place of
`<VOLUME_NAME>`. If `docker volume ls` returns nothing, the volume does not
exist under that name and you should stop and investigate before running
anything else — a missing volume would cause `docker run -v <missing>:...`
to silently create a new empty volume and the cleanup would "succeed"
against nothing.

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

The Preserved and Clean counts may differ from this example if real scoring
activity has occurred since the spec was written; focus on Orphan + Stale
totaling around 50.

Read the listed rows. If any preserved row looks wrong, STOP and investigate
before proceeding. If the orphan + stale numbers look way off from 50, STOP —
either the DB has drifted significantly since the spec was written, or the
script is misbehaving.

### 3. Stop the container before applying

TinyDB's JSON storage does a full-file read and full-file write on every
operation, with no advisory locking. If `create_or_update_tasting` is called
by a live user mid-cleanup, the concurrent writes race at the OS level on
`database.json` itself — last writer wins, so either the user's submission
or the cleanup's deletes can be silently discarded. Quiesce the app first.

```bash
docker stop whiskey-tasting
```

### 4. Apply the cleanup

The script runs against the file directly via `--db`, which means we need a
container with the image but no running app. The simplest path: start a
one-shot container with the same image and volume.

```bash
docker run --rm \
  -v <VOLUME_NAME>:/app/backend/data \
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
  -v <VOLUME_NAME>:/app/backend/data \
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
