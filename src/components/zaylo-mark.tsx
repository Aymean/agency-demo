/* The Z mark, as real vector paths.
 *
 * Source: `incoming-logo/zaylo_logo_traced.svg` (vtracer 0.6.12 output). That
 * file carries FOUR paths — the first is an opaque white 500x500 background
 * rect the tracer emits for the image ground, which is dropped here. Only the
 * three black marks below are the logo.
 *
 * Each piece keeps the `translate()` the trace gave it. Those offsets ARE the
 * assembled logo: with no other transform applied the three pieces already sit
 * in their correct relative positions, so nothing about the layout is
 * re-derived by hand. Anything that animates a piece must therefore animate a
 * WRAPPER around the path, never the path's own transform attribute, or it
 * overwrites the trace offset and the mark falls apart.
 */

import type { CSSProperties } from 'react'

export type LogoPiece = {
  key: string
  /** Human name for the shape, matching how the rebuild brief refers to them. */
  label: string
  transform: string
  d: string
}

export const LOGO_VIEWBOX = '0 0 500 500'

export const LOGO_PIECES: LogoPiece[] = [
  {
    key: 'bar',
    label: 'fused top-bar and diagonal',
    transform: 'translate(84,101)',
    d: 'M0,0 L245,0 L239,11 L233,21 L214,53 L202,73 L191,91 L174,119 L161,140 L151,156 L136,181 L124,200 L125,204 L145,218 L164,231 L177,240 L193,251 L197,254 L202,253 L220,241 L235,231 L260,214 L279,201 L280,119 L312,119 L312,221 L301,229 L282,242 L260,257 L249,265 L234,275 L215,288 L199,299 L195,299 L176,286 L163,277 L147,266 L133,256 L117,245 L98,232 L87,224 L71,213 L73,207 L87,185 L96,170 L109,149 L125,123 L136,105 L147,87 L158,69 L173,44 L178,36 L22,35 L15,25 L2,4 Z',
  },
  {
    key: 'hook',
    label: 'vertical and hook',
    transform: 'translate(380,100)',
    d: 'M0,0 L20,0 L30,1 L25,10 L13,30 L-4,58 L-16,77 L-33,106 L-45,125 L-56,143 L-65,158 L-80,182 L-85,190 L-130,190 L-124,179 L-116,166 L-99,138 L-82,110 L-67,85 L-54,64 L-39,39 L-28,21 L-19,6 L-16,1 Z',
  },
  {
    key: 'ribbon',
    label: 'ribbon bar',
    transform: 'translate(122,161)',
    d: 'M0,0 L106,0 L102,8 L91,25 L90,26 L81,27 L19,27 L14,25 L4,8 L0,2 Z',
  },
]

/** The assembled mark, no animation. Used for the nav lockup and the footer.
 *  `currentColor` rather than the traced `#000000` so it inherits whatever
 *  token the surrounding text is using — the raster logo it replaces was
 *  colour-locked and needed a separate file per theme. */
export function ZayloMark({
  className,
  title,
  style,
}: {
  className?: string
  title?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      style={style}
      fill="currentColor"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {LOGO_PIECES.map((piece) => (
        <path key={piece.key} transform={piece.transform} d={piece.d} />
      ))}
    </svg>
  )
}
