# Staging-image local test stack

Run the `reasel/whiskey-tasting:staging` image against a *copy* of the real
staging DB on this dev host, so you can validate the cleanup runbook and
sanity-check the mobile app end-to-end before pointing the runbook at
`whiskey.mjelde.us`.

## What you get

- Backend on `http://192.168.1.2:8010` (LAN-reachable from your phone)
- Frontend on `http://192.168.1.2:3010`
- DB persisted in `./data/database.json` as a bind mount (easy to seed,
  reset, and inspect — never touches production data)
- ntfy disabled (won't spam the real notification topic)

## One-time prerequisites

- Docker + docker compose v2 installed on this host.
- Open the host firewall for port 8010 (and 3010 if you want web UI access).
  On NixOS, this typically means temporarily allowing those ports — the
  default firewall blocks them. Reference: NixOS notes in the project memory.
- Pull the image once (compose will also do this automatically due to
  `pull_policy: always`, but doing it manually lets you watch for errors):
  ```bash
  docker pull reasel/whiskey-tasting:staging
  ```

## Workflow: test the cleanup runbook end-to-end

All commands run from the repo root unless noted.

### 1. Seed the test DB with a copy of staging

The cleanup script expects the real polluted data shape. If you have a copy
of the staging DB at `/tmp/issue2/staging.json` (as we used during
development), seed from that:

```bash
mkdir -p docker/staging-test/data
cp /tmp/issue2/staging.json docker/staging-test/data/database.json
```

If you don't have that file, grab a fresh copy off the staging host:

```bash
ssh <staging-host> docker cp whiskey-tasting:/app/backend/data/database.json - | \
  tar -xO > docker/staging-test/data/database.json
```

### 2. Bring up the stack

```bash
docker compose -f docker/staging-test/docker-compose.yml up -d
```

Wait ~30–60 seconds for the healthcheck to pass:

```bash
docker compose -f docker/staging-test/docker-compose.yml ps
# Expected: STATUS shows "Up X seconds (healthy)"
```

If you need to override the LAN IP (e.g. you're on a different network):

```bash
HOST=10.0.0.5 docker compose -f docker/staging-test/docker-compose.yml up -d
```

### 3. Point the mobile app at this host

In whatever EAS / dev-client profile you're using to test, set:

```
EXPO_PUBLIC_SERVER_URL=http://192.168.1.2:8010
```

Reload the app. The Data View should show the same polluted data the real
staging instance does (phantom scores for D.A.D., Dave, Rich, Walt on
"Test theme").

### 4. Follow the cleanup runbook against THIS stack

The full runbook lives at `apps/backend/scripts/CLEANUP_RUNBOOK.md`. Two
substitutions for local testing:

- **Container name:** the runbook says `whiskey-tasting`. Here it is
  `whiskey-tasting-staging-test`.
- **Volume mount:** the runbook uses a named docker volume
  (`<VOLUME_NAME>`). Here we use a host bind mount, so the `docker run --rm`
  commands in steps 4 and 5 become:

  ```bash
  docker run --rm \
    -v "$(pwd)/docker/staging-test/data:/app/backend/data" \
    -w /app/backend \
    reasel/whiskey-tasting:staging \
    python -m scripts.cleanup_orphan_tastings --apply
  ```

Otherwise — backup, dry-run via `docker exec -w /app/backend ...`, stop,
apply, re-dry-run, restart, verify — runs identically.

### 5. Verify in the mobile app

The Data View on "Test theme" should now show scores from Tanner only.
D.A.D., Dave, Rich, and Walt are gone. "Wolcott by Barton 1792" should
show only post-2026-02-07 submissions.

### 6. Tear down when done

```bash
docker compose -f docker/staging-test/docker-compose.yml down
```

The `./data` directory is left intact so you can re-bring-up later without
re-seeding. Delete it manually if you want a clean slate:

```bash
rm -rf docker/staging-test/data
```

## Resetting between tests

To reset to a fresh polluted DB and re-run the cleanup:

```bash
docker compose -f docker/staging-test/docker-compose.yml down
rm -rf docker/staging-test/data
mkdir -p docker/staging-test/data
cp /tmp/issue2/staging.json docker/staging-test/data/database.json
docker compose -f docker/staging-test/docker-compose.yml up -d
```

## Notes

- This stack is **not** for normal mobile dev — for that, use Expo
  (`apps/mobile/`) pointed at the local FastAPI dev server. Use this stack
  only when you specifically want to validate against the production-shape
  Docker image.
- The bind mount means the host UID (typically 1000 on a single-user box)
  must match the container's `appuser` UID (1000). If you hit permission
  errors, `sudo chown -R 1000:1000 docker/staging-test/data`.
- `NEXT_PUBLIC_API_URL` is baked into the Next.js bundle at build time. The
  image was built with `http://localhost:8010` (CI default). For testing
  the web frontend at `http://192.168.1.2:3010`, requests will go to
  `localhost:8010` from the browser — which won't work cross-device. The
  *mobile* app (which sets `EXPO_PUBLIC_SERVER_URL` at runtime) is
  unaffected. If you need the web frontend to talk to the LAN backend,
  rebuild the image locally with `--build-arg NEXT_PUBLIC_API_URL=...`.
