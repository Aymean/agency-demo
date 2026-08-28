# Agency site rebuild — build brief

Target: `agency-site` (Vite + React + TypeScript + Tailwind + shadcn, already in this repo).
This is Zaylo Agency's own site — the thing that has to prove "we build elite websites"
before a clinic owner will believe we can build one for them. Reference bar: Obys Agency
and Active Theory (obys.agency, activetheory.net) — not generic "premium minimal" agency
sites like Clay/Instrument, which read as competent but not exceptional.

Extend the existing codebase. Do not start a new project. Reuse the existing stack: React
Three Fiber + drei + postprocessing + Three.js + `motion/react` + Lenis smooth-scroll
(`src/lib/smooth-scroll.tsx`), the existing design tokens (`src/index.css`), and the
existing i18n system (`src/lib/i18n.tsx`, English + Arabic/RTL — bilingual is staying, do
not drop Arabic).

---

## 1. Intro sequence (replaces the current hero-scene "instrument" object entirely)

**Kill `src/components/hero-scene.tsx`'s current object** (the brushed-titanium
loupe/gauge/caliper). It reads as watchmaker/audio-equipment, not clinic-relevant —
confirmed rejected in review. The `TICK_FRAGMENT` shader/scan-resolve technique itself is
good work and can be reused for other effects, but not on that object.

**New intro, confirmed mechanic — build exactly this sequence:**

1. **Assemble.** The real logo (vectorized — see `incoming-logo/zaylo_logo_traced.svg`,
   3 clean paths: the fused top-bar+diagonal piece, the vertical+hook piece, the small
   ribbon bar) starts as its 3 pieces scattered off-screen in different directions, each
   rotated. They fly in on a staggered delay (~280-300ms between each) and lock into their
   exact traced positions (`transform: none` = the correct assembled logo, since the paths
   already carry the right relative offsets from the trace — do not re-derive positions).
   Duration per piece ~1.2-1.4s, easing `cubic-bezier(0.16, 1, 0.3, 1)` (same EASE constant
   already defined in `hero.tsx`). This should feel slow and deliberate — cinematic, not
   snappy. Total assemble time landing around 2-2.5s is the right register (reference:
   Obys's own intro pacing — deliberately unhurried).
2. **Lock glow.** The instant the last piece lands, a brief radial glow/bloom pulse at the
   logo's center (~0.5-0.7s fade in/out) sells the "click, locked into place" moment.
3. **Hold.** Real pause, ~1-1.3s. Let the assembled logo actually sit there before anything
   else happens — do not rush into the next beat.
4. **Piece burst.** Each of the 3 pieces independently scales up (~4x) from its own locked
   position and fades to 0 opacity — NOT a single unified block-scale of the whole logo
   (that was tried and explicitly rejected — it reads as "punching the whole logo at the
   camera" instead of the pieces individually dispersing). Stagger ~90ms between pieces,
   each piece's own transition ~1.1-1.2s, easing `cubic-bezier(0.6, 0, 0.85, 0.2)` (a
   sharp, accelerating-out ease, not a bounce).
5. **Resolve into header lockup.** As the burst finishes, the same logo (small, ~24-28px)
   fades in at its permanent position in the site header/nav (top-left, or wherever
   `site-nav.tsx` currently anchors it), with the "ZAYLO AGENCY" wordmark appearing right
   next to it — this becomes the persistent nav lockup for the rest of the session, not a
   one-off. The actual homepage content (hero headline, etc.) fades in underneath at the
   same beat.

**Confirmed reference demos of this exact sequence exist** — ask Aymean if he wants the
interactive HTML prototypes from this chat session pulled up again as a visual reference;
they used the real traced SVG paths and matched this spec.

**Skip on repeat visits / reduced motion.** Play once per session (sessionStorage flag),
and respect `prefers-reduced-motion` (skip straight to the resolved header state) — this
already matches the codebase's existing pattern (see `MotionConfig reducedMotion="user"`
in `App.tsx` and the `prefers-reduced-motion` handling already in `index.css`/`hero.tsx`).

---

## 2. Section-transition motif (carries the intro's language through the whole site)

Confirmed requirement: the 3D/motion treatment should not be limited to the intro — it
should recur through the site so the whole thing feels like one system, not a hero effect
that dies after the fold.

**Proposed extension (logical continuation of the confirmed mechanic — flag to Aymean for
a quick yes/no before building, since this specific part wasn't demoed):** as each major
section (`Portfolio`, `Process`, `Pricing`, `Contact`) scrolls into view, its heading and
key content blocks fly in and "lock" into place the same way the logo pieces did —
directional entry, same easing family, a faint echo of the same glow-on-lock beat (much
subtler — this is a supporting motif, not a repeat of the hero moment). This reuses the
existing `Reveal`/`RevealGroup`/`RevealItem` components (`src/components/reveal.tsx`) as
the animation primitive — extend their transform origin/direction options rather than
building a parallel system.

Do NOT reuse the earlier "blur into focus" scan concept — that was proposed and explicitly
rejected in favor of the piece-lock mechanic above.

---

## 3. Page/section structure

Confirmed sections, in order:

1. **Hero** — existing copy/layout structure stays, old 3D instrument removed (see §1),
   replaced by a NEW 3D centerpiece: a detailed, realistic **adjustable exam light** (the
   kind used across every clinic type — dental, dermatology, laser, general medical — not
   niche-specific to one specialty). Slowly rotating, draggable/orbitable by the user (same
   interaction family as Active Theory's rotating centerpiece objects — technique borrowed,
   object is our own, fits the broadened "all clinics" niche instead of one specialty).
   Confirmed 2026-08-28: lives in the Hero, not Process.
2. **About / credibility** — new section. Two parts, confirmed 2026-08-28:
   - Team mention: stays vague, "a team" — no individual names, roles, or bios.
   - Values/principles block: why this agency exists, what it believes, what it gives
     clients. **Aymean is writing this content himself in a separate chat and will hand it
     directly to whichever session builds this section — do not draft this copy, do not
     wait on this brief for it.** No hard credentials/numbers exist yet beyond §5's stat —
     don't invent any.
3. **Services / Process** — existing `process.tsx`, keep structure, review copy for the
   broadened niche (see §5).
4. **Work / Portfolio** — existing `portfolio.tsx` + `portfolio-data.ts`, but see §4 for a
   required change to how client identity is handled.
5. **Pricing** — new section. Confirmed numbers (2026-08-28): **$3,000-$10,000 range**,
   framed as "depends on the website you want" — not a flat single number, this is the
   public site's range. 50% deposit / 50% before delivery, <24h turnaround after final
   payment — both confirmed still accurate.
6. **Contact** — existing `contact.tsx`, keep.

**Testimonials — parked, not in scope for this build.** Needs real quotes from clinic
owners about working with Zaylo Agency specifically (not clinic patient reviews). Add only
if Aymean supplies real quotes; do not fabricate placeholder testimonials.

---

## 4. Portfolio — CONFIRMED: stays fully anonymized, no exceptions

**Confirmed 2026-08-28: no client can ever be named, full stop** — not "ask per-entry,"
not "some can be named" — none. Keep `portfolio-data.ts` exactly as currently
built (anonymized labels, real specific hooks, no client identity). Do not add names to
any entry, ever, regardless of how "safe" a given client might seem.

---

## 5. Stats / numbers — CONFIRMED values

`hero.tsx`'s `STATS` array currently has a hardcoded comment: *"The true niche count:
dental, aesthetic, real estate, interior design"* — stale, drop this stat entirely. The
niche is now all clinic types in Saudi Arabia (not a fixed list of verticals), so a
niche-count number doesn't mean anything anymore.

**Confirmed 2026-08-28: replace "50+" with "80+".** Verified against a real count — 89
folders exist under `leadgen-agency/demos-*/` (actual demo builds), rounded down to 80+ to
stay conservative in case a few are incomplete/duplicates. `STATS` becomes a single entry
(80+ demos built) plus the existing `$0` upfront seal — drop the niche-count tile entirely
rather than replacing it with something else.

---

## 6. Non-negotiables (standing rules, apply to every section above)

- No fabricated content, no fake urgency, no invented testimonials/awards/credentials.
- Real photos/screenshots only where used; no stock-photo doctor/team filler.
- Anonymize any client data not explicitly cleared for real-name use (see §4).
- Palette/type: keep the existing token system in `index.css` (graphite-ink dark base,
  teal `--accent`, rationed champagne `--accent-premium`, Fraunces display serif on `dir=ltr`
  headlines, IBM Plex Sans / IBM Plex Sans Arabic body) — this was validated against real
  client-approved reference sites (see `../benchmark/design_learnings_multispecialty-clinic.md`)
  and should not be redesigned from scratch.
- Bilingual EN/AR + RTL must work identically across every new section — follow the
  existing `[dir="ltr"]` / `[dir="rtl"]` scoping pattern already used throughout
  `index.css` and `hero.tsx`, don't let new sections skip Arabic parity.

---

## 7. Open items — need Aymean's input before those specific parts ship

1. About section: real team/credential content to write from.
2. Section-transition motif (§2): quick confirm this proposed extension is correct before
   building it out across all sections.
3. Timeline: when this needs to be live.

Portfolio (§4) and stats (§5) are now confirmed, not open. Everything except items 1-2
above can start immediately.

**Process note, confirmed 2026-08-28: ship a real first version, then iterate from what's
actually on screen.** Don't try to perfect every animation detail in planning/chat before
writing code — build the intro + hero (§1) to spec, run it in the browser, and expect a
revision pass after Aymean sees it live. That's the plan, not a failure state.
