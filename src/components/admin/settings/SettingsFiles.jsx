import FileUploadCard from '../FileUploadCard'
import { FormSection } from '../FormFields'
import { useSaveSettings } from '../../../hooks/queries'
import { removeFiles, uploadToFolder } from '../../../lib/storage'
import { useToast } from '../../../hooks/useToast'
import { errorMessage } from '../../../lib/utils'

/** OG image and resume PDF. Each upload saves right away and deletes the file it replaces. */
export default function SettingsFiles({ settings }) {
  const save = useSaveSettings()
  const toast = useToast()

  const replace = (field, folder, opts) => async (file, onProgress) => {
    try {
      const { path, url } = await uploadToFolder(file, folder, { ...opts, onProgress })
      const old = settings[`${field}_path`]
      await save.mutateAsync({ id: settings.id, [`${field}_url`]: url, [`${field}_path`]: path })
      await removeFiles([old])
      toast('Uploaded')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const remove = (field) => async () => {
    try {
      const old = settings[`${field}_path`]
      await save.mutateAsync({ id: settings.id, [`${field}_url`]: null, [`${field}_path`]: null })
      await removeFiles([old])
      toast('Removed')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  return (
    <FormSection
      title="Files"
      description="These save as soon as you upload. No need to press Save."
    >
      <FileUploadCard
        label="Social share image"
        hint="Shown when the site is shared on LinkedIn, WhatsApp, X, etc. 1200 × 630 works best."
        accept="image/png,image/jpeg,image/webp"
        url={settings.og_image_url}
        onUpload={replace('og_image', 'settings', { maxWidth: 1200 })}
        onRemove={remove('og_image')}
      />
      <div className="border-line border-t pt-5">
        <FileUploadCard
          label="Resume (PDF)"
          accept="application/pdf"
          kind="pdf"
          url={settings.resume_url}
          onUpload={replace('resume', 'settings')}
          onRemove={remove('resume')}
        />
      </div>
    </FormSection>
  )
}
