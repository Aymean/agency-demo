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
