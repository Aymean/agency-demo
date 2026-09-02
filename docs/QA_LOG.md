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
