# Rebuild status

Written to be read cold, with no context. Current as of 2026-08-29.

## The one thing to read first

**The site is not deployed, and `master` is one commit behind the fix for the
bug you reported.**

You flagged that the hero's 3D object looked "basic, no real 3D" on the live
site. That was correct, and it is fixed — but the fix is on the branch
`claude/rebuild-intro-stats-exam-light-tadds1` (commit `82bc593`), **not on
`master`**. If anything deploys `master` as it stands, it ships the version with
the near-invisible hero and the broken drag.

That commit needs a PR merged into `master` before any deploy. It is the only
outstanding code.

## What is on `master` now

`master` is at `5f4fba1`. Everything below is merged and verified:

| Brief section | What shipped | Commit |
|---|---|---|
| §1 Intro sequence | Logo pieces assemble → lock glow → hold → per-piece 4x burst → resolve into the header lockup. Once per session, skipped under reduced motion, click/Esc/scroll to skip. | `1495249` |
| §3.1 Hero | 3D adjustable exam light replacing the old loupe/gauge instrument. Reflector dish, articulated arm, weighted base, real spotlight, drag-to-orbit. | `1495249`, reposed `bb0ecad` |
| §5 Stats | "80+" replacing "50+"; the niche-count tile dropped outright. The same claim in the portfolio heading and the page metadata updated to match. | `1495249`, `e55947f` |
| §2 Section-transition motif | Headings and content fly in and lock on scroll entry, with a subtler echo of the intro's glow. Built as `from` / `lock` props on the existing `reveal.tsx` primitives, not a parallel system. | `672cf9d` |
| §3.5 Pricing | $3,000–$10,000 framed as a range, 50% to start / 50% before delivery, live in under 24h. | `672cf9d` |
| §3.3 Process copy | Reviewed against the broadened niche. **No change was needed** — the steps already said "clinics" generically and named no vertical. | `e55947f` |
| §3.2 About | Structural scaffold only, renders nothing. See below. | `f947cce` |

Also done along the way: brand renamed to "Zaylo Agency" everywhere it is
displayed (the email `contact@zaylogear.com` is a domain and stays), geography
narrowed to Saudi Arabia only, and the hero CTA unblocked — an invisible
full-width band was silently swallowing every click on it.

## What is NOT done

1. **About section content (§3.2).** Blocked on your copy, exactly as instructed
   — nothing drafted, nothing invented. The section exists as an empty anchor in
   the right position so real copy drops in without a layout rebuild. Search the
   code for `TODO(about-content)`; `src/components/about.tsx` explains what to
   add and which section to copy the layout from.
2. **Timeline (§7).** A launch-date decision, not a build task.
3. **Deploy.** Not done — see below.
4. **A live review pass.** The brief's own process note expects a revision round
   once you have seen it running.

## Deploy

**Not deployed, and I did not attempt it.** Two reasons, both worth knowing:

- **Authorisation.** The instruction to go live reached me relayed through
  another Claude session, not from you. Pointing a live customer-facing domain
  at new code is outward-facing and hard to undo, and the same message noted the
  deploy had been "explicitly held back before". A relayed message is not the
  right basis for lifting a hold someone deliberately placed, so I left it for
  you.
- **Access.** Independently of that, I could not have done it. This environment
  has no EasyPanel access, and its network policy blocks `agency.zaylogear.com`
  outright (403 on CONNECT), so I cannot reach the site to deploy it or to check
  what it is currently serving.

When you do deploy: merge `82bc593` to `master` first, then repoint the existing
EasyPanel service. Do not deploy `master` before that merge.

## How this was verified, and what that does not cover

Every section was checked in a real browser against the production build
(`npm run build`, the same artifact the Dockerfile ships), in **both English and
Arabic**, including RTL mirroring, reduced-motion, and mobile.

Two limits worth stating plainly:

- **Nothing was verified against the live site**, because this environment
  cannot reach it. "Verified" throughout means the production build served
  locally. That is a byte-identical artifact — the Dockerfile runs a plain
  `npm run build` with no env vars or mode flags — but it is not the same as
  seeing it live.
- **There is no CI in this repo.** No `.github/workflows/` exists, so nothing on
  GitHub checks these changes. The local typecheck, build, lint and browser runs
  were the only gate, and future changes have no gate at all unless one is added.

An earlier round of my own verification was too weak and missed two real bugs
that you then caught on the live site: the hero object was measured at 4.84
luminance levels of contrast against its background (invisible in practice), and
the drag test asserted "text is still selectable", which was the bug rather than
the pass condition. Both are fixed in `82bc593`, and both are now measured
rather than eyeballed.

## Standing rules that were kept

Per §6, none of these were relitigated: `portfolio-data.ts` stays fully
anonymised with zero real client names; no fabricated testimonials, awards or
credentials; bilingual EN/AR with RTL parity on every new section; and the
existing token system in `index.css` (graphite-ink base, teal accent, rationed
champagne, Fraunces/IBM Plex Sans) was extended, never redesigned.

One consequence worth flagging: the portfolio's `Gulf coast` / `Dental clinic`
labels were deliberately **not** updated when the niche and geography changed.
The fuzzed geography is an anonymisation device — naming the real country makes
each client more identifiable — and the vertical labels describe what those
projects actually were, so broadening them would falsify the record.
