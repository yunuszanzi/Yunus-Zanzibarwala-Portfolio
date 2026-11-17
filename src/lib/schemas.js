import { z } from 'zod'

// Zod is used for form validation only.
const text = (label, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`)
const optText = (max = 2000) => z.string().trim().max(max, 'Too long').default('')
const optUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || /^https?:\/\/\S+$/i.test(v),
    'Enter a full URL starting with http(s)://',
  )
  .default('')
const sortOrder = z.coerce.number().int().default(0)

export const socialLinkSchema = z.object({
  label: text('Label', 40),
  url: z
    .string()
    .trim()
    .regex(/^(https?:\/\/|mailto:|tel:)\S+$/i, 'Enter a valid URL'),
})

export const settingsSchema = z.object({
  site_name: text('Site name', 80),
  hero_eyebrow: optText(120),
  hero_headline: text('Headline', 220),
  hero_subheading: optText(500),
  cta_primary_label: text('Button label', 40),
  cta_secondary_label: text('Button label', 40),
  now_text: optText(200),
  based_text: optText(200),
  open_to_text: optText(200),
  about_headline: optText(160),
  about_paragraphs: optText(6000),
  contact_headline: optText(160),
  contact_pitch: optText(600),
  email: z.string().trim().email('Enter a valid email'),
  phone: optText(40),
  social_links: z.array(socialLinkSchema).default([]),
  seo_title: optText(70),
  seo_description: optText(200),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex color like #e9b44c'),
  chat_enabled: z.boolean().default(true),
  chat_greeting: text('Greeting', 500),
  chat_fallback: text('Fallback message', 500),
})

/** Predefined chat answer. Keywords are words or short phrases that trigger it. */
export const chatReplySchema = z.object({
  label: optText(80),
  keywords: z.array(z.string().trim().min(1)).min(1, 'Add at least one keyword'),
  answer: text('Answer', 1500),
  sort_order: sortOrder,
})

export const statSchema = z.object({
  value: text('Value', 20),
  label: text('Label', 80),
  sort_order: sortOrder,
})

export const serviceSchema = z.object({
  title: text('Title', 80),
  description: optText(500),
  sort_order: sortOrder,
})

export const categorySchema = z.object({
  title: text('Title', 80),
  description: optText(300),
  sort_order: sortOrder,
})

// Form shape: bullets are edited as one-per-line text and split before saving.
export const featureGroupSchema = z.object({
  heading: text('Heading', 80),
  bullets_text: z.string().max(3000, 'Too long').default(''),
})

/** "a\n\n b " -> ["a", "b"] */
export const linesToArray = (text = '') =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export const projectSchema = z.object({
  title: text('Title', 100),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only'),
  // Plain string: Zod 4's uuid() rejects the seed's fixed category ids.
  category_id: z.string().default(''),
  year: optText(10),
  description: optText(1200),
  role: optText(120),
  tech: z.array(z.string().trim().min(1)).default([]),
  live_url: optUrl,
  repo_label: optText(80),
  repo_url: optUrl,
  is_private: z.boolean().default(false),
  feature_groups: z.array(featureGroupSchema).max(6).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  sort_order: sortOrder,
})

export const projectImageSchema = z.object({
  caption: optText(200),
  step_label: optText(80),
})

export const skillGroupSchema = z.object({
  name: text('Group name', 60),
  skills: z.array(z.string().trim().min(1)).default([]),
  sort_order: sortOrder,
})

export const experienceSchema = z
  .object({
    role: text('Role', 100),
    company: text('Company', 100),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().default(''),
    is_current: z.boolean().default(false),
    // One bullet per line in the form; split with linesToArray before saving.
    bullets_text: z.string().max(4000, 'Too long').default(''),
    sort_order: sortOrder,
  })
  .refine((v) => v.is_current || v.end_date, {
    path: ['end_date'],
    message: 'Add an end date or mark this as current',
  })

export const educationSchema = z.object({
  degree: text('Degree', 120),
  institution: text('Institution', 120),
  start_year: optText(4),
  end_year: optText(10),
  sort_order: sortOrder,
})

export const alsoShippedSchema = z.object({
  title: text('Title', 80),
  description: optText(300),
  url: optUrl,
  sort_order: sortOrder,
})

/** Public contact form. `website` is the honeypot: real users leave it empty. */
export const contactSchema = z.object({
  name: text('Name', 120),
  email: z.string().trim().email('Enter a valid email').max(200),
  message: z
    .string()
    .trim()
    .min(10, 'Tell me a bit more (at least 10 characters)')
    .max(5000, 'Message is too long'),
  // Honeypot. Not validated here on purpose: a filled value is dropped silently in
  // useSendMessage, so bots get a "success" and learn nothing.
  website: z.string().optional().default(''),
})
