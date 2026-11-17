import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../../lib/site'

/** Social profile URLs from settings, for JSON-LD sameAs. */
const profileUrls = (links = []) => links.map((l) => l.url).filter((u) => /^https?:\/\//.test(u))

function buildJsonLd(settings, projects) {
  const person = {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: settings.site_name,
    jobTitle: settings.hero_eyebrow?.split('/').pop()?.trim() || undefined,
    url: `${SITE_URL}/`,
    email: settings.email ? `mailto:${settings.email}` : undefined,
    telephone: settings.phone || undefined,
    // "Karachi, Pakistan (PKT, UTC+5)" -> locality "Karachi", country "Pakistan"
    address: settings.based_text
      ? {
          '@type': 'PostalAddress',
          addressLocality: settings.based_text.split(/[,(]/)[0].trim(),
          addressCountry: settings.based_text.split(',')[1]?.split('(')[0].trim() || undefined,
        }
      : undefined,
    sameAs: profileUrls(settings.social_links),
    image: settings.og_image_url || undefined,
  }
  const works = projects.map((p) => ({
    '@type': 'CreativeWork',
    '@id': `${SITE_URL}/#project-${p.slug}`,
    name: p.title,
    url: `${SITE_URL}/#project-${p.slug}`,
    description: p.description || undefined,
    dateCreated: /^\d{4}$/.test(p.year) ? p.year : undefined,
    keywords: p.tech?.length ? p.tech.join(', ') : undefined,
    image: p.cover_image_url || p.project_images?.[0]?.image_url || undefined,
    creator: { '@id': `${SITE_URL}/#person` },
  }))
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: settings.site_name,
        author: { '@id': `${SITE_URL}/#person` },
      },
      person,
      ...works,
    ],
  }
}

/**
 * Meta tags + structured data for the home page, all from Site settings.
 * @param {{ settings: any, projects: any[] }} props
 */
export default function Seo({ settings, projects = [] }) {
  if (!settings) return null
  const title = settings.seo_title || settings.site_name
  const description = settings.seo_description
  const url = `${SITE_URL}/`
  const image = settings.og_image_url || `${SITE_URL}/og.png`
  // JSON in a <script> must not contain "</script>".
  const jsonLd = JSON.stringify(buildJsonLd(settings, projects)).replace(/</g, '\\u003c')

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${settings.site_name}, portfolio`} />
      <meta property="og:site_name" content={settings.site_name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json">{jsonLd}</script>
    </Helmet>
  )
}
