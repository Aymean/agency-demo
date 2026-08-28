import { motion } from 'motion/react'

// Three marks in the same visual language as the hero instrument: thin
// engraved line, one teal accent, nothing filled. They used to be a boxed EKG
// trace repeated at three opacities, which said "medical clip-art" rather than
// "these people measure things for a living".
//
//   radar  step 1, finding broken sites — a sonar sweep over concentric range
//          rings, with one contact lit off-axis.
//   gauge  step 2, building it free — the hero's calibration ring at icon
//          scale: same tick-marked circumference, same slow-hunting needle.
//   lock   step 3, showing it live — a focused crosshair, brackets closing on
//          the target.
//
// Every animation here is a transform or an opacity, so MotionConfig's
// reducedMotion="user" at the app root neutralises all of them for anyone who
// asked for that, without a second code path.
export type ProcessIconVariant = 'radar' | 'gauge' | 'lock'

const EASE = [0.16, 1, 0.3, 1] as const
const CENTER = { transformOrigin: '24px 24px', transformBox: 'view-box' } as const
const SPIN_ORIGIN = { ...CENTER, willChange: 'transform' }

/** Tick marks around a circle, in the manner of a caliper: every third one long. */
function ticks(count: number, radius: number, minor: number, major: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const len = i % 3 === 0 ? major : minor
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return {
      key: i,
      x1: 24 + cos * radius,
      y1: 24 + sin * radius,
      x2: 24 + cos * (radius - len),
      y2: 24 + sin * (radius - len),
      major: i % 3 === 0,
    }
  })
}

const GAUGE_TICKS = ticks(18, 17, 2.2, 4)

export function ProcessIcon({ variant }: { variant: ProcessIconVariant }) {
  return (
    <svg viewBox="0 0 48 48" className="size-11" fill="none" aria-hidden>
      {variant === 'radar' && <Radar />}
      {variant === 'gauge' && <Gauge />}
      {variant === 'lock' && <Lock />}
    </svg>
  )
}

function Radar() {
  return (
    <g strokeLinecap="round">
      {[20, 13.5, 7].map((r, i) => (
        <circle
          key={r}
          cx={24}
          cy={24}
          r={r}
          strokeWidth={1.25}
          className="stroke-muted-foreground"
          opacity={0.42 - i * 0.08}
        />
      ))}
      <circle cx={24} cy={24} r={1.1} className="fill-muted-foreground" opacity={0.55} />

      <motion.g
        style={SPIN_ORIGIN}
        animate={{ rotate: 360 }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'linear' }}
      >
        {/* The sweep itself, plus the short leading arc it drags behind it. */}
        <line x1={24} y1={24} x2={24} y2={4} strokeWidth={1.4} className="stroke-accent" />
        <path d="M24 4 A20 20 0 0 0 10.9 8.9" strokeWidth={1.25} className="stroke-accent" opacity={0.35} />
      </motion.g>

      {/* The contact: a site that turned out to be broken. */}
      <motion.circle
        cx={33}
        cy={16}
        r={1.7}
        className="fill-accent"
        animate={{ opacity: [0.15, 1, 0.15] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.12, 0.45] }}
      />
    </g>
  )
}

function Gauge() {
  return (
    <g strokeLinecap="round">
      <circle cx={24} cy={24} r={20} strokeWidth={1.25} className="stroke-accent" opacity={0.55} />
      <circle cx={24} cy={24} r={12.5} strokeWidth={1.25} className="stroke-muted-foreground" opacity={0.3} />

      {GAUGE_TICKS.map((t) => (
        <motion.line
          key={t.key}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          strokeWidth={t.major ? 1.4 : 1}
          className={t.major ? 'stroke-accent' : 'stroke-muted-foreground'}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: t.major ? 0.9 : 0.45 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.4, delay: 0.3 + t.key * 0.045, ease: EASE }}
        />
      ))}

      {/* Needle: hunts, settles, hunts again — a gauge finding its reading. */}
      <motion.g
        style={CENTER}
        initial={{ rotate: -34 }}
        animate={{ rotate: [-34, 26, -12, 8, -34] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1={24} y1={24} x2={24} y2={11} strokeWidth={1.5} className="stroke-accent" />
      </motion.g>
      <circle cx={24} cy={24} r={1.9} strokeWidth={1.25} className="stroke-accent" />
    </g>
  )
}

function Lock() {
  const brackets = [
    'M8 15 V8 H15',
    'M33 8 H40 V15',
    'M40 33 V40 H33',
    'M15 40 H8 V33',
  ]

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {brackets.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          strokeWidth={1.4}
          className="stroke-accent"
          initial={{ opacity: 0, scale: 1.28 }}
          whileInView={{ opacity: 0.85, scale: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.75, delay: 0.25 + i * 0.06, ease: EASE }}
          style={CENTER}
        />
      ))}

      <motion.circle
        cx={24}
        cy={24}
        r={11}
        strokeWidth={1.25}
        className="stroke-accent"
        initial={{ pathLength: 0, opacity: 0.2 }}
        whileInView={{ pathLength: 1, opacity: 0.7 }}
        viewport={{ once: true, margin: '-20%' }}
        transition={{ duration: 1.4, delay: 0.35, ease: EASE }}
      />

      {[
        [24, 8, 24, 15.5],
        [40, 24, 32.5, 24],
        [24, 40, 24, 32.5],
        [8, 24, 15.5, 24],
      ].map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          strokeWidth={1.25}
          className="stroke-muted-foreground"
          opacity={0.45}
        />
      ))}

      <motion.circle
        cx={24}
        cy={24}
        r={2.2}
        className="fill-accent"
        initial={{ opacity: 0.35 }}
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </g>
  )
}
