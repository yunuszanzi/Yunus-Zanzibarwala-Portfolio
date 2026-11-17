import { useEffect, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import SortableList from '../SortableList'
import ImageCard from './ImageCard'
import { ProgressBar } from '../FileUploadCard'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { FormSection } from '../FormFields'
import {
  useDeleteProjectImage,
  useReorderProjectImages,
  useSaveProjectImage,
} from '../../../hooks/queries'
import { SCREENSHOT_SIZE, uploadToFolder } from '../../../lib/storage'
import { useToast } from '../../../hooks/useToast'
import { cn, errorMessage } from '../../../lib/utils'

/** "03-transfer-funds.png" -> "Transfer funds" */
function labelFromFilename(name) {
  const base = name
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+[\s._-]*/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
  return base ? base[0].toUpperCase() + base.slice(1) : ''
}

/** Screenshot manager for a saved project. */
export default function ProjectImages({ project }) {
  const toast = useToast()
  const saveImage = useSaveProjectImage()
  const deleteImage = useDeleteProjectImage()
  const reorder = useReorderProjectImages()
  const inputRef = useRef(null)
  const [images, setImages] = useState(project.project_images ?? [])
  const [uploads, setUploads] = useState([]) // { name, progress }
  const [dragOver, setDragOver] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => setImages(project.project_images ?? []), [project.project_images])

  const uploadFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return toast('Pick image files (PNG, JPG, WebP).', 'error')
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    setUploads(files.map((f) => ({ name: f.name, progress: 0 })))
    let order = images.reduce((m, i) => Math.max(m, i.sort_order), 0)
    let done = 0
    for (const [idx, file] of files.entries()) {
      try {
        const { path, url } = await uploadToFolder(file, `projects/${project.id}`, {
          ...SCREENSHOT_SIZE,
          onProgress: (p) =>
            setUploads((u) => u.map((x, j) => (j === idx ? { ...x, progress: p } : x))),
        })
        order += 1
        await saveImage.mutateAsync({
          project_id: project.id,
          image_url: url,
          storage_path: path,
          step_label: labelFromFilename(file.name),
          caption: '',
          sort_order: order,
        })
        done += 1
      } catch (err) {
        toast(`${file.name}: ${errorMessage(err)}`, 'error')
      }
    }
    setUploads([])
    if (done) toast(done === 1 ? 'Screenshot added' : `${done} screenshots added`)
  }

  const onReorder = (rows) => {
    setImages(rows)
    reorder.mutate(rows, {
      onSuccess: () => toast('Order saved'),
      onError: (e) => {
        setImages(project.project_images ?? [])
        toast(errorMessage(e), 'error')
      },
    })
  }

  const onSaveField = (img, patch) =>
    saveImage.mutate(
      { id: img.id, ...patch },
      { onSuccess: () => toast('Saved'), onError: (e) => toast(errorMessage(e), 'error') },
    )

  const onDelete = async () => {
    try {
      await deleteImage.mutateAsync(toDelete)
      toast('Screenshot deleted')
    } catch (e) {
      toast(errorMessage(e), 'error')
    }
  }

  return (
    <FormSection
      title="Screenshots"
      description="Shown in the scroll gallery, in this order. The frame is 16:9, so 1600 × 900 (or any 16:9 size, like 1920 × 1080) fills it exactly. Images are resized to 1600 × 900 and saved as WebP. Changes save straight away."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          uploadFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-accent bg-accent/5' : 'border-line',
        )}
      >
        <ImagePlus size={24} className="text-muted" aria-hidden="true" />
        <p className="text-sm">
          Drop images here or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploads.length > 0}
            className="text-accent font-medium underline-offset-4 hover:underline"
          >
            choose files
          </button>
        </p>
        <p className="text-muted text-xs">
          Tip: name files like “01-sign-in.png” to set the order and step label.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="sr-only"
          aria-label="Choose screenshots to upload"
          onChange={(e) => {
            uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2" aria-label="Uploads in progress">
          {uploads.map((u) => (
            <li key={u.name} className="space-y-1">
              <p className="text-muted truncate text-xs">{u.name}</p>
              <ProgressBar value={u.progress} label={`Uploading ${u.name}`} />
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 && uploads.length === 0 && (
        <p className="text-muted text-sm">No screenshots yet.</p>
      )}
      {images.length > 0 && (
        <SortableList
          grid
          items={images}
          onReorder={onReorder}
          getLabel={(img) => img.step_label || 'screenshot'}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          renderItem={(img, handle) => (
            <ImageCard
              key={img.id}
              image={img}
              index={images.findIndex((i) => i.id === img.id)}
              total={images.length}
              handle={handle}
              onSave={(patch) => onSaveField(img, patch)}
              onDelete={() => setToDelete(img)}
            />
          )}
        />
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        title="Delete this screenshot?"
        message="The image file is removed from storage too."
      />
    </FormSection>
  )
}
