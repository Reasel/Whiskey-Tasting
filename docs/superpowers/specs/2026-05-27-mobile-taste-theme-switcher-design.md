# Mobile Taste Tab: Theme Switcher — Design

**Date:** 2026-05-27
**Issue:** Issues.md → Issue 3
**Scope:** mobile only (`apps/mobile/`)

## Problem

On the mobile app, tapping "Start Tasting" from the home screen lands the user on the Taste tab. With a default user configured (Issue 1), the selection phase is skipped and the user goes straight into the scoring view for whatever theme is current. The scoring view has no theme switcher — only a CHANGE USER button — so the user cannot switch themes without leaving the tab.

Additionally, the default theme is currently `themes[0]` from `fetchThemes()`, which returns themes in TinyDB insertion order (oldest first), not by recency.

## Goal

Expose theme selection on the scoring view and make the default theme on cold start the most recently created theme.

## Architecture

Add an inline `Dropdown` (existing component, `apps/mobile/components/ui/Dropdown.tsx`) to the scoring-phase header in `apps/mobile/app/tasting/index.tsx`. Sort themes by `created_at` desc on the client (the `/api/v1/themes` endpoint returns insertion order; the backend is not changed).

The dropdown reuses the existing `handleThemeChange` callback, which already refetches whiskeys and existing scores for the selected user when the theme changes. No new wiring, no new API endpoints, no new storage keys.

## UI placement

Scoring-phase header (currently theme name + "Tasting as: …" + CHANGE USER button) gains a THEME dropdown above the user line:

```
┌───────────────────────────────┐
│ THEME                         │
│ ┌───────────────────────────┐ │
│ │ Bourbon Night        ▼    │ │
│ └───────────────────────────┘ │
│ Tasting as: Alice             │
│ [ CHANGE USER ]               │
└───────────────────────────────┘
```

The selection-phase dropdown (already present) is unchanged in placement; it benefits from the same recent-first sort.

## Behavior

- **Default theme on cold start:** sort `themesResp.themes` by `created_at` desc client-side; default `selectedThemeId` to the first element.
- **Dropdown ordering:** dropdown options list themes recent-first (same sort as default), so the most recent theme is at the top of the list.
- **Switching themes during scoring:** delegates to existing `handleThemeChange` — refetches whiskeys, then refetches existing scores for the active user. Unsubmitted in-progress scores for the previous theme are discarded silently (same as today when switching from the selection-phase dropdown).
- **Single theme:** dropdown renders normally with one option (harmless, consistent).
- **Zero themes:** existing "No Themes" empty state handles this before scoring renders; no change.
- **Deleted-theme fallback:** the existing focus-effect path falls back to the first theme in the sorted list, which under the new sort is the most recent theme. Behavior is preserved (just sorted differently).

## Code touch points

Single file: `apps/mobile/app/tasting/index.tsx`.

1. **Add a sort helper** (module-scope, top of file): sort `Theme[]` by `created_at` desc. A pure helper avoids re-implementing the comparator at every call site.
2. **In `loadData`:** apply the sort to `themesResp.themes` before storing in state and before selecting the default theme.
3. **In the focus-effect refresh:** apply the same sort to the freshly fetched themes before `setThemes`.
4. **Scoring-phase JSX:** insert `<Dropdown label="THEME" value={selectedThemeId} options={themeOptions} onChange={handleThemeChange} />` above the `Tasting as: …` `AppText`.
5. **No style changes required** — `Dropdown` brings its own spacing; the existing `themeHeader` container holds it.

The existing `themeOptions = themes.map(...)` mapping is reused — because `themes` state is now stored already sorted, both phase dropdowns get the recent-first order automatically.

## Out of scope

- Web frontend (matches Issue 1 mobile-only scope; web has no Settings page yet either).
- Persisting last-selected theme across app restarts. Spec only requires defaulting to the most recent; stickiness is a separate feature.
- Confirmation dialog before discarding unsubmitted scores on theme switch. Today's selection-phase behavior is silent discard; we preserve that for now.
- Changing the backend `list_themes` to return sorted results. Client-side sort is sufficient; no backend change.
- New tests. The mobile app has no test framework wired up; verification is `tsc --noEmit` plus manual on-device.

## Acceptance criteria

- [ ] Theme switcher (inline `Dropdown` labeled "THEME") is visible in the scoring-phase header on the Taste tab.
- [ ] On cold start with no themes selected, the most recently created theme is selected by default in both the selection phase and the scoring phase.
- [ ] Dropdown options list themes ordered most-recent-first in both phases.
- [ ] Selecting a different theme from the scoring-phase dropdown updates the whiskey list, reloads existing scores for the current user, and stays in the scoring phase.
- [ ] `tsc --noEmit` passes for `apps/mobile`.
- [ ] Verified on the emulator: open Taste tab as a configured default user, switch themes via the new dropdown, confirm the whiskey list and any previously submitted scores update.
