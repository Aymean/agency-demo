import { cn } from '@/lib/utils'

export function BrowserMockup({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
        <span className="size-2 rounded-full bg-foreground/15" />
        <span className="size-2 rounded-full bg-foreground/15" />
        <span className="size-2 rounded-full bg-foreground/15" />
      </div>
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full object-cover object-top"
        />
      </div>
    </div>
  )
}
