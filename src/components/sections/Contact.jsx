import { ArrowUpRight, Check, Copy, Mail, Phone } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'
import Reveal from '../ui/Reveal'
import Button from '../ui/Button'
import { SkeletonText } from '../ui/Skeleton'
import { useCopy } from '../../hooks/useCopy'

function Method({ icon: Icon, label, value, href, external }) {
  return (
    <li className="border-line border-t">
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="group hover:text-accent flex min-h-14 items-center gap-4 py-4 transition-colors"
      >
        <Icon
          size={18}
          aria-hidden="true"
          className="text-muted group-hover:text-accent shrink-0"
        />
        <span className="text-muted hidden w-24 shrink-0 font-mono text-xs tracking-widest uppercase sm:inline">
          {label}
        </span>
        <span className="sr-only sm:hidden">{label}: </span>
        <span className="min-w-0 truncate">{value}</span>
        <ArrowUpRight
          size={15}
          aria-hidden="true"
          className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </a>
    </li>
  )
}

/** @param {{ settings: any, loading: boolean, children?: import('react').ReactNode }} props */
export default function Contact({ settings, loading, children }) {
  const { copied, copy } = useCopy()
  const socials = settings?.social_links ?? []

  return (
    <section id="contact" aria-labelledby="contact-title" className="px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index="05"
          label="Contact"
          title={settings?.contact_headline || 'Get in touch'}
          id="contact-title"
        />
        {loading || !settings ? (
          <SkeletonText lines={4} className="max-w-xl" />
        ) : (
          <div className="grid gap-16 md:grid-cols-12 [&>*]:min-w-0">
            <Reveal className="md:col-span-6">
              <p className="text-muted max-w-lg text-lg leading-relaxed">
                {settings.contact_pitch}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={`mailto:${settings.email}`}>
                  <Mail size={16} aria-hidden="true" /> Say hello
                </Button>
                <Button variant="ghost" onClick={() => copy(settings.email)}>
                  {copied ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <Copy size={16} aria-hidden="true" />
                  )}
                  {copied ? 'Copied' : 'Copy email'}
                </Button>
                <span role="status" aria-live="polite" className="sr-only">
                  {copied ? 'Email address copied to clipboard' : ''}
                </span>
              </div>
              {children}
            </Reveal>
            <Reveal className="md:col-span-6" delay={0.08}>
              <ul className="border-line border-b">
                <Method
                  icon={Mail}
                  label="Email"
                  value={settings.email}
                  href={`mailto:${settings.email}`}
                />
                {settings.phone && (
                  <Method
                    icon={Phone}
                    label="Phone"
                    value={settings.phone}
                    href={`tel:${settings.phone.replace(/\s/g, '')}`}
                  />
                )}
                {socials.map((s) => (
                  <Method
                    key={s.url}
                    icon={ArrowUpRight}
                    label={s.label}
                    value={s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                    href={s.url}
                    external
                  />
                ))}
              </ul>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  )
}
