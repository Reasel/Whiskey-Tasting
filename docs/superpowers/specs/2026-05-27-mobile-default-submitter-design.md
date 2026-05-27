# Mobile: Default Submitter & Persistent User Selection

**Date:** 2026-05-27
**Status:** Approved
**Scope:** `apps/mobile` only
**Tracks:** Issues.md → Issue 1

## Problem

Two related complaints from users of the mobile app:

1. **Theme switch resets the submitter.** When the user changes themes on the Taste tab, the app kicks them back to the user picker and they have to re-select themselves. They expect the current submitter to persist across theme switches.
2. **No "default user".** Even when nobody is borrowing the phone, the user has to pick themselves every time the app opens. They want to configure a default submitter in Settings so the app comes up already pointed at them.

## Goal

When a user opens the mobile app, they should land directly in the tasting flow already selected as the submitter — without going through the picker. Switching themes mid-session must not reset that selection. Borrowing the phone for someone else (the existing proxy/passing flow) must not pollute the configured default.

## Out of scope

- Web frontend (`apps/frontend`) — no settings page exists there and the theme-switch UX is different. May follow later if requested.
- Backend changes — no new endpoints, no schema changes.
- Issue 2 (phantom seed users) and Issue 3 (theme switcher on Taste tab) — separate items in `Issues.md`.
- The proxy/passing flow itself (`handleSubmit` resetting `userSelected=false` after a successful submit). That behavior is intentional and stays.

## Design

### Storage model — two AsyncStorage keys

| Key | Purpose | Set by | Cleared by |
| --- | --- | --- | --- |
| `default_username` (new) | Sticky preference. The "this is me" setting. | Settings screen only. | "Clear default" button in Settings. |
| `last_username` (exists) | Transient: the last person who actively picked themselves in the picker. Survives app restarts but treated as session state. | `handleSelectUser` and `handleContinueAsNew` on the Taste tab. | Never explicitly cleared. |

Two keys lets us answer two different questions cleanly:

- *On app launch, who am I?* → `default_username` wins. If unset, fall back to `last_username`. If both unset, show the picker.
- *Mid-session, who is currently selected?* → `last_username` is the source of truth. Theme switches do not touch it.

The behavior contract: **the default never gets clobbered by a borrow**. Anyone can tap a different name in the picker and start submitting as them; that writes `last_username` but never `default_username`.

### File-by-file changes

#### `apps/mobile/lib/storage.ts`

Add three helpers alongside the existing username helpers:

```ts
const KEYS = {
  SERVER_URL: 'server_url',
  USERNAME: 'last_username',
  DEFAULT_USERNAME: 'default_username',  // new
} as const;

export async function getDefaultUsername(): Promise<string | null> { ... }
export async function setDefaultUsername(name: string): Promise<void> { ... }
export async function clearDefaultUsername(): Promise<void> { ... }
```

Existing `getLastUsername` / `setLastUsername` stay as they are.

#### `apps/mobile/app/tasting/index.tsx`

**`loadData()` (currently lines 99–125):** read both `default_username` and `last_username` in the initial `Promise.all`. Resolve the initial submitter as `default || last` (in that order). If the resolved name is non-empty AND appears in the fetched users list, set `userName` and `userSelected = true` so the picker is skipped. If the name doesn't appear (e.g. user deleted server-side), fall back silently to the picker — no error toast. Then load existing scores for that user against the selected theme so they see their in-progress entries.

**`handleThemeChange()` (currently lines 180–188):** remove the `setUserSelected(false)` call. After switching the theme, if a user is currently selected, call `loadExistingScores(userName, themeId)` so the score grid reflects the new theme's whiskeys for that user. If no user is selected, behavior is unchanged (picker stays visible).

**`handleSubmit()` (currently lines 240–270):** no change. Proxy flow stays intact.

**Picker polish (optional, low-risk):** when the picker is shown and a `default_username` exists, render that user's card with a visual emphasis (e.g. a small "Default" badge or `selected`-style border) so one tap returns to the default after a borrow. This is purely cosmetic and does not change any state machine.

#### `apps/mobile/app/settings.tsx`

Add a new `<Panel title="Default Submitter">` between the "Server Connection" panel and the "About" panel.

Contents:
- Short description: "Pick who the app should default to when you open it. You can still tap a different name on the Taste tab to submit as someone else — your default won't change."
- On mount, call `fetchUsers()` to populate the list. Use the same fetch helper the Taste tab uses.
- Render a vertical list of user cards (reuse the existing card styling from the Taste picker if straightforward; otherwise a simple `Button`/row pattern is fine — visual parity is not required).
- Tapping a user calls `setDefaultUsername(name)` and updates local state to show that name as the current default.
- Show the current default at the top of the panel (e.g. "Currently: Tanner") with a "Clear default" secondary button that calls `clearDefaultUsername()`.
- Empty state when `users.length === 0`: "Submit a tasting once, then you can set yourself as default here." No fetch error toast on failure — quietly show a generic "Could not load users" line and let the user retry by navigating away and back.

### Edge cases

- **Stored default user no longer exists on the server.** Fall back silently to the picker on Taste tab mount. Settings panel shows the stored name + an inline "(not found on server)" note next to it so the user can clear/replace it.
- **Default set but user list still loading.** Treat as "no default yet" for that frame; the existing loading spinner already covers this.
- **User clears default and `last_username` is also unset.** Next app launch shows the picker. Expected.
- **User changes default in Settings, then opens Taste.** Taste tab is a separate screen with its own `loadData()`. As of this design, `loadData()` runs on mount and on focus refresh. Switching tabs after a Settings change re-runs the focus effect; we extend the focus effect to also re-evaluate the default if the user is currently on the picker. If a user is already selected on Taste, we do not yank them back to apply a newly-changed default — that would be jarring. They'll get the new default on next app launch.

### Acceptance criteria

- [ ] Settings has a "Default Submitter" panel with user list, current default display, and a "Clear default" button.
- [ ] Setting a default writes to AsyncStorage under `default_username`.
- [ ] On app launch (cold start), if a default is set, the Taste tab opens directly into the scoring flow for that user, skipping the picker.
- [ ] If no default is set but `last_username` is set, the Taste tab opens for that user.
- [ ] If neither is set, the picker is shown as today.
- [ ] Switching themes on the Taste tab does not return to the picker. Scores reload for the new theme.
- [ ] Proxy flow (submit → picker → next person picks themselves → they submit) does not change `default_username`.
- [ ] A default pointing at a deleted user does not crash the app; the picker is shown instead.

## Verification plan

Manual on-device verification (no automated mobile tests exist in this repo today):

1. **Default set, theme switch:** Set default to "Tanner" in Settings. Cold-launch app. Land in scoring. Switch theme via the picker. Still in scoring as Tanner. Scores reflect new theme.
2. **No default, last_username set:** Clear default. Pick "Tanner" in picker, score a whiskey, navigate away and back. Force-close app and reopen. Land in scoring as Tanner.
3. **Proxy borrow doesn't pollute default:** Set default to "Tanner". Submit. Picker reappears. Pick "Dave". Dave submits. Force-close app. Reopen. Land in scoring as **Tanner**, not Dave.
4. **Stale default:** Set default to "Walt". Delete Walt server-side. Reopen app. Picker is shown, no crash. Settings panel notes "(not found on server)" next to Walt.

## Risk

Low. Changes are isolated to two files in `apps/mobile/` plus one storage helper. No backend, no schema, no shared web code. The most invasive change — removing `setUserSelected(false)` from `handleThemeChange` — is a one-line removal in a well-bounded callback.
