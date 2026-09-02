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

---

## 2026-09-02 — sixth run, real fix pushed + a bigger finding underneath it

`git pull` — up to date at `bd9b425` (the fifth run's own audit-only
entry), and it was ~2 hours old at the start of this run — well clear of
the 45-minute collision window, so this run was free to push directly.

**Fix pushed (`29bb38c`):** implemented the fifth run's own recommended
direction — an early, unconditional `import('@/components/hero-scene')`
fired the instant `Hero` mounts (during the intro overlay, not gated on
`contentReady`), separate from the `lazy()` factory that actually renders
it. Dynamic imports are deduped by resolved specifier, so this doesn't
double-fetch or double-evaluate the module; it just moves *when* the
fetch starts, not *when* the component mounts. `SCENE_MOUNT_DELAY` is
untouched.

**Measured, not assumed — full method:** `npm run build` (clean) +
`vite preview`, driven with Playwright (Chromium is preinstalled in this
environment at `/opt/pw-browsers/chromium`) via a CDP session with
`Network.emulateNetworkConditions` set to Chrome DevTools' "Fast 4G"
profile (170ms RTT, 9Mbps). Fresh incognito context per run, three runs
each, comparing this commit against the immediately-prior commit
(`bd9b425`) checked out via `git stash`:

- Baseline: `hero-scene` chunk requested ~7.14s in, fetch completes
  ~7.58s, `<canvas>` present in the hero section ~7.65-7.70s.
- Fixed: chunk requested ~0.7s in (during the intro), fetch completes
  ~1.8s — fully inside the ~5s intro window — `<canvas>` present
  ~7.44-7.46s.

**The fix is real and worth keeping, but it is not the whole bug.** The
gap it closes on this connection profile is only ~200ms, because
`<canvas>`-present time is barely gated by fetch time at all — on a fast
loopback/CDN fetch, the chunk was never the bottleneck to begin with. The
actual dominant cost, found by adding a `PerformanceObserver` for
`'longtask'` entries across the full page-load timeline: **a single
~1.7s main-thread-blocking long task starting at ~7.6s, present
identically in both the baseline and the fixed build** (1689ms vs
1739ms, starting within 15ms of each other). This fix doesn't touch it
either way — no regression, but no improvement on the real bottleneck.

Reading `hero-scene.tsx` to explain that task rather than just reporting
the number: `<Environment resolution={...} frames={1}>` does a real
cube-render pass, and the scene has ~10+ distinct materials (multiple
`meshStandardMaterial`s, a custom `ShaderMaterial` for the beam, `Bloom`
via `EffectComposer`/`postprocessing`) that all need their shader
programs compiled on first render. `onReady` fires on `Canvas`'s
`onCreated`, but the actual pixels — and therefore the object being
*visible*, which is what Aymean flagged — depend on that first frame
actually completing, and shader compilation is exactly the kind of
synchronous, unavoidably-main-thread work that would produce a task like
this. That is a plausible, evidence-backed explanation, not a confirmed
root cause — I did not instrument WebGL calls directly to prove it.

**One important caveat on the number itself:** this was measured in a
headless/sandboxed Chromium with no confirmed real GPU backing (likely
SwiftShader software rendering). Shader compilation on a software
rasterizer can be meaningfully slower than on real client hardware, so
1.7s may be an inflated worst case rather than what a real visitor's
phone or laptop actually experiences. The next run (or a run with access
to a machine with real GPU acceleration) should re-measure this same
`longtask` profile before treating 1.7s as the real number to design
against — but even discounted, a single uninterrupted long task at the
exact moment the object is supposed to become visible is a legitimate
concern regardless of its exact magnitude.

**Concrete next step for whoever picks this up:** profile whether the
long task is actually shader compilation (e.g. wrap the `Canvas`'s first
render in `performance.mark`/`measure` calls around specific stages, or
use Chrome's Performance panel/tracing instead of just `PerformanceObserver`
if a session with a real browser UI is available) and, if confirmed,
look at trimming first-frame shader count (fewer distinct materials,
simpler `Environment` resolution, or gating `Bloom`/`EffectComposer` in
behind a `requestIdleCallback`/second-frame mount so the *headline-visible*
frame doesn't have to wait on it) rather than reflexively shortening
`SCENE_MOUNT_DELAY` — the fifth run's contention bug (chunk parse
stealing the headline's timer) and this long task are two different
costs that happen to land in the same few hundred milliseconds, and only
one of them is what this fix addressed.

**Spec re-check, no regressions:** section order in `App.tsx` (`Hero →
About → Process → Portfolio → Pricing → Contact`) still matches the
brief; `i18n.tsx` still reads `$3,000 - $10,000` / `50% to start` / `50%
before delivery` / "Live in under 24h" in both locales; `about.tsx` is
still the deliberate content-empty scaffold; `portfolio-data.ts` has no
real client names. `npm run lint` — same 6 pre-existing
`only-export-components` warnings, no new ones.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section.

**Still open:** the ~1.7s shader/WebGL-compile long task above (new,
top priority — the actual reason the object isn't visible sooner, more
so than the fetch timing the last two runs focused on); the resolved
object's visual richness vs. the Active Theory reference (flagged fifth
run, still unconfirmed either way — needs a run with time to watch it
move, not another static comparison).

**STATUS: NOT YET READY TO DEPLOY.** Real fix pushed and measured this
run (chunk prefetch), but it turned out not to be the dominant cost —
that's the long task above, still open, with a concrete next step but no
fix attempted yet.

---

## 2026-09-02 — seventh run, root-caused and partially fixed the long task

`git pull` — up to date at `ab2ffeb` (the sixth run's own QA-log entry
above), ~1h51m old at start — clear of the collision window, audited and
pushed.

**Method:** `npm install`, `npm run build` (clean), `npm run lint` (same 6
pre-existing warnings, no new ones). This run picked up the sixth run's
own "concrete next step" — profile whether the ~1.7s long task is really
shader compilation — using `Profiler.start`/`Profiler.stop` over CDP
(Playwright, pre-installed Chromium) to get an actual CPU profile of a
fresh production load, not just `PerformanceObserver` longtask entries.

**Root cause, confirmed at the function level:** aggregating self-time
by function across the profile, the single hottest JS function by a wide
margin (~11% of all samples in one run) was three.js's `checkLinkStatus`
(minified to `function C` in the built chunk, traced back to
`WebGLProgram.js` via the built file's source). That function is gated on
`renderer.debug.checkShaderErrors`, which **defaults to `true` even in
production builds** — a known three.js footgun. When true, every
`linkProgram()` call is immediately followed by
`gl.getProgramParameter(program, gl.LINK_STATUS)`, which is a synchronous
GPU sync point: it blocks the JS thread until the driver has actually
finished compiling+linking that program, rather than letting compilation
happen off-thread. This scene compiles 10+ distinct programs on first
render (the exam light's several `meshStandardMaterial`s, the beam's
custom `ShaderMaterial`, `Environment`'s lightformers, `Bloom`'s
`EffectComposer` passes), so the cost lands as one contiguous stall right
when the object is supposed to become visible.

**Fixed and pushed (`1f69861`):** `gl.debug.checkShaderErrors = false` in
`HeroScene`'s `Canvas` `onCreated`, gated on `import.meta.env.PROD` so
dev keeps real-time shader error reporting (only production skips the
check — by then errors should already be caught). Zero visual/behavioral
change if shaders compile successfully, which they do (confirmed via
screenshot after the fix — object renders identically).

**Measured, not assumed:** re-profiled after the fix — `checkLinkStatus`
samples dropped from 7823 (~11%) to 32 (~0.1%) in matched profiler runs,
essentially eliminated. For an end-to-end number without profiler
overhead skewing things, ran 3 fresh-incognito-context loads on the
unfixed build and 6 on the fixed build (`PerformanceObserver` longtask
entries only, `vite preview` production build, local loopback): baseline
averaged **~2.97s** of post-intro main-thread blocking, fixed averaged
**~1.46s** — roughly a 50% cut. High run-to-run variance in both
(140ms-3.3s) reflects this sandboxed environment's noisy/software-rendered
GPU, consistent with the caveat in run six's entry — but the fixed build
was lower on every single comparable pairing, and the function-level
attribution removes any doubt about mechanism.

**This is not a full fix, and I'm saying so plainly:** re-profiling the
fixed build, the new hottest function is three.js's `WebGLUniforms`
constructor — it calls `gl.getProgramParameter(program,
gl.ACTIVE_UNIFORMS)` and `gl.getUniformLocation()` for every uniform
right after linking, which is core rendering setup (building the
material's uniform map) and can't be disabled by a flag. That call can
also stall on an unfinished link, so some real GPU-driver-bound blocking
remains and is inherent to compiling this many programs synchronously on
first frame. Run six's other suggestion — trimming first-frame shader
count itself (fewer distinct materials, simpler `Environment` resolution,
or gating `Bloom`/`EffectComposer` behind a second-frame mount) — is
still open and would address this remaining cost; I did not attempt it
this run, both to keep this fix isolated/easy to verify and because it
touches the scene's actual visual composition, which deserves its own
pass rather than being bundled with a one-line production flag flip.

**Spec re-check, no regressions:** section order, pricing copy, About
section scaffold, and `portfolio-data.ts` anonymization all re-checked
against `App.tsx`/`i18n.tsx`/`about.tsx`/`portfolio-data.ts` directly —
unchanged from prior entries.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section.

**Still open:** trimming first-frame shader/material count to close the
remaining ~1.5s of GPU-driver-bound blocking (concrete direction above);
the resolved object's visual richness vs. the Active Theory reference
(flagged fifth run, still unconfirmed — needs a run with time to watch it
move).

**STATUS: NOT YET READY TO DEPLOY.** Real fix pushed and measured this
run, root-causing the long task the previous run only flagged — cuts
post-intro main-thread blocking roughly in half. The object still isn't
instantly visible; the remaining cost is now well-understood (inherent
WebGL program setup for 10+ materials, not a fixable JS-side stall) and
has a concrete next step (reduce material/shader count) for whichever run
picks it up next.

---

## 2026-09-02 — eighth run, closed off two dead-end levers, no code pushed

`git pull` — up to date at `0d36781` (the seventh run's own log entry),
~1h46m old at start — clear of the 45-minute collision window. The other
build session ("Intro sequence, stats, and 3D exam-light") still hasn't
pushed since `f947cce` (2026-08-28) — everything on `master` since then is
this QA loop's own work.

**Method:** `npm install`, `npm run build` (tsc + vite — clean, same
486KB/1017KB chunk split), `npm run lint` (oxlint — same 6 pre-existing
`only-export-components` warnings, no new ones). Re-checked spec
conformance directly against source: section order in `App.tsx` (`Hero →
About → Process → Portfolio → Pricing → Contact`, matches brief),
`i18n.tsx` pricing copy in both locales (`$3,000 - $10,000` / `50% to
start` / `50% before delivery` / `Live in under 24h`), `portfolio-data.ts`
labels (all 7 entries anonymized, no real client names). No regressions.
`npm install --no-save playwright` (reverted the incidental
`package-lock.json` `libc`-field diff before touching anything, same false
alarm every prior run has hit), drove a production `vite preview` build
with real Chromium — zero console errors on a fresh load in both AR
(default) and EN.

**Went deep on the still-open hero-delay item instead of re-treading old
ground.** The last two runs each shipped a real, measured fix (chunk
prefetch, then the `checkShaderErrors` production flag) but both aimed at
secondary costs. This run measured the actual current end-to-end number
and worked out exactly how much runway is left on each remaining lever,
rather than reaching for another fix blind.

**Current real number, freshly measured:** fresh-incognito-context loads
of the production build, screenshotting at fixed intervals — the exam
light is still not visible at 7.0s (identical to 6.5s, plain background)
and is clearly visible by 7.5s. So after both prior fixes, the object
still isn't on screen until roughly the same ~7-7.5s window the original
complaint was about. That's not a regression — the two prior fixes were
real and independently verified — it's that neither one touched the
dominant cost.

**Lever 1 — `SCENE_MOUNT_DELAY`: confirmed there is no free room left.**
Read `hero.tsx` and `intro-sequence.tsx` together and did the arithmetic
the code's own comments set up but don't spell out end-to-end:
`contentReady` fires at `RESOLVE_AT + FADE_OUT` = 5.0s + 0.55s = **5.55s**
(assemble 2.25s + glow 0.65s + hold 1.15s + burst-and-fade overlap
accounts for the rest). The headline's own reveal (`HEADLINE_DELAY` 0.3s,
then `h1a`'s 0.9s and `h1b`'s 0.13s-delayed 0.9s) finishes at
`contentReady + 1.33s` = **6.88s**. `SCENE_MOUNT_DELAY` (1.4s) mounts the
scene at `contentReady + 1.4s` = **6.95s** — only ~70ms after the headline
reveal actually finishes. That 70ms margin is exactly what the file's own
comment describes ("deferred past the headline's own reveal... plus a
little slack") — it is already tuned to the minimum needed to avoid
reintroducing the exact main-thread-contention bug `SCENE_MOUNT_DELAY` was
added to fix. There is no room to shave here without also shortening the
headline's reveal animation. Closing this off as a lever.

**Lever 2 — first-frame shader/material count: measured directly, real
but modest.** Temporarily instrumented `HeroScene`'s `onCreated` to log
`gl.info.programs.length` after first render (reverted before finishing —
zero diff left in the working tree), profiled against the running
production build: **14 distinct WebGL programs compiled on first frame.**
Breaking down the cache keys: ~5 are `MeshStandardMaterial` variants (the
10 actual `meshStandardMaterial` instances in the scene — dish, inner
cone, rim, yoke, two arm segments, two joints, post, base — already
dedupe down to 5 by three.js's own program cache, contrary to what "10+
materials" in prior entries implied), ~3 are `MeshBasicMaterial` variants
(emitter, glow), ~3-4 are fixed `Environment`/PMREM-generation overhead
(the `GGX_SAMPLES`-tagged keys — this cost exists any time `<Environment>`
is used at all, independent of scene complexity), 2 are `Bloom`'s
`EffectComposer` passes, and the remainder is the beam's custom
`ShaderMaterial`. Realistic ceiling on consolidating the 5 standard-material
variants further: maybe 2-3 fewer programs, since the material differences
(dish is `DoubleSide` + transparent, most of the rest are opaque `FrontSide`)
are load-bearing for how the dish reads, per `hero-scene.tsx`'s own
comments on exactly this. That's a real, verified number — not a guess —
but it's a fraction of the ~1.46s average compile cost the seventh run
measured, not something that would look "dramatically sooner" on its own.
Also risks changing how the dish/interior actually render if forced into
uniform materials, in a scene that has been visibly, carefully tuned
(every material's `side`/`metalness`/`transparent` choice has a comment
explaining what it's for). Not attempting this blind in a QA pass; still a
legitimate next step for a session that can screenshot before/after and
confirm nothing visually shifted.

**The honest conclusion: neither remaining lever gets to "dramatically
sooner" on its own.** The only one that plausibly could is the one this
run did NOT touch: the intro sequence's own duration (assemble 2.25s +
glow 0.65s + hold 1.15s + burst ≈ 5.5s total before `contentReady`).
Aymean's own prior message listed "shortening the intro sequence itself"
as an option to evaluate, so this isn't off the table — but every constant
in `intro-sequence.tsx` carries a comment explaining a specific, measured
margin (e.g. the burst-to-overlay-fade gap, tuned against a software
renderer dropping frames), and the brief's own confirmed pacing calls this
"cinematic, not snappy," explicitly modeled on Obys's own unhurried intro
timing. Cutting it is a real creative trade-off between "loads faster" and
"still reads as deliberate, not rushed" that needs to actually be watched,
not computed — I can screenshot static frames but can't judge whether a
shortened version still lands as intentional pacing versus feeling
truncated. Recommending a future run (or Aymean directly) look at 2-3
shortened variants side by side before landing one, rather than a QA loop
guessing at new numbers blind.

**No code pushed this run, by choice, not by the 45-minute rule** (this
run was clear to push). Investigated the top-priority item thoroughly and
found the two most obvious remaining levers each have a hard ceiling that
falls short of what "dramatically sooner" would need — better to say that
plainly with real numbers than to ship a change that shaves a few hundred
ms and calls the top-priority item further "improved" when it isn't
meaningfully fixed.

**New finding, now CONFIRMED (previously only flagged as unconfirmed):**
compared a fresh screenshot of the fully-resolved hero object directly
against `docs/reference/screenshots/creative-craft/global/active-theory-
desktop.png` side by side. The gap the fifth run flagged as "unconfirmed,
needs a run with time to watch it move" holds up even on a static
comparison: Active Theory's reference object sits in a dense, varied
bokeh-style particle field with real depth (near/far blur), an iridescent,
chromatic-shifting ring material, and a soft volumetric beam with visible
atmosphere. Our exam light, fully resolved, shows almost no visible
sparkles (the `Sparkles` component is present in code with `opacity={0.28}`
but reads as nearly invisible in the actual screenshot), a flat matte
housing with no iridescence, and a single flat teal glow with no
atmospheric falloff. This is a legitimate, now-confirmed craft-bar gap
versus the Obys/Active Theory reference — the object itself (form,
materials, lighting rig) already went through real iterations per this
log's history, but the *density and richness* of the surrounding
atmosphere (particles, chromatic material response) is the piece that
still reads as plainer than the reference bar. Worth a dedicated pass:
likely levers are increasing `Sparkles` count/opacity/size (currently 26
at 0.28 opacity, full tier), and giving the housing or rim an
iridescent/multi-tone material response instead of a single flat color.
Not attempted this run — same reasoning as the shader-count item: touches
visual composition of a carefully-tuned object, deserves screenshots
before/after rather than a blind edit.

**Untouched, per standing rules:** `portfolio-data.ts` anonymization,
pricing figures, About section (still deliberately empty).

**Still open:** the hero-delay item is now much better understood but not
resolved — the only lever with real headroom (intro duration) needs a
visual-judgment pass, not a numeric guess; material/shader consolidation
is real but modest (verified: 14 programs, ~2-3 plausibly removable);
visual richness vs. the Active Theory reference is now confirmed (not just
flagged) and needs a dedicated pass on particle density and material
response.

**STATUS: NOT YET READY TO DEPLOY.** No code changes this run — the
investigation itself is the deliverable: it closes off two possible
"easy" fixes for the top-priority hero-delay item with real measurements
(so the next run doesn't re-spend time re-discovering the same ceilings),
and upgrades the visual-richness concern from "flagged, unconfirmed" to
"confirmed, with concrete levers." The hero-delay item still needs either
a visual-judgment call on shortening the intro, or acceptance that ~7s is
the realistic floor given the confirmed pacing spec — that's a call for
Aymean, not something to keep re-measuring.
