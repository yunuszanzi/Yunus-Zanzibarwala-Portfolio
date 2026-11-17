import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import FileUploadCard from '../FileUploadCard'
import { FormSection } from '../FormFields'
import Button from '../../ui/Button'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { useDeleteProject, useSaveProject } from '../../../hooks/queries'
import { removeFiles, uploadToFolder } from '../../../lib/storage'
import { useToast } from '../../../hooks/useToast'
import { errorMessage } from '../../../lib/utils'

/** Cover image and delete, for a saved project. Both act immediately. */
export default function ProjectExtras({ project }) {
  const navigate = useNavigate()
  const toast = useToast()
  const save = useSaveProject()
  const remove = useDeleteProject()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const uploadCover = async (file, onProgress) => {
    try {
      const { path, url } = await uploadToFolder(file, `projects/${project.id}/cover`, {
        onProgress,
      })
      await save.mutateAsync({ id: project.id, cover_image_url: url, cover_image_path: path })
      await removeFiles([project.cover_image_path])
      toast('Cover image uploaded')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const removeCover = async () => {
    try {
      await save.mutateAsync({ id: project.id, cover_image_url: null, cover_image_path: null })
      await removeFiles([project.cover_image_path])
      toast('Cover image removed')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  const onDelete = async () => {
    try {
      await remove.mutateAsync(project)
      toast(`Deleted “${project.title}”`)
      navigate('/admin/projects', { replace: true })
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  return (
    <>
      <FormSection
        title="Cover image"
        description="Optional. Used as the thumbnail in the admin and for link previews."
      >
        <FileUploadCard
          label="Cover image"
          accept="image/png,image/jpeg,image/webp"
          url={project.cover_image_url}
          onUpload={uploadCover}
          onRemove={removeCover}
        />
      </FormSection>
      <FormSection title="Danger zone">
        <Button
          variant="ghost"
          className="border-danger/40 text-danger hover:bg-danger/10"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={15} aria-hidden="true" /> Delete project
        </Button>
      </FormSection>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={onDelete}
        title={`Delete “${project.title}”?`}
        message="The project and all its screenshots are deleted, including the image files in storage. This can’t be undone."
      />
    </>
  )
}
