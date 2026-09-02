# QA Log

Terse, dated entries from the recurring QA/craft-audit loop. Read cold by a
human catching up — not by the next run of this loop, which has no memory
and re-audits from scratch every time.

---

## 2026-09-02 — first run of this loop

**Starting point:** repo was mid-build by another session ("Intro sequence,
stats, and 3D exam-light"). Last commit (`b9985ef`, bringing the craft
reference docs into the repo) was ~2h old at the start of this run — clear
of the 45-minute collision window, so this run audited *and* pushed fixes.

**What I checked:**
- `npm install`, `npm run build` (tsc + vite), `npm run lint` (oxlint) — all
  clean, no errors, only 6 pre-existing `only-export-components` fast-refresh
  warnings (unrelated, harmless).
- Read every section against `REBUILD_BRIEF.md`: intro sequence timing/easing
  (`intro-sequence.tsx`, `intro.tsx`), nav lockup resolve (`site-nav.tsx`),
  hero stats ("80+", correct per brief §5) and the 3D exam-light object
  (`hero-scene.tsx`), pricing numbers ($3,000–$10,000 / 50% / 50% / <24h,
  `pricing.tsx` + `i18n.tsx`), portfolio anonymization (`portfolio-data.ts` —
  clean, no real client names, all 7 image pairs present in
  `public/portfolio/`), the section-transition reveal/lock motif
  (`reveal.tsx`), RTL scoping across `site-nav`, `hero`, `scroll-pulse-spine`,
  `reveal`.
- **Actually ran the built site in a browser** (Playwright against the
  pre-installed Chromium, not just read the code) — screenshotted hero,
  portfolio, pricing, process, contact in both a fresh load and after
  interaction. This caught two real bugs that were invisible from source:

**Fixed and pushed (commit `dee168d`):**
1. **Portfolio hover-reveal was dead on every desktop visit.**
   `usePointerFine()` started at `false` and flipped to `true` in an effect;
   `ScreenWipe` (portfolio.tsx) gates its Motion `initial` prop on
   `!pointerFine`, so `initial` fired once against the momentarily-false
   value on every load and wrote a permanent inline `clip-path` style onto
   the overlay node. An inline style outranks the CSS
   `group-hover:[clip-path:...]` class no matter what, so the "static wipes
   away to reveal the real screenshot" hover interaction — a core piece of
   the portfolio's craft — silently never ran, for any desktop user, ever.
   Confirmed via `getComputedStyle` + the `style` attribute before/after a
   real hover event, and via screenshot (cards stayed as flat noise texture
   even mid-hover). Fixed by resolving `usePointerFine` synchronously in the
   `useState` initializer, matching the exact pattern
   `useShouldRender3D`/`useSceneTier` already use in this repo for this same
   class of bug (their own comments call it out). Re-verified: inline style
   is gone, hover reveal now animates and shows the real screenshot.
2. **Cursor's "View" label could get stuck on screen after scrolling.**
   `cursor.tsx` only recomputed hover/label state on `pointermove`. Lenis
   animates scroll under a stationary pointer with no pointermove firing, so
   scrolling away from a hovered portfolio card left the "View" chip
   stranded at a fixed screen position over unrelated content (reproduced:
   scrolled from Portfolio to Pricing, chip stayed floating over the pricing
   numbers). Fixed by also recomputing hover state via `elementFromPoint` on
   `scroll`. Re-verified via screenshot: chip clears correctly after scroll.
3. Minor: fixed a stale code comment in `portfolio.tsx` claiming "fifty real
   rescues" against an actual 7-item grid (no functional effect, just wrong).

**Flagged, not fixed (need Aymean, not a code fix):**
- `contact.tsx`'s `EMAIL` constant is `contact@zaylogear.com` — domain
  doesn't match the "Zaylo Agency" brand name the site was renamed to
  (`e55947f`). Likely a leftover from a prior brand name. Did not touch it:
  I don't know the actual correct domain/inbox, and guessing one would be
  fabricating contact info on a page whose whole pitch is credibility. Needs
  Aymean to confirm the real address.
- `docs/reference/swipe_file.md` references 119 screenshot images
  (`screenshots/<niche>/...`) that do not exist anywhere in this repo — only
  the descriptive text made it into the copy from `e55947f`/`b9985ef`, not
  the actual image files. REBUILD_BRIEF.md §8 calls this file "the actual
  visual bar, not a verbal description of one" — right now it's only the
  verbal description, which undercuts exactly what it's for. I audited craft
  by actually screenshotting the live site instead (see above), which is a
  reasonable substitute but isn't the same as comparing side-by-side against
  the Obys/Active Theory references. If the real screenshots exist on
  Aymean's machine, worth adding them to the repo (or an accessible location)
  so future sessions get the real comparison.
- Section-transition motif (brief §2/§7 item 2) is already built and in use
  (`reveal.tsx`'s lock-glow + directional reveal, used across Process,
  Pricing, Portfolio) — the brief flagged this as needing a quick yes/no from
  Aymean before building, and it looks like an earlier session went ahead
  and built it anyway. Not reverting a working, well-reasoned implementation
  on my own judgment, but flagging that this specific brief checkbox was
  never actually ticked off by Aymean, in case that confirmation still
  matters to him.

**Craft-bar honesty check:** with the exam-light hero, the piece-lock intro,
the reveal/lock-glow motif reused across sections, the custom cursor, grain
overlay, magnetic buttons, and (as of this run) an actually-working
hover-reveal portfolio, this reads as genuinely ambitious, not
generic-agency-tier. I can't do a real side-by-side against the Obys/Active
Theory references because those screenshots aren't in the repo (see above) —
so treat this as an honest visual impression from screenshots of the live
build, not a rigorous comparison. Two things I'd still want a second pass on
before calling it done: (1) the hero 3D scene's ~960KB lazy chunk means the
exam-light doesn't actually appear on screen until several seconds after
load on a throttled connection — already a known tradeoff per
`product_knowledge.md` ("speed is a separate, later problem"), just noting
it's still unaddressed; (2) I only checked EN+AR at 1440px desktop and one
mobile viewport (390px) for the hero — didn't do a full RTL+mobile pass on
every section this run.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section (still deliberately empty — correct, not a
gap).

**STATUS: NOT YET READY TO DEPLOY.** About section still needs Aymean's real
copy (brief item, not a bug). Contact email domain needs confirming. Swipe
file images are missing so the visual craft-bar comparison is still
unverified against the actual references. Everything else audited this pass
held up.

---

## 2026-09-02 — second run, no change

`git pull` — already up to date. HEAD (`89493ce`) is the exact commit that
wrote the entry above; the other session ("Intro sequence, stats, and 3D
exam-light") hasn't pushed anything new since. Nothing new to audit against
the brief, so didn't re-walk every section — instead re-verified the build
is still healthy: `npm install`, `npm run build` (tsc + vite — clean), and
`npm run lint` (oxlint — same 6 pre-existing `only-export-components`
warnings as last run, no new ones). No regressions.

All open items from the previous entry are unchanged and still open: About
section copy (waiting on Aymean, not a gap), contact email domain
(`contact@zaylogear.com` vs. "Zaylo Agency" brand — needs Aymean to confirm),
and `docs/reference/swipe_file.md`'s missing screenshot files (verbal
description only, no actual images to compare against).

**STATUS: unchanged — NOT YET READY TO DEPLOY**, same reasons as above.

---

## 2026-09-02 — third run, real bug fixed

`git pull` — up to date. Newest commit (`4082e82`, a prior no-change log
entry from this same loop) was ~2h old at start — clear of the 45-minute
collision window, so this run audited *and* pushed. No new commits from the
other build session since `dee168d` (~4h old); nothing new to audit against
the brief's confirmed spec, so this pass went deeper on runtime behavior
instead of re-reading source against the brief line by line.

**Method:** `npm install` + `npm run build` + `npm run lint` — clean, same 6
pre-existing `only-export-components` warnings, no new ones. Then installed
Playwright locally (`npm install --no-save playwright`, using the
pre-installed Chromium at `/opt/pw-browsers/chromium`; not added to
`package.json`/lockfile — reverted the incidental lockfile diff from the
unrelated `npm install` before touching anything) to actually load the site
and watch it, rather than re-asserting the previous entries' impressions
unverified. Screenshotted `npm run dev` and a production `vite preview`
build across AR/EN and desktop/mobile (real device emulation — `devices['iPhone 13']`
via `newContext`, not just a resized desktop window, since a plain resize
still reports `pointer: fine` and silently exercises the wrong code path).

**Checked and held up:**
- Portfolio hover/touch-reveal (`portfolio.tsx`'s `ScreenWipe`): confirmed
  working correctly on real mobile emulation. First pass with a plain
  390×844 resize (no touch emulation) made every card look permanently
  stuck behind its static overlay — that turned out to be a false alarm
  caused by the test itself (a resized desktop context still reports
  `pointer: fine`, so `usePointerFine()` correctly took the hover-reveal
  branch, and a scripted headless run never hovers). Re-tested with real
  touch/coarse-pointer emulation and the scroll-triggered reveal fires
  correctly. Not a bug — flagging the false trail so a future run doesn't
  waste time rediscovering it via the same shortcut.
- RTL layout: nav, hero, stat rail all correctly mirror in Arabic (default
  locale); `scroll-pulse-spine.tsx` explicitly branches on `dir` and the rest
  of the audited surface uses centered/JS-tracked positioning that doesn't
  need to.
- No console errors on load in either language, either viewport.

**Found and fixed:** the hero's stat counter (`useCountUp` in
`use-count-up.ts`) visibly breaks when switching language mid-visit.
`reveal.tsx` deliberately remounts every `RevealGroup`/`RevealItem` on the
page via `key={dir}` when the language toggles (documented, intentional —
needed so RTL/LTR entry directions replay correctly, and already accepted
as a tradeoff: "blocks currently on screen replay their reveal"). But that
means every section's entrance animations fire at once on a single click,
and the stat counter's own `setInterval`-paced count-up — designed to take
~2s — was measured taking **~4.5s** wall-clock under that contention,
because it counted *interval firings* (8 ticks × 240ms) rather than real
elapsed time: a delayed firing just pushed the whole animation later instead
of catching up. Confirmed with precise instrumented timing (not a visual
guess) before and after. Fixed by deriving progress from
`performance.now()` elapsed time inside each tick instead of an
incrementing step counter, so a late tick jumps straight to the value it
should already be at. Re-measured after the fix on the rebuilt production
bundle, two runs: settles in ~1.4–1.5s now, matching the intended ~2s
design regardless of concurrent reveal replay. The `key={dir}` remount
itself is untouched — that tradeoff is deliberate and reasonable, this was
specifically about the counter degrading further than it needed to under
it. Single-file change (`src/lib/use-count-up.ts`), no change to the
reveal/remount architecture, no change to the confirmed "80+" figure.

**New finding, not fixed — flagging for a real design call:** the hero's
signature exam-light 3D object does not appear on screen until **~7
seconds** after page load, measured on a `vite preview` production build
served from localhost (i.e. not a "slow connection" artifact — this
reproduces with an effectively unthrottled network). Network trace: the
`hero-scene` chunk's fetch doesn't even *start* until ~6994ms in. Root
cause, read from `hero.tsx`'s own comments: this is intentional, not
accidental — the 3D chunk's dynamic import is deliberately deferred until
`SCENE_MOUNT_DELAY` (1.4s) after the intro overlay lifts, specifically to
avoid the chunk's parse cost stealing the main thread from the headline's
own reveal animation (a real, previously-measured contention bug per that
file's history). The compounding factor is that the intro sequence itself
(logo assemble → glow → hold → burst) takes ~5.5s before it lifts at all,
so 5.5s + 1.4s ≈ the observed 7s. Previous entries in this log described
the missing-hero-object gap as a "throttled connection" concern; that
undersells it — it's structural, not networking, and happens on every
visit regardless of connection speed. I did not touch this: the intro's own
pacing (`intro-sequence.tsx`'s `ASSEMBLE_DURATION`/`GLOW_DURATION`/
`HOLD_DURATION`/etc.) and the hero's scene-mount sequencing have both been
iteratively tuned across several prior commits with real reasoning and real
measurements already in them (see `hero.tsx`'s own comments on the specific
contention bug `SCENE_MOUNT_DELAY` was added to fix). Shortening either
without being able to re-verify the contention tradeoff properly risks
reintroducing a bug that was already found and fixed once. This is a
genuine craft-bar question — is a ~7s wait for the site's own signature
visual acceptable for a landing page whose whole pitch is "judge us by the
pixels" — that needs a conscious call from Aymean or a session with time to
properly profile the contention, not a QA-loop guess.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section (still deliberately empty).

**Still open from prior entries, unchanged:** contact email domain
(`contact@zaylogear.com` vs. "Zaylo Agency" brand), `swipe_file.md`'s
missing screenshot files.

**STATUS: NOT YET READY TO DEPLOY.** One real bug fixed this run (language-
toggle counter jank). One new, real craft-bar concern raised with hard data
(7s to first paint of the hero's signature visual) that needs a design
decision, not another audit pass. Plus the carried-over open items above.

---

## 2026-09-02 — fourth run, section-order spec gap fixed

`git pull` — up to date. Newest commit (`e83f70f`, the counter fix above) was
~1h35m old at start — clear of the 45-minute collision window, so audited
and pushed. The other build session ("Intro sequence, stats, and 3D
exam-light") has not pushed since `f947cce` (2026-08-28, several days ago
now) — everything since has been this QA loop's own commits. No new builder
activity to audit against; went deeper on a full section-by-section diff
against `REBUILD_BRIEF.md` instead of re-checking runtime behavior already
verified in prior entries.

**Method:** `npm install`, `npm run build` (tsc + vite — clean), `npm run
lint` (oxlint — same 6 pre-existing `only-export-components` warnings, no
new ones). Then `npm install --no-save playwright` (reverted the incidental
`package-lock.json` diff before touching anything) and drove a production
`vite preview` build with real Chromium — desktop EN/AR at 1440px and mobile
AR on `devices['iPhone 13']` real touch emulation, screenshotting every
section and watching for console/page errors. Zero console errors in any
of the three passes.

**Checked and held up:** hero copy/stats/pricing numbers/portfolio
anonymization all still correct; portfolio cards' pre-hover "static noise"
look flat/dark in a static screenshot — verified this is the intended
`card-static` CSS texture and not a broken-image regression (`naturalWidth`/
`naturalHeight`/`complete` all confirmed via `page.evaluate` on all 7
portfolio images — they load fine, the flat look is by design pre-hover).

**Found and fixed:** `REBUILD_BRIEF.md` §3 confirms the section order as
Hero → About → **Process/Services** → **Work/Portfolio** → Pricing →
Contact. `App.tsx` actually rendered `<Portfolio />` before `<Process />` —
the reverse of the confirmed order. This is not one of the brief's two
listed open items (About copy, section-transition motif confirmation) —
order is confirmed spec. Traced via `git log --follow -p` on `App.tsx`: this
ordering predates the rebuild entirely (present in the original `ZayloGear`
site commit `4156544`) and was simply carried forward unexamined through
every rebuild commit — three prior QA-loop passes checked section
*content* against the brief but never diffed section *order*. Fixed by
swapping `<Process />` and `<Portfolio />` in `App.tsx`, and swapping the
corresponding nav links in `site-nav.tsx` (`work`/`process` buttons) so the
top nav still reads left-to-right (or right-to-left in AR) in the same
order the sections actually appear — nav order and section order were
previously self-consistent with each other but both wrong relative to the
brief. Re-verified after the fix: `npm run build`/`lint` clean, and a fresh
Playwright pass confirms `document.querySelectorAll('main > section')`
now yields `top, about, process, work, pricing, contact` and the Arabic nav
button labels (طريقة العمل / أعمالنا / الأسعار / تواصل — Process / Work /
Pricing / Contact) appear in that same corrected order, no console errors.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section (still deliberately empty).

**Still open from prior entries, unchanged:** contact email domain
(`contact@zaylogear.com` vs. "Zaylo Agency" brand — needs Aymean),
`swipe_file.md`'s missing screenshot files (verbal description only), the
hero's ~7s structural delay before its signature 3D object appears (needs a
design call, not a QA-loop guess).

**STATUS: NOT YET READY TO DEPLOY.** One real spec-conformance bug fixed
this run (section order didn't match the brief). All previously-flagged
open items above are unchanged and still open — none are new regressions,
all still need Aymean's input rather than a code fix.

---

## 2026-09-02 — Aymean's decisions on the three open items above

Not a loop run — Aymean answered the three flagged items directly in chat:

1. **Contact email confirmed correct.** `contact@zaylogear.com` stays as-is
   despite the displayed brand being "Zaylo Agency" — domain matches
   [[reference_zaylo_legal_identity]] (brand dropped "Gear," domain didn't).
   **Close this item, it was never actually a bug.**
2. **The ~7s delay before the exam-light hero appears is NOT acceptable.**
   Aymean's exact words: "that is a lot man, people can't see it once they
   load." This overrides the previous entry's "needs a design call, not a
   QA-loop guess" — the call has been made. **Next run: this is the top
   priority.** Get the hero's signature 3D object visible dramatically
   sooner. The previous entry has the full diagnosis (5.5s intro +
   `SCENE_MOUNT_DELAY` 1.4s + chunk fetch not starting until ~6994ms) and
   flags a known past contention bug (`SCENE_MOUNT_DELAY` was added to stop
   the 3D chunk's parse cost from stealing the main thread from the headline
   reveal) — re-verify that tradeoff properly rather than blindly deleting
   the delay, but the target is a real fix, not another flag. Options worth
   evaluating: shortening the intro sequence itself, starting the chunk
   fetch earlier (prefetch during the intro instead of after it lifts),
   showing a lower-cost version of the object immediately while the full
   scene loads, or re-profiling whether the original contention bug still
   reproduces with the current bundle before assuming the delay is still
   needed at its current length.
3. **The real swipe_file.md screenshots exist and are now in the repo.**
   They lived locally at `leadgen-agency/benchmark/screenshots/creative-craft/`
   (never in any git repo) — all 9 sites confirmed present (18 files,
   desktop+mobile, ~13MB), copied into
   `docs/reference/screenshots/creative-craft/` and pushed. **The "visual
   craft-bar comparison is unverified" caveat from every prior entry is
   now closed** — future runs can and should actually look at these images
   (`Read` supports image files) and compare the live build against them
   directly, not work from swipe_file.md's text descriptions alone.

---

## 2026-09-02 — fifth run, audit-only (collision window)

`git pull` — up to date at `2dfee8b` (Aymean's own commit resolving the
three prior open items — not the other builder session). That commit was
~34 minutes old at the start of this run and still ~40 minutes old by the
time the audit below was done, under the 45-minute threshold both times —
per standing instructions, **audit and record findings only, no pushes
this run**, even though one of the findings below (the hero delay) is now
flagged by Aymean himself as top priority. Held off anyway: the rule is
about not colliding with in-flight work generically, not about who
authored the most recent commit.

**Method:** `npm install`, `npm run build` (tsc + vite — clean, same
486KB/1017KB main/hero-scene chunk split as before), `npm run lint`
(oxlint — same 6 pre-existing `only-export-components` warnings, no new
ones). Spec re-check: section order (`Hero → About → Process → Portfolio →
Pricing → Contact` in `App.tsx`) still matches the brief, pricing copy
still reads `$3,000 - $10,000` / `50% to start` / `50% before delivery` /
"Live in under 24h" in both `i18n.tsx` locales, `about.tsx` is still the
deliberate content-empty scaffold, no names in `portfolio-data.ts` beyond
its own anti-fabrication comments. No regressions found in any of these.

**Re-verified the top-priority item (hero object invisible for ~7s):**
installed Playwright temporarily (`npm install --no-save playwright`,
reverted the `package-lock.json` diff after, nothing committed), built +
served a production `vite preview`, and drove real Chromium against it.
First attempt reused one browser context across three timed reloads and
looked like the object was already visible by 5.3s — which would have
meant the bug was gone. That was wrong: reusing the context meant
`sessionStorage`'s `INTRO_FLAG` (see `intro.tsx`) was already set from the
first reload, so the second and third reloads skipped the intro replay
entirely and `contentReady` flipped almost immediately instead of at the
intro's real ~5s resolve beat — not a representative first-visit load.
Redid it correctly with a **fresh incognito browser context per
measurement** (no shared storage) and logged the actual `hero-scene` chunk
request timestamp via `page.on('request')`:

- Screenshots at 3.0s and 5.3s: hero section shows only headline/copy/
  stats, zero trace of the exam-light object — plain dark background.
- `hero-scene` chunk's first network request measured at **6860–7014ms**
  after `load`, across three independent fresh-context loads — matching
  the prior entry's ~6994ms almost exactly. This is not a fluke or a
  network artifact; it's `contentReady` (~5.0s, the intro's `RESOLVE_AT`)
  plus `SCENE_MOUNT_DELAY` (1.4s) in `hero.tsx`, deterministic and
  independent of connection speed.

**Confirmed: still unfixed, still real, still the top priority per
Aymean's standing decision from the previous entry.** Did not fix it this
run (collision window). Concrete direction for whichever run is next clear
to push: the contention `SCENE_MOUNT_DELAY` guards against is the ~960KB
chunk's *parse/execute* cost stealing the main thread from the headline's
reveal — not its *network fetch*. Those can be decoupled: warm the
`hero-scene` chunk's network fetch during the ~5s intro (e.g. a
`modulepreload` hint or an early `import()` call whose result is just held,
not rendered) so the bytes are already on the client by the time
`SCENE_MOUNT_DELAY` elapses, while still not mounting/executing the
component until after the headline reveal as today. That should collapse
the visible gap to roughly `SCENE_MOUNT_DELAY` + parse time instead of
`SCENE_MOUNT_DELAY` + full fetch + parse. Re-verify the original contention
bug still reproduces (per `hero.tsx`'s own comments) before assuming this
is safe — that's the one real risk in this approach the next run needs to
actually measure, not assume.

**New, unconfirmed craft-bar flag:** compared a screenshot of the fully-
resolved hero object (dark disc exam-light + articulated arm, teal glow)
against `docs/reference/screenshots/creative-craft/global/active-theory-
desktop.png`. The reference has a particle field, iridescent/chromatic
material on the ring, and visible atmospheric depth; our object reads
flat and plain by comparison — no particles, no bloom/depth, a single flat
glow color. Flagging this honestly rather than assuming it's fine, but a
static screenshot can't judge the shader's live micro-motion or how it
reads while scrolling/rotating, so this is a flag for a future run with
time to actually watch it move, not a confirmed verdict.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section (still deliberately empty).

**Still open from prior entries, unchanged:** `swipe_file.md`'s prose vs.
the now-real screenshots (spot-checked one this run, matches).

**STATUS: NOT YET READY TO DEPLOY.** No code changes this run by design
(collision window). Confirmed the hero-delay bug is real, reproducible,
and still the top priority — with a concrete, testable direction for the
fix — plus one new unconfirmed craft-bar flag on the resolved object's
visual richness versus the Active Theory reference.
