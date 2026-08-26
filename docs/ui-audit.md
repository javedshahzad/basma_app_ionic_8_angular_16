# UI Audit — Basma App (Ionic 8 / Angular 22)

**Scope note:** the screenshots provided are real, live screens (not staged Home/List/Detail/Form/Empty/Error states):

1. `list-student` — supervisor/admin attendance grid, period not yet marked
2. `list-student` — teacher attendance-marking view, period in progress
3. `student-profile-modal` — avatar/stats popup opened from the grid
4. `student-detail` — full "صحيفة الطالب" (student report) page
5–6. `student-titles` — achievements/skill-currency vault

No genuine **empty** or **error** state was included, and I did not fabricate one. Where I reference those states below, it's from reading the code path, called out explicitly as "not visually verified."

Every finding below is backed by an exact file/line or a `grep` count I ran against the real repo — no estimates presented as fact. Ordered by **impact-to-effort**, highest first.

---

## Tier 1 — Global fixes (one file, whole-app impact)

### 1. [BLOCKER] Broken color ramp — shade/tint are copies of base, RGB doesn't match hex
**File:** `src/theme/variables.scss:7-20`
```scss
--ion-color-primary: #006fb9;
--ion-color-primary-rgb: 56, 128, 255;   /* ≠ #006fb9 (should be 0,111,185) */
--ion-color-primary-shade: #006fb9;      /* same as base — no shade */
--ion-color-primary-tint: #006fb9;       /* same as base — no tint */

--ion-color-secondary: #43a047;
--ion-color-secondary-rgb: 61, 194, 255; /* ≠ #43a047 (should be 67,160,71) */
```
Any Ionic internal use of `rgba(var(--ion-color-primary-rgb), α)` — ripple effects, focus rings, `ion-button` activated states — renders a **different color** than the button itself (a blue-purple tint instead of the app's actual blue). Pressed/hover states on every primary/secondary button are silently wrong. `-shade`/`-tint` being identical to base means Ionic's built-in hover/activated darkening has nothing to darken to.
**Fix:** run the six base colors through Ionic's [color generator](https://ionicframework.com/docs/theming/color-generator) and replace `-rgb`, `-shade`, `-tint` for primary and secondary with correct derived values.

### 2. [MAJOR] Global `font-weight: 300` on every element, with a `serif` fallback on a sans-serif font
**File:** `src/global.scss:34-39`
```scss
* {
  font-family: "Rubik", serif;
  font-weight: 300;
}
```
Rubik is sans-serif; if the Google Fonts load fails (offline first load, slow network — this is a school-staff app used on shared devices in Kuwait), text falls back to a serif font, not `sans-serif`. Weight 300 (Light) is the *default* for every element that doesn't carry a Tailwind `font-*` utility — combined with finding #6 below (9-11px text everywhere), this produces genuinely hard-to-read thin, tiny text as the app's baseline, not the exception.
**Fix:** `font-family: "Rubik", sans-serif;` and drop the blanket `font-weight: 300` (let `ion-app`'s own default — normal/400 — apply; opt into Light only where explicitly wanted).

### 3. [MAJOR] `ion-header { border: none !important; }` fighting page-level borders
**File:** `src/global.scss:677-679`, contradicted at e.g. `src/app/student-detail/student-detail.page.html:1`
```scss
// global.scss
ion-header{ border: none !important; }
```
```html
<!-- student-detail.page.html -->
<ion-header class="ion-no-border bg-white border-b border-slate-200" mode="md">
```
A global `!important` strips every header's native bottom border, then individual pages manually re-add a Tailwind `border-b` (and separately set `ion-no-border`) to get it back. Two systems overriding each other to reach the same visual result — genuinely fighting the framework, and inconsistent because not every page bothers to re-add the border, so some screens have it and some don't with no visual logic tying that to hierarchy.
**Fix:** delete the global override; use `ion-no-border` + Tailwind `border-b` (already present) as the single source of truth, applied consistently.

### 4. [MAJOR] `mode="ios"` and `mode="md"` mixed — including within the same page
**Verified counts:** `mode="md"` — 187 occurrences / 74 files. `mode="ios"` — 20 occurrences / 14 files.
**Concrete same-file collision:** `src/app/list-student/list-student.page.html:40` (`mode="ios"` on a date control) vs `src/app/list-student/list-student.page.html:100` (`mode="md"` on `ion-content`) — one page renders part of its chrome in each platform style simultaneously.
Other files with the same internal collision: `add-notes.page.html`, `classlist.page.html`, `manage-student.page.html`, `search-student.page.html`, `select-message-user.page.html`, `student-report-manage.page.html`, `submit-absent-application.page.html`, `settings.page.html`, `edit-teacher-profile.page.html`, `followup-add-fields.page.html`, `follow-bulletins.page.html`, `apply-vouches-code.page.html`.
**Fix:** pick one mode app-wide (given the RTL Arabic UI and Material-style flat headers already dominant, `md` is the natural choice) and set it once in `ionic.config.json` / `main.ts` (`initialize({ mode: 'md' })`) instead of hardcoding `mode="md"` on ~200 individual elements. Delete the 20 `mode="ios"` overrides.

### 5. [MAJOR] Touch targets under 44×44pt, defined globally
**File:** `src/global.scss`
```scss
.rounded-btn{ height: 34px !important; width: 34px; }          // line 691-698
ion-menu-button{ height: 35px; width: 40px; }                   // line 651-657
```
**File:** `src/app/components/student-profile-modal/student-profile-modal.component.html:2-7` — close button `w-8 h-8` (32×32px)
**File:** `src/app/student-detail/student-detail.page.html:55-61` — camera FAB `w-8 h-8` (32×32px)
All below the 44×44pt Apple HIG / Material minimum. `.rounded-btn` and `ion-menu-button` are global classes, so this isn't a one-off — it's the *default* small-button size baked into the design system.
**Fix:** raise `.rounded-btn`/`ion-menu-button` to `44px` minimum; bump modal/page-header icon buttons from `w-8 h-8` to `w-11 h-11` (44px at Tailwind's 4px scale).

### 6. [MAJOR] Typography: 13 distinct font sizes in active use (target ~5-6)
**Verified via grep across `src/app/**/*.html`:**
- Arbitrary pixel values: `text-[6px]` ×1, `text-[9px]` ×48, `text-[10px]` ×95, `text-[11px]` ×86, `text-[13px]` ×12 — **231 occurrences total**, all bypassing both Tailwind's own scale and any Ionic typography token.
- Standard Tailwind scale also in use: `text-xs` 241, `text-sm` 488, `text-base` 118, `text-lg` 165, `text-xl` 217, `text-2xl` 49, `text-3xl` 46, `text-4xl` 34.
- One true outlier: `src/app/warning-report/warning-report.page.html:79` — `text-[6px]`, below any legibility floor for body/label text.
That's 5 arbitrary sizes stacked on top of an 8-step standard scale = 13 sizes with no naming or usage convention distinguishing them (`text-[9px]` and `text-[10px]` and `text-[11px]` are all used for "secondary label" text interchangeably across different files).
**Fix:** define a real 6-step scale (e.g. 11/13/15/17/20/24px — Tailwind `fontSize` theme extension), map every arbitrary value to the nearest step, and lint-block new `text-\[.*px\]` arbitrary values (`eslint-plugin-tailwindcss`'s `no-arbitrary-value` or a simple CI grep gate).

### 7. [MINOR] Radius scale: 11 distinct values, no system
**Verified via grep:** `rounded-sm`(2px) 4×, `rounded-md`(6px) 29×, `rounded-lg`(8px) 64×, `rounded-xl`(12px) 376×, `rounded-2xl`(16px) 224×, `rounded-3xl`(24px) 53×, `rounded-full` 308×, plus arbitrary `rounded-[1.5rem]` 8×, `rounded-[2rem]` 38×, `rounded-[24px]` 4×, `rounded-[2.5rem]` 1×. Global.scss adds its own ad-hoc set on top: `3px`, `5px`, `10px`, `12px`, `13px`, `15px`, `16px`, `20px`, `28px`, `30px`, `40px`, `45px`, `50px`.
`rounded-3xl` (24px) and `rounded-[24px]` are the *same value* expressed two different ways in different files — pure inconsistency, not intentional variation.
**Fix:** standardize on Tailwind's default scale only (`lg`/`xl`/`2xl`/`3xl`/`full`) for components, ban arbitrary `rounded-[…]` the same way as font sizes, and fold the global.scss one-offs into that scale on next touch.

### 8. [MAJOR] Six font-weights in play against a 300-weight default
**Verified via grep:** `font-bold` 856×, `font-black` 157×, `font-medium` 95×, `font-extrabold` 28×, `font-semibold` 2×, plus the global unlabeled default of 300 (finding #2). That's weights 300/500/600/700/800/900 all live simultaneously — `font-semibold`(600) appears only twice, suggesting it's an accidental outlier rather than an intentional step, and `font-extrabold`(800) sitting between `font-bold`(700, dominant) and `font-black`(900, also heavily used) adds a step most type systems don't need.
**Fix:** collapse to three weights — regular(400) body default, `font-bold`(700) emphasis, `font-black`(900) headings/numbers — and reassign the `font-medium`/`font-extrabold`/`font-semibold` sites to the nearest of those three.

### 9. [MAJOR] WCAG AA contrast failures on the most-used secondary-text color
Computed via the WCAG relative-luminance formula, not estimated:
- **`text-slate-400` (`#94a3b8`) on white (`#ffffff`) → 2.56:1.** Needs 4.5:1 (normal text) or 3:1 (large/bold). This pairing is the app's default for every meta/label line — e.g. `student-profile-modal.component.html:45` (`مؤشر الأداء العام` label, `text-[9px] text-slate-400`), `student-detail.page.html` skill labels, list-item subtitles across dozens of pages. **Fails outright**, made worse by these labels also being 9-11px (finding #6) — WCAG's contrast floor gets *stricter* at small sizes, not looser.
- **`--ion-color-danger` (`#eb445a`) as text/icon color on white → 3.81:1.** Passes only for large (≥18px) or bold ≥14px text/UI components; fails for the many small danger badges/icons in the 9-11px range found throughout (e.g. the delay/absent badges in `supervisor-view.component.html`, `teacher-view.component.html`).
**Fix:** darken the "muted" gray token to at least `slate-500` (`#64748b`, ≈4.6:1 on white — passes) and use it wherever `text-slate-400` currently carries real information (not pure decoration); reserve `--ion-color-danger` for large/bold contexts only, or introduce a darker `danger-700`-equivalent for small badge text.

### 10. [MINOR] Raw hex and `!important` throughout global.scss instead of Ionic CSS variables
**File:** `src/global.scss` — 60+ `!important` declarations, dozens of literal hex colors (`#3d5afe`, `#f00`, `#43a047`, `#666`, `#bbbbbb`, `#f43f5e`, `#64748b`, `#1e293b`, `#4f46e5`...) — several recently-added blocks (marked with 🟢/🌟 emoji comments, e.g. lines 738-851 "Lineone" styling) even comment the color's semantic name (`/* Slate 500 */`, `/* Indigo 600 */`) right next to the literal hex instead of using the Tailwind/Ionic token that already carries that name.
This is the clearest evidence the app is styled through override combat rather than the token system: Ionic component internals (`ion-action-sheet`, `ion-modal::part(content)`, `ionic-selectable-modal`) are reached almost exclusively via `!important` + `::part()`/nested-selector overrides rather than the CSS custom properties Ionic exposes for exactly this purpose (`--border-radius`, `--background`, `--box-shadow` do get used in places — e.g. `.plan-receipt-modal` — so the pattern is known, just not applied consistently).
**Fix:** no single fix — this is a "stop digging" item. Going forward, prefer the component's own `--*` custom properties over `!important` + `::part()`, and reference `var(--ion-color-*)`/Tailwind's `indigo-600` etc. instead of re-typing the hex.

---

## Tier 2 — Per-screen findings (tied to the actual screenshots)

### Screenshot 1–2: `list-student` + `supervisor-view`/`teacher-view` (attendance grid)
**Files:** `src/app/list-student/list-student.page.html`, `src/app/components/supervisor-view/supervisor-view.component.html`, `src/app/components/teacher-view/teacher-view.component.html`

- **[MINOR]** The status-cell icons (✓ / ✕ / −) are the *only* differentiator between present/absent/delayed for colorblind users beyond color — this is actually done reasonably well (icon + color together, not color alone). No finding here, called out as a positive.
- **[MINOR]** `supervisor-view.component.html` lines 88-141 — badge/meta text again in the `text-[9px]`/`text-[10px]`/`text-[11px]` range covered by Tier 1 finding #6; no separate fix needed beyond that global one.
- **[CORRECTED after live verification, MINOR]** Original draft of this audit claimed `list-student` had no skeleton loader. **Wrong** — live-verified by throttling the `getStudents` response 4s and screenshotting mid-request: `list-student.page.html:100-106` renders 5 pulsing placeholder cards (`@if (show_loading) { @for (dummy of [1,2,3,4,5]) { <div class="h-20 bg-slate-200 rounded-2xl animate-pulse"> } }`) that closely match the real card layout. It's a genuine, working skeleton — just hand-rolled with Tailwind's `animate-pulse` instead of Ionic's `<ion-skeleton-text>`. No fix needed here; the earlier claim in this document was based on grepping only for the literal string `ion-skeleton-text` and missed this equivalent pattern. See the corrected app-wide count in finding #11.

### Screenshot 3: `student-profile-modal`
**File:** `src/app/components/student-profile-modal/student-profile-modal.component.html`

- **[MAJOR]** Close button (line 2-7, `w-8 h-8`) and camera button (line 15-20, same modal) both 32×32px — see Tier 1 #5.
- **[MINOR]** Radius mixing within one component: `rounded-3xl` (root, line 1), `rounded-2xl` (stat cards, lines 43/63), `rounded-full` (avatar, badges) — three different radius steps in one small card with no visual hierarchy reason for the variation (a stat card and the root container don't need different corner roundness to read correctly).
- **[MINOR]** Empty state for the skill panel *is* handled — line 187-191: `لا توجد مهارات مسجلة حتى الآن` when `studentTotalPoints === 0`. This is a genuine, correctly-implemented empty state (positive finding, not everything is missing).
- **[MINOR]** Loading state for skills uses `ion-spinner` (lines 100-101, 113-116) rather than a skeleton — inconsistent with the "prefer skeletons" guidance, though a small centered spinner in a modal this size is a defensible exception, not a hard violation.

### Screenshot 4: `student-detail` ("صحيفة الطالب")
**File:** `src/app/student-detail/student-detail.page.html`

- **[MAJOR]** `mode="md"` hardcoded on both `ion-header` (line 1) and `ion-content` (line 37) — see Tier 1 #4.
- **[MAJOR]** `bg-[#f8fafc]` (line 37) — arbitrary raw hex instead of `--ion-background-color` or a Tailwind token (`bg-slate-50` is the exact same color and already used elsewhere in this same file's sibling components) — a token that already exists elsewhere in the design isn't reused here.
- **[MINOR]** Custom back button (lines 27-32, plain `<button>` + `goBack()`) instead of `<ion-back-button>`, with an inline comment admitting it's a workaround ("🟢 زر العودة المخصص لحل مشكلة توجيه ولي الأمر" — "custom back button to fix parent redirect issue"). This is a real custom-nav-hack, but scoped (4 occurrences app-wide vs 53 native `ion-back-button` uses) rather than systemic.
  **Fix:** if the routing bug that motivated this is still present, fix it at the router/guard level so the native `ion-back-button` (with its correct platform-specific transition/icon) can be restored; a per-page custom back button loses the native iOS swipe-back gesture pairing.
- **[MINOR]** Streak/frozen badges (lines 67-89) use `text-[9px]` — covered by Tier 1 #6.

### Screenshot 5–6: `student-titles` (achievements vault)
**File:** `src/app/student-titles/student-titles.page.html`

- **[MINOR]** 10 distinct arbitrary text sizes in this one file alone (`text-[9px]` ×2, `text-[10px]` ×8, `text-[11px]` ×2) — same Tier 1 #6 issue, notably concentrated.
- **[MINOR]** The "مُفعل حالياً" (currently active) state on the title card and the locked/unlocked achievement cards (rocket/shield icons) rely entirely on a border-color + tiny badge-text change to signal state — no icon-based redundant signal the way the attendance grid does. Lower risk than the attendance grid (this screen is informational, not action-driving), but worth the same present/selected pattern used in screenshot 1-2 for consistency.

---

## Tier 3 — Cross-cutting / structural

### 11. [MAJOR → downgraded to MINOR after live verification] States coverage, verified against actual render paths and live screenshots
| State | Coverage found |
|---|---|
| Loading | **Corrected from the first draft of this audit.** Re-grepped for both Ionic's native `ion-skeleton-text` (6 files) **and** the Tailwind `animate-pulse` hand-rolled equivalent (18 more files, incl. `list-student`, `classlist`, `students`, `student-detail`, `supervisor-view`, `teacher-view`) — **24 files with a genuine skeleton-style loader**, plus `ion-spinner` in 7 more, out of ~190 templates. Live-verified on `list-student` by throttling `getStudents` 4s: it shows 5 correctly-shaped pulsing placeholder cards, not a blank screen. Real coverage is roughly 1-in-6 templates, not "almost none" — a genuine gap on the *other* ~150 templates remains, but the severity and the specific claim about `list-student` in the original draft were wrong. |
| Empty | Present and correct in `student-profile-modal` (skill panel). Live-verified attempt to trigger a data-search empty state on `classlist` found no search affordance on that specific page (not every list page has one) — not confirmed missing elsewhere, still open. |
| Error | **Live-verified** by aborting the `getStudents` network request outright: the app shows a well-formed, correctly-translated toast (`تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.` — "Failed to connect to the server. Check your internet connection.") — the error-surfacing mechanism itself works correctly and reads well. But the page body behind the toast is completely blank with **no retry button or inline error state** — once the toast auto-dismisses, the user is left on an empty page with no way to retry short of navigating away and back. This part of the original finding holds up. |
| Disabled | `disabled:` Tailwind variant used in 13 files; `[disabled]` binding on `ion-button` in 26 files. Reasonable but partial coverage across ~190 templates. |
| Pressed/active | `active:scale-95` pattern used in several of the audited files (e.g. `student-detail.page.html:57`) — present where checked, not verified app-wide. |

**Fix priority, revised:** the real, verified gap is **no retry affordance after a failed request**, not "no skeletons" — the toast tells the user what went wrong but then strands them on a blank page. Add a shared inline error-state component (icon + message + retry button) shown in place of the skeleton/content region when a request fails, reusing the same `show_loading`-style flag pattern already used for the loading skeletons.

### 12. [MINOR] Motion: durations set without a system
**Verified via grep:** `transition-all` 478×, `transition-colors` 141×, `transition-transform` 32×, `transition-opacity` 23× — the vast majority carry **no explicit duration**, so they silently use Tailwind's default 150ms. Of the ones that do specify a duration: `duration-300` ×50, `duration-1000` ×5, `duration-500` ×3 — no `ease-*` override anywhere (0 occurrences), so easing itself is at least consistently the Tailwind default.
**Fix:** not urgent (nothing is visibly broken), but worth a documented rule: micro-interactions (hover/active on buttons, icon color changes) = default 150ms; layout/reveal transitions = 300ms; anything animated for emphasis (streak badges, achievement unlocks) = the existing 500-1000ms range. Currently that mapping exists informally but isn't written down anywhere, so it'll drift.

### 13. [MINOR] Two coexisting modal systems
**File:** `src/global.scss` — `.custom-modal-main`/`.custom-modal` (lines 344-441) is a hand-built `position: fixed` overlay div, not an `ion-modal` at all, while `.profile-modal-class`/`.lineone-selectable-modal`/`.transparent-modal` (lines 857-1024) are proper `ion-modal` customizations via `--*` properties and `::part()`. The former predates the latter (no z-index coordination between the two systems is visible — if both were ever open simultaneously, stacking order is undefined) and appears to be legacy/superseded rather than actively extended (no new custom-modal-main usages found in the flagged screens).
**Fix:** confirm which pages still instantiate `.custom-modal-main` (not exhaustively traced in this pass) and migrate them to `ion-modal`, then delete the legacy block — removes ~100 lines of unmaintained override CSS.

### 15. [MINOR, found during the follow-up screenshot pass] Broken avatar path fires a 404 on every single page load, every role
**File:** `src/app/app.component.html:9-16`
```html
<img loading="lazy" [src]="user.image" onerror="this.onerror=null; this.src='assets/imgs/logo.png';" />
```
Live-verified with network capture across all 5 roles: `user.image` resolves to a bare relative path, `/uploads/default_avatar.png`, which 404s against the app's own origin — confirmed via `page.on('response')` capture (`http://localhost:PORT/uploads/default_avatar.png`, twice per load). It correctly falls back to the bundled logo via `onerror`, so **nothing is visibly broken** — this was never a rendering bug, just a console-only symptom. But it fires on every page load for every user, and the URL shape (`uploads/default_avatar.png`, no host) strongly suggests it's a leftover from the PHP→Node.js API migration this app is mid-flight through: a relative path that only ever resolved correctly against the old `basmapp.com/BasmaCP/` origin.
**Fix:** either have the backend return a full absolute URL for the default avatar (matching how real uploaded photos are already returned, e.g. the `cloudinary.com` URLs seen elsewhere in this codebase), or check `user.image` for a relative-looking value client-side and skip the request entirely, defaulting straight to `assets/imgs/logo.png`.

### 14. [POSITIVE — no action needed] Safe-area handling is genuinely better than the rest of the audit
**File:** `src/global.scss` lines 1026-1033, 233-234, 271, 425-426, 798-799
```scss
ion-footer { padding-bottom: max(env(safe-area-inset-bottom), 24px) !important; }
ion-content { --padding-bottom: max(env(safe-area-inset-bottom), 24px); }
```
Footers, the logout button, action sheets, and custom modal footers all correctly account for `env(safe-area-inset-bottom)` with sensible fallbacks. This is applied consistently enough (12 occurrences, all using the same `max(env(...), Npx)` pattern) that it reads as a deliberate, understood practice — worth preserving as-is when touching this file for the other fixes above, not worth "fixing."

---

## Summary — fix order by impact/effort

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | Color ramp RGB/shade/tint mismatch | Blocker | Trivial (1 file) |
| 2 | Global `font-weight:300` + wrong serif fallback | Major | Trivial (1 rule) |
| 9 | `text-slate-400` contrast failure (2.56:1) | Major | Small (token swap) |
| 5 | Touch targets <44px (global classes) | Major | Small (4 rules) |
| 3 | `ion-header` border !important fight | Major | Small (delete 1 rule + reconcile) |
| 4 | `mode="ios"`/`"md"` mixed | Major | Medium (config change + strip ~200 attrs) |
| 8 | 6 font-weights vs 3-weight system | Major | Medium (systematic reassignment) |
| 6 | 13 font sizes vs 5-6 target | Major | Large (231+ call sites) |
| 11 | Missing retry affordance after a failed request (loading skeletons themselves are fine — corrected finding) | Minor | Medium (1 reusable component, roll out) |
| 7 | 11 radius values | Minor | Large (376+ call sites) |
| 10 | `!important`/raw-hex override culture | Minor | Ongoing discipline, not a one-time fix |
| 12 | Transition duration inconsistency | Minor | Low priority, document only |
| 13 | Legacy custom-modal-main system | Minor | Medium (trace usages, migrate) |
| 15 | `/uploads/default_avatar.png` 404 on every page load | Minor | Trivial (1 binding or 1 backend field) |
| 14 | Safe-area handling | — | None (already good) |

## Addendum — full 5-role screenshot pass (follow-up)

Ran a fresh Playwright crawl through every side-menu item for all 5 roles (school admin, admin, moderator, teacher, student — 64 screenshots total) against the current build, plus targeted captures of loading/empty/error states. Results:

- **No visibly broken or blank pages found** across any of the 5 roles' full menu surface — every genuine navigation target (as opposed to the known external-link menu items, which correctly no-op the SPA route) rendered real content with real data.
- **Loading state — corrected.** See finding #11: `list-student` (and 23 other files) do have a working skeleton, contradicting this document's first draft. Live-verified by throttling `getStudents` 4s.
- **Error state — confirmed as documented.** Aborting a network request produces a well-formed, correctly-translated toast (`تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.`) but leaves the page body blank with no retry button, confirming the real half of finding #11.
- **Empty state — confirmed well-executed.** `manage-student`'s search-with-no-results state (`لا يوجد طلاب لعرضهم`, dashed card + icon) is a genuinely good empty state, not a gap. (An earlier attempt to trigger this via Playwright's `.fill()` showed a stale unfiltered list — that was a testing artifact of `.fill()` not firing the page's `(keyup)`-driven search, not a real app bug; typing character-by-character produced the correct empty state.)
- **New finding #15** (above): `/uploads/default_avatar.png` 404s on every page load, every role — gracefully handled visually, but a real, fixable migration leftover.

No other new issues surfaced in the fresh pass beyond what static analysis had already found.

No code was changed as part of this audit.
