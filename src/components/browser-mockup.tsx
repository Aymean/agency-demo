import { cn } from '@/lib/utils'

export function BrowserMockup({
  src,
  alt,
  className,
  /**
   * Show the image at its true height inside a scrollable viewport instead of
   * cropping it to 16:10. Used by the case dialog, where `src` is a full
   * scroll-height capture of the real page; the grid cards stay cropped.
   */
  scrollable = false,
  viewportClassName,
}: {
  src: string
  alt: string
  className?: string
  scrollable?: boolean
  viewportClassName?: string
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
      <div
        // Lenis owns the wheel globally; without this opt-out the page scrolls
        // underneath instead of the panel the pointer is actually over.
        data-lenis-prevent={scrollable ? '' : undefined}
        className={cn(
          'w-full bg-muted',
          scrollable
            ? 'overflow-y-auto overscroll-contain'
            : 'aspect-[16/10] overflow-hidden',
          viewportClassName,
        )}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={cn(
            'w-full',
            scrollable ? 'block h-auto' : 'size-full object-cover object-top',
          )}
        />
      </div>
    </div>
  )
}
