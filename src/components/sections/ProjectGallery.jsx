import EmptyGallery from './EmptyGallery'
import { stepCaption } from '../../lib/utils'
import { useInView } from '../../hooks/useInView'

/**
 * Simple swipeable gallery (scroll-snap). Used on mobile and with reduced motion.
 * The <img> tags only render once the gallery is near the screen: otherwise the browser
 * spots them in the pre-rendered HTML and downloads them during the first paint. The
 * 16:9 boxes are always there, so nothing shifts when the images arrive.
 * @param {{ images: any[], title: string }} props
 */
export default function ProjectGallery({ images, title }) {
  const [ref, near] = useInView('400px')
  if (!images?.length) return <EmptyGallery title={title} />
  return (
    <div
      ref={ref}
      className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:px-0"
      role="region"
      aria-label={`${title} screenshots`}
      tabIndex={0}
    >
      {images.map((img, i) => (
        <figure key={img.id} className="w-[85%] shrink-0 snap-center md:w-[70%] md:max-w-2xl">
          <div className="border-line bg-surface aspect-video overflow-hidden rounded-2xl border">
            {near && (
              <img
                src={img.image_url}
                alt={img.caption || `${title} screenshot ${i + 1}`}
                loading="lazy"
                decoding="async"
                width="1600"
                height="900"
                className="size-full object-contain"
              />
            )}
          </div>
          <figcaption className="text-muted mt-3 font-mono text-xs">
            {stepCaption(i, images.length, img)}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
