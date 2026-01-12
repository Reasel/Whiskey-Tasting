# Project Debug Rules (Non-Obvious Only)

- Backend includes Windows-specific asyncio fix for Playwright compatibility (SelectorEventLoopPolicy)
- Database files stored in `apps/backend/data/` (check permissions if issues)
- Not all routers are mounted in FastAPI app (tastings, whiskeys, users exist but not included)