import { cn } from '@/lib/utils'

export function PulseDot({
  active = true,
  size = 'sm',
  speed = 'normal',
  className,
}: {
  active?: boolean
  size?: 'sm' | 'md'
  speed?: 'normal' | 'slow'
  className?: string
}) {
  const dim = size === 'md' ? 'size-2' : 'size-1.5'

  return (
    <span className={cn('relative inline-flex shrink-0', dim, className)}>
      {active && (
        <span
          className={cn(
            'absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-75 motion-reduce:hidden',
            speed === 'slow' && '[animation-duration:2.4s]',
          )}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full transition-colors duration-[800ms]',
          dim,
          active ? 'bg-signal' : 'bg-muted-foreground/40',
        )}
      />
    </span>
  )
}
