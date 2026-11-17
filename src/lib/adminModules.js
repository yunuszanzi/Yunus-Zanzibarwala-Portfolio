import {
  alsoShippedSchema,
  categorySchema,
  chatReplySchema,
  educationSchema,
  experienceSchema,
  linesToArray,
  serviceSchema,
  skillGroupSchema,
  statSchema,
} from './schemas'
import {
  alsoShipped,
  categories,
  chatReplies,
  education,
  experiences,
  services,
  skillGroups,
  stats,
} from '../hooks/queries'
import { formatMonthYear } from './utils'

/**
 * Config for the simple list modules. Each one gets a sortable list + edit dialog.
 * Field types: text, textarea, url, date, chips, lines (textarea -> string[]), switch.
 */
export const MODULES = {
  categories: {
    title: 'Project categories',
    description: 'Groups on the Work section. Drag to change the order.',
    noun: 'category',
    hooks: categories,
    schema: categorySchema,
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'One-line description', type: 'textarea', rows: 2 },
    ],
    summary: (r) => [r.title, r.description],
    deleteNote: 'Projects in this category stay, but lose their category until you pick a new one.',
  },
  stats: {
    title: 'Stats',
    description: 'The big numbers in the About section. Four fit best.',
    noun: 'stat',
    hooks: stats,
    schema: statSchema,
    fields: [
      { name: 'value', label: 'Value', type: 'text', placeholder: '5+' },
      { name: 'label', label: 'Label', type: 'text', placeholder: 'Years building software' },
    ],
    summary: (r) => [`${r.value} · ${r.label}`],
  },
  services: {
    title: 'What I do',
    description: 'The short list next to your bio. Three or four items.',
    noun: 'item',
    hooks: services,
    schema: serviceSchema,
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    ],
    summary: (r) => [r.title, r.description],
  },
  skills: {
    title: 'Skill groups',
    description: 'Shown in the Skills section, in this order.',
    noun: 'group',
    hooks: skillGroups,
    schema: skillGroupSchema,
    fields: [
      { name: 'name', label: 'Group name', type: 'text', placeholder: 'Frontend' },
      {
        name: 'skills',
        label: 'Skills',
        type: 'chips',
        hint: 'Press Enter or comma after each one.',
      },
    ],
    summary: (r) => [r.name, r.skills.join(', ')],
    getLabel: (r) => r.name,
  },
  experience: {
    title: 'Experience',
    description: 'Your work history. Put the most recent first.',
    noun: 'role',
    hooks: experiences,
    schema: experienceSchema,
    fields: [
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'start_date', label: 'Start date', type: 'date', half: true },
      { name: 'end_date', label: 'End date', type: 'date', half: true },
      { name: 'is_current', label: 'I work here now', type: 'switch' },
      {
        name: 'bullets_text',
        label: 'What you did',
        type: 'textarea',
        rows: 5,
        hint: 'One bullet per line.',
      },
    ],
    summary: (r) => [
      `${r.role} · ${r.company}`,
      `${formatMonthYear(r.start_date)} – ${r.is_current ? 'Present' : formatMonthYear(r.end_date)}`,
    ],
    getLabel: (r) => r.role,
    toForm: (r) => ({
      ...r,
      end_date: r.end_date ?? '',
      start_date: r.start_date ?? '',
      bullets_text: (r.bullets ?? []).join('\n'),
    }),
    toRow: ({ bullets_text, ...v }) => ({
      ...v,
      end_date: v.is_current || !v.end_date ? null : v.end_date,
      bullets: linesToArray(bullets_text),
    }),
  },
  education: {
    title: 'Education',
    noun: 'entry',
    hooks: education,
    schema: educationSchema,
    fields: [
      { name: 'degree', label: 'Degree', type: 'text' },
      { name: 'institution', label: 'Institution', type: 'text' },
      { name: 'start_year', label: 'Start year', type: 'text', half: true, placeholder: '2018' },
      { name: 'end_year', label: 'End year', type: 'text', half: true, placeholder: '2022' },
    ],
    summary: (r) => [
      `${r.degree} · ${r.institution}`,
      [r.start_year, r.end_year].filter(Boolean).join(' – '),
    ],
    getLabel: (r) => r.degree,
  },
  'also-shipped': {
    title: 'Also shipped',
    description: 'Smaller projects listed under Experience.',
    noun: 'project',
    hooks: alsoShipped,
    schema: alsoShippedSchema,
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'One-liner', type: 'textarea', rows: 2 },
      { name: 'url', label: 'Link (optional)', type: 'url', placeholder: 'https://' },
    ],
    summary: (r) => [r.title, r.description],
    toRow: (v) => ({ ...v, url: v.url || null }),
  },
  'chat-replies': {
    title: 'Chat replies',
    description:
      'Answers the site chat gives. When a visitor’s message contains a keyword, they get that answer; longer phrases win over single words. Order breaks ties.',
    noun: 'reply',
    hooks: chatReplies,
    schema: chatReplySchema,
    fields: [
      {
        name: 'label',
        label: 'Suggested question (optional)',
        type: 'text',
        placeholder: 'How much does a project cost?',
        hint: 'Shown as a button visitors can tap.',
      },
      {
        name: 'keywords',
        label: 'Keywords',
        type: 'chips',
        hint: 'Words or short phrases, e.g. price, cost, how much. Press Enter after each.',
      },
      { name: 'answer', label: 'Answer', type: 'textarea', rows: 4 },
    ],
    summary: (r) => [r.label || r.keywords.slice(0, 4).join(', '), r.answer],
    getLabel: (r) => r.label || r.keywords[0] || 'reply',
  },
}
