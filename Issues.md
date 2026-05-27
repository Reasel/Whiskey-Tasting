# User Feedback Issues

Tracking list of issues reported from user feedback. We'll work through these in order.

---

## Issue 1: Default user / remember selected user across themes

**Reported behavior:** When submitting a tasting, the user has to re-pick themselves every time. When switching themes, the previously selected person is forgotten.

**Expected behavior:**
- A default user can be set in Settings so submissions default to that person every time.
- When switching themes, the currently selected person should persist (i.e. last selected user is remembered across theme switches).

**Acceptance criteria:**
- [x] Settings screen has a "Default user" option.
- [x] On app start, the submission form defaults to the configured default user.
- [x] Switching themes preserves the currently selected user instead of resetting it.
- [x] Selection persists across app restarts (stored locally).

**Status:** Resolved on branch `claude/plan-mobile-apps-QG3gd`. Mobile only — web frontend was out of scope (no Settings page there yet). Two-key storage model: `default_username` (sticky, written only from Settings) wins on cold start; `last_username` is the in-session selection that survives theme switches; proxy/borrow submissions never touch `default_username`. Verified on-device: cold launch opens directly into scoring for the configured default, theme switching from the picker does not reset the user, and a borrow submission did not change the default after force-restart.

---

## Issue 2: New theme shows fake/seed data for 5 hardcoded users

**Reported behavior:** Creating a brand-new test theme with 1 whiskey shows existing data for 5 people (D.A.D., Dave, Rich, Tanner, Walt) even though nothing has been submitted for that theme.

**Expected behavior:**
- A newly created theme should have **no** submissions for any whiskey.
- The user list should reflect actual known users in the system, not a hardcoded subset of 5.

**Acceptance criteria:**
- [ ] Newly created themes show zero submissions until a real user submits.
- [ ] Identify and remove any seed/demo data being injected into new themes.
- [ ] Audit the user list source — confirm where the 5-user list comes from and replace with the full known-users list.

**Notes / open questions:**
- Is this seed data coming from `BackfillData.csv`, a backend fixture, or a mobile-side mock?
- Need to enumerate full canonical user list (more than 5 people exist).

---

## Issue 3: "Start Tasting" navigates to Taste tab with no theme switcher

**Reported behavior:** Tapping "Start Tasting" takes you to the Taste tab, but there's no way to pick which theme you're tasting — it just lands you in whatever theme is current.

**Expected behavior:**
- Defaulting to the most recently created theme is fine.
- The Taste tab should expose a theme switcher — either a dropdown at the top, or a "Switch Theme" button similar to the existing "Switch User" button.

**Acceptance criteria:**
- [x] Theme switcher is visible on the Taste tab.
- [x] Default selection is the most recently created theme.
- [x] Switching themes from the Taste tab updates the whiskey list / submission target accordingly.

**Notes / open questions:**
- Dropdown vs. button — which matches existing patterns better? (Lean toward matching the Switch User button for consistency.)
- Does this apply to web only, mobile only, or both?

**Status:** Resolved on branch `claude/plan-mobile-apps-QG3gd`. Mobile only — web frontend out of scope (matches Issue 1 scope). Themes are sorted client-side by `created_at` desc; the new scoring-phase Dropdown reuses the existing `handleThemeChange` callback, so switching themes mid-tasting refetches whiskeys and the active user's existing scores. Verified on-device: default user lands in the scoring view on the most recent theme; the dropdown switches themes without leaving the scoring view; both phases list themes recent-first.

---

## Issue 4: Add a new user from the Default Submitter panel

**Reported behavior:** Setting a default submitter in Settings only lets you choose from users that already exist on the server. There's no way to add a brand-new user from that panel.

**Expected behavior:**
- The Default Submitter panel in Settings should expose a way to enter a new user name (similar to the "OR ENTER A NEW NAME" input on the Taste tab selection phase).
- Once entered, that new name should be created on the server (or at least usable as the default) and selectable as the default submitter going forward.

**Acceptance criteria:**
- [ ] Settings → Default Submitter panel includes a text input for a new user name.
- [ ] Submitting a new name registers it as a user on the server (so it appears in the Taste tab picker too) and sets it as the default submitter.
- [ ] Trimming + duplicate handling matches the existing user-pick behavior (trim whitespace, don't double-create an existing name).

**Notes / open questions:**
- Should the new user be created immediately, or only on the next tasting submission?
- Should we share the same input affordance as the Taste tab picker for consistency?
