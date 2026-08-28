/* About / credibility — section 3.2 of REBUILD_BRIEF.md.
 *
 * SCAFFOLDING ONLY. This deliberately renders no copy.
 *
 * The brief is explicit that Aymean is writing this section's content himself
 * and will hand it over directly: the team mention stays vague ("a team", no
 * names, roles or bios), and the values/principles block is his to write. The
 * standing rule in section 6 is no fabricated content, and section 3.2 adds
 * that no hard credentials or numbers exist yet beyond the one stat in section
 * 5 — so there is nothing here that could be filled in truthfully, and a
 * plausible-sounding draft would be the exact failure mode both rules exist to
 * prevent. Placeholder prose is not a safer version of that: it reads as real
 * copy to anyone who sees the page before it is replaced.
 *
 * What this file is for is the structure, so real copy can drop in without a
 * layout rebuild: the anchor exists and the section's position in the page
 * order is settled (after Hero, before the Services/Process and Work sections,
 * per the brief's page structure list).
 *
 * Two things are deliberately NOT wired up yet, because both would be broken
 * while the section is empty and neither is needed to receive content:
 *
 *   - No nav link. It would scroll to nothing.
 *   - No entry in SECTION_IDS in scroll-pulse-spine.tsx. The spine places a
 *     stop by measuring the section's offset; a zero-height section would put
 *     a marker at a meaningless position on the rail.
 *
 * When the real copy arrives: add an `about` namespace to the typed Dict in
 * i18n.tsx (English and Arabic, which the type will enforce), give the section
 * the same shell the other sections use — `border-t border-border py-16
 * md:py-24` with a `Reveal lock` heading block, matching pricing.tsx — and add
 * it back to the nav and the spine.
 */
export function About() {
  // No border, no padding, no heading: an empty section carrying the usual
  // section chrome would render as a stray divider line above a blank band,
  // which reads as a layout bug rather than as an absence. Zero visual
  // footprint until there is something real to show.
  return <section id="about" aria-hidden />
}
