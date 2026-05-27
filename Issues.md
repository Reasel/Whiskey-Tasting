# User Feedback Issues

Tracking list of issues reported from user feedback. We'll work through these in order.

---

## Issue 1: Default user / remember selected user across themes

**Reported behavior:** When submitting a tasting, the user has to re-pick themselves every time. When switching themes, the previously selected person is forgotten.

**Expected behavior:**
- A default user can be set in Settings so submissions default to that person every time.
- When switching themes, the currently selected person should persist (i.e. last selected user is remembered across theme switches).

**Acceptance criteria:**
- [ ] Settings screen has a "Default user" option.
- [ ] On app start, the submission form defaults to the configured default user.
- [ ] Switching themes preserves the currently selected user instead of resetting it.
- [ ] Selection persists across app restarts (stored locally).

**Notes / open questions:**
- Should "default user" override the last-selected user, or only seed the initial selection?
- Behavior on web vs mobile — should it sync, or is local-per-device fine?

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
- [ ] Theme switcher is visible on the Taste tab.
- [ ] Default selection is the most recently created theme.
- [ ] Switching themes from the Taste tab updates the whiskey list / submission target accordingly.

**Notes / open questions:**
- Dropdown vs. button — which matches existing patterns better? (Lean toward matching the Switch User button for consistency.)
- Does this apply to web only, mobile only, or both?
