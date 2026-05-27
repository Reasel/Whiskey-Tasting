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
            # `>=` rather than `>`: a tasting whose created_at exactly
            # matches the whiskey's was born alongside the whiskey, so
            # treat it as clean (cannot be inherited from a prior whiskey).
            clean.append(annotated)
        elif t["updated_at"] < w["created_at"]:
            stale.append(annotated)
        else:
            # tasting.updated_at >= whiskey.created_at: row may have
            # started as id-reuse contamination but has since been
            # overwritten by create_or_update_tasting, so values reflect
            # real scoring intent.
            preserved.append(annotated)
    return orphan, stale, preserved, clean


def format_row(t: dict, users_by_id: dict, *, include_whiskey_created: bool) -> str:
    uname = users_by_id.get(t["user_id"], {}).get("name", f"id={t['user_id']}")
    w = t["whiskey"]
    wname = repr(w.get("name", f"id={w.get('id', '?')}")) if w else "(deleted)"
    line = (
        f"  tasting #{t['id']:3d}  user={uname:<8s}  whiskey_id={t['whiskey_id']:<3d}"
        f"  {wname}\n"
        f"                created={t.get('created_at', '?')}"
    )
    if include_whiskey_created and w is not None:
        line += f"  whiskey.created={w.get('created_at', '?')}"
    line += f"  updated={t.get('updated_at', '?')}"
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

    # Clean rows are unaffected and uninteresting — only print the count.
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
            ids_to_delete = [t["id"] for t in orphan + stale]
            if ids_to_delete:
                db.tastings.remove(doc_ids=ids_to_delete)

        report(orphan, stale, preserved, clean, users_by_id, applied=args.apply)
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
