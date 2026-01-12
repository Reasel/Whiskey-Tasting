# Project Documentation Rules (Non-Obvious Only)

- Router modules exist in `app/routers/` but not all are included in `main.py` (tastings, whiskeys, users)
- Test seed data uses endpoints that may not be implemented (e.g., PUT `/themes/{theme_id}/whiskeys`)
- Active theme is most recent by timestamp, not flagged as active