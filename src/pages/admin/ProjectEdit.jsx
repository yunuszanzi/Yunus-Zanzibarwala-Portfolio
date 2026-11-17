import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, Loader2 } from 'lucide-react'
import PageHeader from '../../components/admin/PageHeader'
import { FormSection, SwitchField, TextField } from '../../components/admin/FormFields'
import ChipInput from '../../components/admin/ChipInput'
import FeatureGroups from '../../components/admin/projects/FeatureGroups'
import ProjectImages from '../../components/admin/projects/ProjectImages'
import ProjectExtras from '../../components/admin/projects/ProjectExtras'
import ProjectPreview from '../../components/admin/projects/ProjectPreview'
import { toFormValues, toRow } from '../../components/admin/projects/projectForm'
import Button from '../../components/ui/Button'
import { Field, inputClass } from '../../components/ui/Field'
import { SkeletonText } from '../../components/ui/Skeleton'
import ErrorNote from '../../components/ui/ErrorNote'
import { projectSchema } from '../../lib/schemas'
import {
  categories as categoryHooks,
  useProject,
  useProjects,
  useSaveProject,
} from '../../hooks/queries'
import { useToast } from '../../hooks/useToast'
import { errorMessage, slugify } from '../../lib/utils'

function ProjectForm({ project }) {
  const isNew = !project
  const navigate = useNavigate()
  const toast = useToast()
  const save = useSaveProject()
  const { data: all } = useProjects()
  const { data: cats } = categoryHooks.useList()
  const [preview, setPreview] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: toFormValues(project),
  })
  const { isSubmitting, isDirty } = form.formState
  const titleField = form.register('title')

  const onSubmit = async (values) => {
    try {
      const row = toRow(values)
      if (isNew) row.sort_order = (all ?? []).reduce((m, p) => Math.max(m, p.sort_order), 0) + 1
      const saved = await save.mutateAsync({ id: project?.id, ...row })
      toast(isNew ? 'Project created. Now add screenshots.' : 'Project saved')
      if (isNew) navigate(`/admin/projects/${saved.id}`, { replace: true })
      else form.reset(toFormValues(saved))
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const previewProject = () => ({
    ...project,
    ...toRow(form.getValues()),
    project_images: project?.project_images ?? [],
  })

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <FormSection title="Basics">
          <TextField
            form={form}
            name="title"
            label="Title"
            {...titleField}
            onChange={(e) => {
              titleField.onChange(e)
              if (!slugTouched)
                form.setValue('slug', slugify(e.target.value), { shouldValidate: true })
            }}
          />
          <TextField
            form={form}
            name="slug"
            label="Slug"
            hint="Used in the link to this project, e.g. /#project-your-slug."
            onInput={() => setSlugTouched(true)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" error={form.formState.errors.category_id?.message}>
              {(p) => (
                <select {...p} {...form.register('category_id')} className={inputClass}>
                  <option value="">No category</option>
                  {cats?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <TextField form={form} name="year" label="Year" placeholder="2025" />
          </div>
          <TextField form={form} name="description" label="Short description" textarea rows={4} />
          <TextField form={form} name="role" label="Your role" placeholder="Lead developer" />
        </FormSection>

        <FormSection title="Stack & links">
          <Field label="Tech" hint="Press Enter or comma after each one.">
            {(p) => (
              <Controller
                control={form.control}
                name="tech"
                render={({ field }) => (
                  <ChipInput
                    {...p}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="React, Node.js…"
                  />
                )}
              />
            )}
          </Field>
          <TextField
            form={form}
            name="live_url"
            label="Live URL"
            type="url"
            placeholder="https://"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              form={form}
              name="repo_label"
              label="Repository label"
              placeholder="Source on GitHub"
            />
            <TextField
              form={form}
              name="repo_url"
              label="Repository URL"
              type="url"
              placeholder="https://"
            />
          </div>
          <SwitchField
            form={form}
            name="is_private"
            label="Private repository"
            description="Shows a “Private repository” label instead of a link."
          />
        </FormSection>

        <FeatureGroups form={form} />

        <FormSection title="Visibility">
          <SwitchField
            form={form}
            name="published"
            label="Published"
            description="Drafts are only visible here in the admin."
          />
          <SwitchField form={form} name="featured" label="Featured" />
        </FormSection>

        <div className="border-line bg-bg/90 sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
          {isDirty && <span className="text-muted mr-auto text-sm">Unsaved changes</span>}
          <Button variant="ghost" onClick={() => setPreview(true)}>
            <Eye size={16} aria-hidden="true" /> Preview
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Saving…' : isNew ? 'Create project' : 'Save project'}
          </Button>
        </div>
      </form>

      {isNew ? (
        <p className="border-line text-muted rounded-xl border border-dashed p-6 text-sm">
          Create the project first, then you can add screenshots and a cover image.
        </p>
      ) : (
        <>
          <ProjectImages project={project} />
          <ProjectExtras project={project} />
        </>
      )}

      <ProjectPreview
        open={preview}
        onClose={() => setPreview(false)}
        project={preview ? previewProject() : null}
      />
    </div>
  )
}

export default function ProjectEdit() {
  const { id } = useParams()
  const isNew = id === 'new'
  const { data, isLoading, error } = useProject(isNew ? null : id)
  return (
    <>
      <Link
        to="/admin/projects"
        className="text-muted hover:text-fg mb-4 inline-flex min-h-11 items-center gap-2 text-sm"
      >
        <ArrowLeft size={15} aria-hidden="true" /> All projects
      </Link>
      <PageHeader title={isNew ? 'New project' : data?.title || 'Edit project'} />
      {!isNew && isLoading && <SkeletonText lines={8} />}
      {!isNew && error && <ErrorNote what="this project" />}
      {(isNew || data) && <ProjectForm key={id} project={isNew ? null : data} />}
    </>
  )
}
