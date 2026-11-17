import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import PageHeader from '../../components/admin/PageHeader'
import { FormSection, TextField } from '../../components/admin/FormFields'
import SettingsFiles from '../../components/admin/settings/SettingsFiles'
import BackupCard from '../../components/admin/settings/BackupCard'
import Button from '../../components/ui/Button'
import { SkeletonText } from '../../components/ui/Skeleton'
import ErrorNote from '../../components/ui/ErrorNote'
import { settingsSchema } from '../../lib/schemas'
import { useSaveSettings, useSettings } from '../../hooks/queries'
import { useToast } from '../../hooks/useToast'
import { errorMessage } from '../../lib/utils'

const FIELDS = Object.keys(settingsSchema.shape)
const pick = (obj) =>
  Object.fromEntries(FIELDS.map((k) => [k, obj?.[k] ?? (k === 'social_links' ? [] : '')]))

function SettingsForm({ settings }) {
  const save = useSaveSettings()
  const toast = useToast()
  const form = useForm({ resolver: zodResolver(settingsSchema), defaultValues: pick(settings) })
  const social = useFieldArray({ control: form.control, name: 'social_links' })
  const accent = form.watch('accent_color')
  const { isSubmitting, isDirty } = form.formState

  const onSubmit = async (values) => {
    try {
      const saved = await save.mutateAsync({ id: settings?.id, ...values })
      form.reset(pick(saved))
      toast('Settings saved')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection title="Hero" description="The first thing people see.">
        <TextField
          form={form}
          name="site_name"
          label="Site name"
          hint="Your full name. Used in the footer and page titles."
        />
        <TextField
          form={form}
          name="hero_eyebrow"
          label="Eyebrow"
          hint="Small line above the headline, e.g. “Name / Job title”."
        />
        <TextField form={form} name="hero_headline" label="Headline" textarea rows={2} />
        <TextField form={form} name="hero_subheading" label="Subheading" textarea rows={3} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField form={form} name="cta_primary_label" label="Main button label" />
          <TextField form={form} name="cta_secondary_label" label="Second button label" />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField form={form} name="now_text" label="Now" />
          <TextField form={form} name="based_text" label="Based" />
          <TextField form={form} name="open_to_text" label="Open to" />
        </div>
      </FormSection>

      <FormSection title="About">
        <TextField form={form} name="about_headline" label="Headline" />
        <TextField
          form={form}
          name="about_paragraphs"
          label="Bio"
          textarea
          rows={8}
          hint="Markdown works: leave a blank line between paragraphs, **bold**, [links](https://…)."
        />
      </FormSection>

      <FormSection title="Contact">
        <TextField form={form} name="contact_headline" label="Headline" />
        <TextField form={form} name="contact_pitch" label="Short pitch" textarea rows={3} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField form={form} name="email" label="Email" type="email" />
          <TextField form={form} name="phone" label="Phone" type="tel" />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Social links</legend>
          {social.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <TextField
                form={form}
                name={`social_links.${i}.label`}
                label="Label"
                className="w-32 shrink-0 sm:w-40"
              />
              <TextField
                form={form}
                name={`social_links.${i}.url`}
                label="URL"
                className="min-w-0 flex-1"
              />
              <Button
                variant="subtle"
                className="mt-6 px-3"
                onClick={() => social.remove(i)}
                aria-label={`Remove link ${i + 1}`}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button variant="ghost" onClick={() => social.append({ label: '', url: '' })}>
            <Plus size={15} aria-hidden="true" /> Add link
          </Button>
        </fieldset>
      </FormSection>

      <FormSection
        title="Search & sharing"
        description="How the site appears in Google and link previews."
      >
        <TextField
          form={form}
          name="seo_title"
          label="Page title"
          hint="Around 50–60 characters."
        />
        <TextField
          form={form}
          name="seo_description"
          label="Description"
          textarea
          rows={2}
          hint="Around 150 characters."
        />
      </FormSection>

      <FormSection title="Look">
        <div className="flex items-end gap-3">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(accent) ? accent : '#e9b44c'}
            onChange={(e) =>
              form.setValue('accent_color', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            aria-label="Pick accent color"
            className="border-line h-11 w-14 cursor-pointer rounded-lg border bg-transparent p-1"
          />
          <TextField
            form={form}
            name="accent_color"
            label="Accent color"
            hint="Used for buttons and highlights in the dark theme."
            className="flex-1"
          />
        </div>
      </FormSection>

      <div className="border-line bg-bg/90 sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        {isDirty && <span className="text-muted text-sm">Unsaved changes</span>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}

export default function Settings() {
  const { data, isLoading, error } = useSettings()
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Site settings"
        description="Text and details used across the public site."
      />
      {isLoading && <SkeletonText lines={8} />}
      {error && <ErrorNote what="settings" />}
      {!isLoading && !error && (
        <div className="space-y-6">
          <SettingsForm settings={data} />
          {data && <SettingsFiles settings={data} />}
          <BackupCard />
        </div>
      )}
    </div>
  )
}
