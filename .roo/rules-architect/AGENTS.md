# Project Architecture Rules (Non-Obvious Only)

- Uses TinyDB (file-based JSON) instead of traditional RDBMS for data persistence
- Database operations are synchronous despite async FastAPI framework
- Active theme determined by timestamp ordering, not explicit state management
- Router modules are defined but selectively mounted in FastAPI app
- Test suite assumes endpoints that may not be implemented