import { lazy, Suspense, useEffect, useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Seo from '../components/layout/Seo'
import Hero from '../components/sections/Hero'
import Work from '../components/sections/Work'
import About from '../components/sections/About'
import Skills from '../components/sections/Skills'
import Path from '../components/sections/Path'
import Contact from '../components/sections/Contact'
import Skeleton from '../components/ui/Skeleton'
import { useProjects, useSettings } from '../hooks/queries'
import { useNearViewport } from '../hooks/useNearViewport'
import { useHashAnchor } from '../hooks/useHashAnchor'

// Split out of the main bundle: the palette (cmdk) loads on first open, the contact form
// (react-hook-form + zod) loads after the page renders.
const CommandPalette = lazy(() => import('../components/layout/CommandPalette'))
const ContactForm = lazy(() => import('../components/sections/ContactForm'))

/** Short display name: first + last word ("Yunus Mustafa Zanzibarwala" -> "Yunus Zanzibarwala"). */
function shortName(name = '') {
  const parts = name.trim().split(/\s+/)
  return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : name
}

export default function Home() {
  const { data: settings, isLoading } = useSettings()
  const { data: projects } = useProjects()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteLoaded, setPaletteLoaded] = useState(false)
  const [formRef, formNear] = useNearViewport()
  useHashAnchor()

  const openPalette = (open) => {
    if (open) setPaletteLoaded(true)
    setPaletteOpen(open)
  }

  // Ctrl/Cmd+K toggles the palette (and triggers loading it the first time).
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteLoaded(true)
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Accent color from Settings drives the dark theme accent. Light theme keeps a darker
  // shade so text on it stays readable.
  useEffect(() => {
    if (settings?.accent_color) {
      document.documentElement.style.setProperty('--accent-custom', settings.accent_color)
    }
  }, [settings?.accent_color])

  const name = settings?.site_name || 'Portfolio'
  const socials = settings?.social_links ?? []
  const published = (projects ?? []).filter((p) => p.published)

  return (
    <>
      <Seo settings={settings} projects={published} />
      <Navbar
        shortName={shortName(name).split(' ')[0]}
        email={settings?.email}
        onOpenPalette={() => openPalette(true)}
      />
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette
            open={paletteOpen}
            onOpenChange={openPalette}
            projects={published}
            email={settings?.email}
            socials={socials}
          />
        </Suspense>
      )}
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero settings={settings} loading={isLoading} />
        <Work />
        <About settings={settings} loading={isLoading} />
        <Skills />
        <Path />
        <Contact settings={settings} loading={isLoading}>
          {/* Client-only (a lazy chunk can't pre-render), and only fetched once the visitor
              scrolls near Contact, so it doesn't compete with the first paint. */}
          <div ref={formRef}>
            {formNear ? (
              <Suspense fallback={<Skeleton className="mt-10 h-96" />}>
                <ContactForm />
              </Suspense>
            ) : (
              <Skeleton className="mt-10 h-96" />
            )}
          </div>
        </Contact>
      </main>
      <Footer name={shortName(name)} socials={socials} />
    </>
  )
}
