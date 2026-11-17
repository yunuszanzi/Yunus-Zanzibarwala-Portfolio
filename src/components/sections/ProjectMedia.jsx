import { lazy, Suspense } from 'react'
import ProjectGallery from './ProjectGallery'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { GALLERY_STYLE } from '../../lib/galleryConfig'

// The scroll-driven galleries use framer-motion. Loading them lazily keeps that library out
// of the main bundle; mobile and reduced-motion visitors never download it at all.
const ScrollGallery = lazy(() => import('./ScrollGallery'))
const StackGallery = lazy(() => import('./StackGallery'))

/**
 * Picks the right gallery: scroll-driven on desktop (style set in lib/galleryConfig.js),
 * swipeable on mobile, with reduced motion, or when there's only one screenshot.
 * @param {{ images: any[], title: string }} props
 */
export default function ProjectMedia({ images, title }) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const desktop = useMediaQuery('(min-width: 768px)')
  const swipe = <ProjectGallery images={images} title={title} />
  if (desktop && !reduce && images?.length > 1) {
    const Gallery = GALLERY_STYLE === 'stack' ? StackGallery : ScrollGallery
    return (
      <Suspense fallback={swipe}>
        <Gallery images={images} title={title} />
      </Suspense>
    )
  }
  return swipe
}
