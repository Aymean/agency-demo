# Multi-Specialty / Clinic Design Learnings — Global Premium Benchmark (v3, final locked set)

Source: 6 real, currently-live, client-approved clinic websites, locked after 5 rounds of
client review (2026-08-20/21). Every other candidate shown across those rounds — 30+ total —
was rejected, including 3 that a research pass thought matched the register but got dropped
anyway (Clínica Rafaela Salvato, Apa Aesthetic, Villa Louisa) and 1 more (Aesthetic Lab /
houstonaestheticlab.com) dropped in the final round. This is the actual, narrow, confirmed
taste bar — treat every site below as load-bearing, not just "nice examples."

Built for: مجمع دي براكسس الطبي (De Praxes Clinic), Jeddah — multi-department complex
combining dermatology + aesthetic/cosmetic treatment + dentistry, multiple doctors.

**The approved register, precisely: quiet, editorial, restrained premium.** Confident
typography and whitespace doing the work — not loud color, not luxury-hotel video theatrics,
not pastel/floral softness, not e-commerce clutter, not a generic corporate template feel.

---

## STEAL LIST — direct build instructions

**The single strongest, most repeated signal across the 6 approved sites: serif display
headline + clean sans body, paired together.** 4 of 6 use this exact move (Aventura: serif/sans
mix with italic accents; LAVA: Josefin Sans headline + PP Neue Montreal body; Clinique 7: serif
"Cormor" headline over grotesk body; Dr Grigoriak: display face "Moniqa" + grotesk "Factor A
Web"). This is not optional flavor — it is the dominant reason these sites read as premium
instead of generic. **For the De Praxes build, use Fraunces (variable serif, opsz axis) as the
display/headline face and IBM Plex Sans / IBM Plex Sans Arabic as the body face** — this is
the exact font pairing already proven in this agency's own site (agency-site/src/index.css),
not a new guess. Fraunces gives real editorial stroke contrast at large sizes exactly like
Aventura/LAVA/Clinique 7/Dr Grigoriak's display faces do. Gate Fraunces to `[dir="ltr"]` only
(per agency-site's own pattern) since it has no Arabic cut — Arabic headlines stay in IBM Plex
Sans Arabic at a heavier weight for the equivalent visual weight.

**Second-strongest repeated device: a numbered sequential rail/narrative (01-06 style).**
3 of 6 use this (Aventura's technology showcase, Clinique 7's services rail, Dr Grigoriak's
"7 steps" transformation sequence). Use this for De Praxes' 3 departments and/or its treatment
menu — a numbered, sequential presentation reads more premium than a flat icon grid.

**Palette — two validated directions, both represented equally (3 sites each):**
1. Warm-light: cream/off-white ground + dark charcoal or deep green text (Sky Clinics,
   Aventura, Clinique 7's light sections).
2. Dark-restrained: near-black or deep charcoal/forest-green ground + warm/pale accent text
   (LAVA Dental, Minemal, Dr Grigoriak). Dr Grigoriak specifically uses a warm brown accent
   (rgb 137,104,92) on black rather than a cold gray — note this as the preferred "warm dark"
   recipe over a cold/sterile dark palette.
Clinique 7 alternates BOTH within one site (light sections + near-black sections) — a viable
third option if De Praxes wants scroll-rhythm variation between departments.

**3D and motion — this is the biggest gap versus the reference sites, fix it properly:**
None of the 6 approved sites are flashy, but several use real structured motion (LAVA's
"controlled motion, studio experience," Clinique 7 and Dr Grigoriak's scroll-driven numbered
narratives). To hit this bar for real — not a bolted-on effect — **build this site on the same
stack as agency-site** (Vite + React + React Three Fiber/drei/postprocessing + Three.js +
Motion + Lenis smooth scroll), not as a single static HTML file with Three.js awkwardly
self-hosted on top. That stack is what's already proven to produce real, working 3D + smooth
scroll-tied motion in this agency's own hands — reusing it removes the guesswork.

**Copy tone:** all-caps editorial confidence works when the visuals support it (Dr Grigoriak:
"YOUR BEAUTY, REFINED TO PERFECTION"), but restraint remains the default — Clinique 7's
"OUR PHILOSOPHY" / "The Art of Rhinoplasty" framing and Aventura's artist-statement doctor
bios are the safer, more broadly-applicable register for a 3-department clinic. Avoid dense
20+-item service menus (this sank several rejected candidates, e.g. 111 Harley Street,
Dr. Howley) — group services/departments into a small number of clean categories instead.

**Trust signals:** real clinical CVs for doctor bios (not "meet the team" filler), real
credentials stated plainly. No e-commerce shop, no discount banners, no review-count walls,
no fake urgency — every approved site avoids all of these.

**Before/after feature (client-specified, do exactly this — no other interpretation):**
Photos display **desaturated/grayscale by default**. On hover (desktop) or scroll-into-view/tap
(mobile), the same photo transitions smoothly to full color via a CSS filter animation
(`grayscale(100%)` → `grayscale(0%)`, animated `filter` transition). **Do not** add any visible
"Before"/"After" text labels, and do not build this as a slider/drag interaction — it is purely
a hover-to-reveal color transition on the image itself. Only use real before/after photos
actually sourced from the client's own content.

---

## Per-site notes

### 1. Sky Clinics (Albania) — dental + aesthetics
Warm cream (#E8E7E5) against deep forest-green (#003934), Satoshi typeface. Scroll-driven
storytelling, day/night palette toggle, splits hero copy directly by department.

### 2. Aventura Dental Arts (Miami, USA) — dental
Minimalist white/light-gray field, dark charcoal type. Serif/sans mixed headline with italic
accents. Numbered "01-06" technology showcase rail. Doctor bios written like artist statements.

### 3. LAVA Dental Studio (Riga, Latvia) — dental
Deep forest-green background (rgb 3,28,20) with pale sage text. PP Neue Montreal body + Josefin
Sans headlines. "Studio experience" framing, structured controlled motion.

### 4. Minemal Dental Aesthetics (Miami, USA) — cosmetic/restorative dentistry
Dark charcoal background (#242424) with warm off-white accents. Entire brand built around
"minimalism, less is more," serif display type, generous negative space over dense grids.

### 5. Clinique 7 (Montreal, Canada) — rhinoplasty/plastic surgery
Alternates off-white/light-gray sections (#EAEAEA-#EDEDED) with near-black (#232323) sections.
Serif "Cormor" headline over clean grotesk body. Numbered 01-06 services rail almost identical
in spirit to Aventura's. Pure storytelling structure: "The Art of Rhinoplasty," "OUR PHILOSOPHY."

### 6. Dr Grigoriak (Dubai, UAE) — plastic surgery
Dominant black background with warm brown accent (rgb 137,104,92) — a "warm dark" rather than
cold/sterile dark. Custom grotesk "Factor A Web" + display face "Moniqa." All-caps editorial
copy ("YOUR BEAUTY, REFINED TO PERFECTION"), structured "7 STEPS TOWARD YOUR TRANSFORMATION"
narrative sequence.

---

## Font + 3D decision (added after round-1 build scored 6/10)

The first De Praxes build stayed within the standard client-demo convention (single static
index.html, vanilla JS, no framework) but the fonts and 3D effort inside it fell short:
- Font: the standard convention only loads IBM Plex Sans / IBM Plex Sans Arabic, no serif. But
  4 of the 6 approved reference sites specifically win on a serif-headline + clean-sans-body
  pairing. **Fix: self-host Fraunces (the same display serif already used on this agency's own
  site, `agency-site/src/index.css`) as the headline face, alongside IBM Plex Sans/Arabic for
  body** — gated to `[dir="ltr"]` only since Fraunces has no Arabic cut. This stays entirely
  within the single-HTML-file convention — it's just adding font files, no framework change.
- 3D: the previous attempt was weak from insufficient effort, not because vanilla Three.js
  can't do the job — it can, self-hosted directly in the same HTML file like every other
  script. The fix is spending real, unhurried effort on an original, well-lit, smoothly
  scroll-tied 3D hero scene, not switching architecture. Do NOT rebuild this demo as a
  React/Vite app — `agency-site` uses that stack for itself, but every client demo (including
  this one) stays on the single-file convention per CLAUDE.md.
