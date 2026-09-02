# Website audit — zaylo agency site, Stage 1

Stage 1 of the UI Collective 5-stage roadmap in `docs/reference/product_knowledge.md`
(line 358). Deliberately raw and over-complete — completeness over polish, per the
method. 70 findings across craft/motion, conversion, SEO, performance, accessibility
and content.

Audited: local production build (`npm run build`, byte-identical to what the
Dockerfile ships), Chromium, desktop 1440×900 and mobile 390×844, both languages.
Date: 2026-08-29. Commit: `dbcfbd2` + master merge.

**Everything below is measured, not asserted.** Where a number appears, it came from
the browser or from `dist/`. Where I am unsure, it says so.

## Scoring the headline question

The stated bar (`product_knowledge.md` line 47): *"genuinely incredible,
high-motion/3D-capable, premium artistic visuals"* — Obys/Active Theory tier, with
performance treated as **a separate later pass, never a design-time constraint.**

**Verdict: the intro clears the bar. Everything after the fold does not.** The site
has one premium moment (the logo assembly) and then becomes a well-built, tasteful,
conventional agency page. The reference tier sustains craft the whole way down.

The root cause is specific and is my error, not an accident of taste — see A1.

---

## A. Craft & motion

**A1 — CRITICAL, structural. I repeatedly traded visual ambition for performance at
design time, which is the exact anti-pattern the craft doc names.**
`product_knowledge.md` line 55: *"design/build the incredible visual concept without
self-limiting it for fear it'll be slow… Don't collapse these two steps into one
'balance them as I go' judgment call mid-design — that's what caused the wrong
over-cautious version of this rule in the first place."* Instances, all with my own
comments in the code justifying the compromise:
- `hero.tsx` `SCENE_MOUNT_DELAY = 1.4` — the 3D centrepiece is deliberately withheld
  for 1.4s so it doesn't compete with the headline for main thread.
- `hero-scene.tsx` — no glTF model, procedural primitives only, justified as "keeps
  the chunk off the network."
- `hero-scene.tsx` — real transmission/refraction rejected: "transmission costs a
  render target every frame."
- `<Environment frames={1}>` at resolution 32/96 — one static cube render.
- Compact tier drops dpr to 1, kills MSAA, halves geometry segments and particles.
- The beam is held "faint" by explicit choice.
Each is individually defensible engineering. Collectively they are why the object
reads as tasteful rather than incredible.

**A2** — No scroll-scrubbed animation anywhere. `scrub` is the single most common
technique across the reference set (principle #2, confirmed by 3+ sources). Nothing
on the page is bound to scroll *position*; everything is triggered once on entry.

**A3** — No viewport pinning (`pin: true`). No section ever holds while its contents
animate. Reference sites use this for their signature moments.

**A4** — No clip-path reveals. Principle #7: *"the dominant technique for dramatic
image/video/section reveals across award-winning sites."* Zero instances here.

**A5** — No character- or word-level text animation (SplitText equivalent). The
headline uses a single masked line-slide per line.

**A6** — No page/section transitions (Barba.js / View Transitions API). Navigation
is instant scroll.

**A7** — The 3D object has no scroll choreography. Reference builds rotate/explode/
swap the hero object as a function of scroll (Fizzi can, MacBook showcase). Ours
only fades and shrinks on scroll.

**A8** — Motion vocabulary is one gesture: a 32px translate plus fade, repeated for
every element on the page. `reveal.tsx` `TRAVEL = 32`.

**A9** — Custom shader work is minimal. The one non-trivial shader (the polar
tick/scan `TICK_FRAGMENT`) was **deleted** with the old instrument; the only shader
left is a 6-line linear beam falloff.

**A10** — Post-processing is a single `Bloom`. No chromatic aberration, no DOF, no
vignette, no noise/grain pass in WebGL (grain is a DOM overlay).

**A11** — No pointer-driven WebGL effects (lens distortion, RGB shift, metaballs,
refraction) — heavily represented in the Codrops/Three.js reference material.

**A12** — Portfolio cards animate on hover with a 6px lift and a slight parallax
tilt. No image distortion, no Flip transition, no clip-path wipe.

**A13** — No horizontal-scroll section. No infinite/marquee text. No MotionPath.
No SVG path-drawing. All named as staples of the tier.

**A14** — Lenis is installed but nothing consumes it for animation. No
`ScrollTrigger.scrollerProxy` equivalent, no scroll-velocity skew. It provides
smoothing only.

**A15** — The stack is `motion/react`, while the entire craft reference is
GSAP+ScrollTrigger. Not wrong in itself — Motion can scrub via `useScroll`/
`useTransform`, which the codebase already imports in `scroll-pulse-spine.tsx` — but
the techniques the doc treats as table stakes are simply not implemented.

**A16** — The dark palette, oversized type and default-dark-mode choices do align
with 3 of the confirmed 2026 trends (dark default 55% adoption, bold typography,
motion micro-interactions). Genuine strength, worth keeping.

**A17** — The intro sequence itself is strong and on-brief: staggered assembly,
lock glow, held beat, per-piece burst, hand-off. It is the one part that reads
reference-tier.

**A18** — Nothing after the fold reprises the intro's language beyond a 32px slide
and a faint glow. The section-transition motif is present but subtle to the point
of near-invisibility.

**Caveat on my own measurement:** my automated "does anything respond to scroll
position" probe returned true, but that only proves transforms changed while
scrolling — which one-shot entry reveals also cause. It is **not** evidence of
scrubbing. Treat A2 as read from the source, which is unambiguous.

---

## B. Conversion / CRO

**B1 — HIGH. Zero `tel:` links on the entire site (measured: 0).** Med-spa source:
**34% of bookings happen by phone.** Dental source: **61% of mobile searchers call
directly rather than filling a form.** There is a WhatsApp link, which is regionally
appropriate, but no click-to-call at all.

**B2 — HIGH. No phone or WhatsApp above the fold** on either breakpoint (measured
false on both). Local-landing-page guidance: NAP visible above the fold, click-to-call
on mobile.

**B3 — HIGH. No contact form anywhere (measured: 0 forms).** Contact is `mailto:` +
WhatsApp only. The Goldilocks pattern (name / email / one key question, ≤5 fields,
phone optional) is the recommended shape and is absent. A `mailto:` opens an empty
client with no template, no context, and fails silently on desktops with no mail
client configured.

**B4 — HIGH. The accent teal is used for the CTA *and* the eyebrow *and* the stat
numerals *and* the lock glow.** Med-spa source is explicit: *"CTA rule: use a color
that appears NOWHERE else on the page,"* with orange/coral outperforming. Our CTA
currently blends into the site's own accent language rather than standing out.

**B5** — No social proof of any kind on the page: no reviews, no testimonials, no
star ratings. Testimonials are parked by the brief (correctly, pending real quotes),
but the *gap* is a conversion cost worth naming: **77% of users read reviews before
buying.**

**B6** — Fails NN/G's fourth trust factor, "Connected to the Rest of the Web":
no external review links, no social profiles, no third-party validation.
*"Users trust third-party review sites MORE than reviews listed on the website itself."*

**B7** — No NAP block (Name / Address / Phone) as crawlable text. Only an email and
a WhatsApp number, both in the footer.

**B8** — No "what happens next" after the CTA. Clicking Book a Call opens a blank
email. No calendar link, no expectation-setting, no confirmation path.

**B9** — One CTA repeated site-wide ("Book a Call"). Consistent, which is good, but
there is no lower-commitment secondary action (see the work, get an audit, view a
sample rebuild) for visitors not ready to book.

**B10** — CTA copy is generic. Local-page guidance: locality-flavoured CTAs
outperform ("Get a Free Plumbing Quote in Phoenix" > "Get a Free Quote"). Ours is
the generic form in both languages.

**B11 — Strength.** The CVP is genuinely strong and rare: *"We build the better
version of your website. Then we ask if you want it."* This answers "why buy from
you," not "what do you get" — exactly the CVP framing the CRO source calls for, and
it costs nothing.

**B12 — Strength.** Pricing is public and specific. NN/G "Upfront Disclosure" is one
of four trust factors, and *"no lengthy gated quote forms"* is called out by name.

**B13 — Strength.** Portfolio is not gated. *"Login walls / gated content breach
trust specifically by asking for information before providing any value."*

**B14 — Strength.** No fake urgency, no countdowns, no fabricated scarcity.

**B15** — No hero carousel. Correct: *"fewer than 8% of visitors interact with a
homepage carousel past the first slide."*

**B16** — "80+ rebuilds" is a real stat tile, which is the recommended trust-signal
shape (the dental guide's *"Over 1,500 successful implants"* pattern). Strength.

**B17** — No FAQ section. Listed under NN/G trust factors and recommended by the
dental guide.

**B18** — Page is 4.5 screenfuls desktop / 6.9 mobile. Reasonable; *"people will
scroll if they have a reason to."* No finding, recorded for completeness.

**B19** — Possible "illusion of completeness" risk: the hero fills the viewport with
a dark, self-contained composition and no cut-off content at the fold edge to signal
more below. NN/G names this specific failure mode for minimalist designs. Unverified
with real users — flagged, not asserted.

---

## C. SEO

**C1 — HIGH. Zero structured data** (measured `jsonLd: 0`). No LocalBusiness /
Organization / ProfessionalService schema. Recommended explicitly for surfacing in
map features and AI-generated summaries.

**C2 — HIGH. Bilingual content lives at one URL with no crawlable English version.**
Language is client-side React state only. There is no `/en/`, no `?lang=`, no
`hreflang` (measured 0). Search engines only ever see the Arabic default. For a site
whose whole positioning is bilingual, this halves its indexable surface.

**C3** — No Open Graph tags (measured 0). Any share on WhatsApp / LinkedIn / X
renders a bare link with no image or title — for an agency selling visual craft,
this is a bad first impression in exactly the channel cold outreach uses.

**C4** — No Twitter card tags (measured 0).

**C5** — No canonical URL.

**C6** — No `sitemap.xml`, no `robots.txt` in `dist/`.

**C7** — Meta description is 190 characters; typical SERP truncation is ~155, so the
last third (including "80+ real rebuilds") will usually be cut.

**C8** — Title is 64 characters. Fine.

**C9** — No `theme-color` meta (affects mobile browser chrome on a dark site).

**C10** — Single `<h1>` and clean heading order (H1 H2 H2 H3 H3 H3 H2 H3 H3 H3 H2).
Strength.

**C11** — The `<h1>` concatenates two sentences with no separator in its text content
("…موقعك.بعدين…"), because they are separate spans. Reads fine visually; snippets and
screen readers get the run-on.

**C12** — All 7 images carry `alt` and `loading="lazy"`. Strength.

---

## D. Performance

Recorded as findings but explicitly **deferred** — the craft doc is emphatic that
this is a separate later pass and must not shape design decisions now. Listing so the
later pass has a starting point.

**D1** — 6.2 MB of portfolio JPEGs. Largest single file `arcave-full.jpg` at
**1,347 KB** against a 300 KB guideline. Seven files, 468–1,347 KB each.

**D2** — Portfolio thumbnails are **PNG** (113–232 KB each) for photographic content.
Wrong format; WebP/AVIF would cut 60–80% with no visible loss.

**D3** — 1.2 MB of font files shipped (928 KB woff2 + 268 KB woff), including italic
and Cyrillic faces almost certainly never rendered. Subsets are unicode-range gated so
not all download, but they are all deployed.

**D4** — `hero-scene` chunk: 1,017 KB raw / 270 KB gzipped.

**D5** — Main bundle: 486 KB raw / 155 KB gzipped. CSS 80 KB / 21 KB.

**D6** — First load (JS+CSS, gzipped) ≈ 176 KB before fonts. Line25's sustainable
target is **under 500 KB total first load**; fonts are what put this at risk.

**D7** — No `preconnect` / `preload` for critical fonts.

**D8** — Load-time-to-conversion curve from the med-spa source, for the later pass:
<2s baseline, 2–3s −7%, 3–4s −15%, 4–5s −25%, 5s+ −35%.

---

## E. Accessibility

**E1 — HIGH. Touch targets below the 44×44 minimum** (Apple HIG, cited by the dental
guide). Measured:
| Element | Size | Breakpoint |
|---|---|---|
| Primary CTA "Book a Call" | 132×**36** | both |
| Nav links (Work/Process/Pricing/Contact) | ~35×**20** | desktop |
| Language toggle EN/AR | 42×**30** | both |
| Nav CTA button | 82×**28** | desktop |
| Footer email / phone links | ×**20** | both |
| Header logo lockup | 110×26 / 26×26 | desktop / mobile |
11 sub-44px targets on desktop, 6 on mobile.

**E2 — MEDIUM. Body copy below the 16px minimum.** Measured 14px on Process step
descriptions, Pricing term descriptions, and the hero sub; 12px on the eyebrow and
the `$0` seal label. The dental guide sets 16px as the floor for body text. The 12px
eyebrow is a label and arguably exempt; the 14px paragraphs are not.

**E3** — Drag-to-orbit has no keyboard equivalent and no affordance indicating the
object is interactive at all.

**E4** — The intro's skip affordance works (click/Esc/scroll) but is invisible. A
first-time visitor has no way to know a ~6s intro can be skipped.

**E5** — No skip-to-content link.

**E6 — Strength.** Contrast is excellent: 12.3:1 headline, 11.2:1 accent numerals
against their actual backdrops. WCAG AA needs 4.5:1, AAA 4.5:1 for large text.

**E7 — Strength.** `prefers-reduced-motion` is handled in four layers and verified:
intro skipped entirely, lock glows `display:none`, grain animation disabled, Lenis
disabled.

**E8 — Strength.** Language toggle has an `aria-label`; intro overlay is `aria-hidden`
and never traps focus.

**E9** — Focus-visible styles exist via the shadcn button ring, but I did not verify
focus order or visible focus on every interactive element. Unverified.

---

## F. Content & structure

**F1** — About section is empty by design, blocked on real copy. `TODO(about-content)`.

**F2** — Portfolio shows 7 projects. The interior-design source's 80:20 rule argues
for curating to the strongest ~5; *"narrowing her portfolio down to only her
strongest work measurably increased enquiries."*

**F3** — Portfolio entries have a label and a one-line hook but no case-study depth.
The 5 Cs framework (Context → Client brief → Challenge → Competence → Consequence) is
a ready template and is unused.

**F4** — Process is 3 clear steps with real copy. Strength.

**F5** — Copy is colloquial and human in both languages, which the CRO source
explicitly prefers over corporate register. Strength.

**F6** — Three of the seven portfolio entries are non-clinic (architecture studio,
real-estate platform, real-estate brokerage) while the site now positions as
clinics-only. Not a defect — they are the real record of past work — but there is a
positioning tension worth a decision.

---

## Priority order for Stage 2

If only three things get fixed, they should be:

1. **A1 + A2/A3/A4** — stop self-limiting the visual, and add real scroll-driven
   craft (scrub, pin, clip-path). This is the difference between "nice agency site"
   and the stated bar, and it is the whole reason for the audit.
2. **B1/B2/B3** — click-to-call, a phone number above the fold, and a real form.
   These are the highest-confidence conversion wins in the whole document, backed by
   hard numbers, and they are cheap.
3. **E1** — 44px touch targets. One-line fixes, affects every mobile visitor, and
   72% of this vertical's traffic is mobile.

C1/C2 (schema + a crawlable English version) are the highest-value SEO items but are
larger structural changes; they belong in their own pass.
