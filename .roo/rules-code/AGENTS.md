# Project Coding Rules (Non-Obvious Only)

- Database operations are synchronous (TinyDB), so no `await` needed in FastAPI handlers
- Use `Query()` from tinydb for database searches and updates
- To set a theme as active, update its `created_at` timestamp to current time (makes it most recent)
- Router modules exist but not all are included in `main.py` (check `app/routers/__init__.py` for available routers)