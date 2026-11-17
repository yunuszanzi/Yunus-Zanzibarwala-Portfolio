import Modal from '../../ui/Modal'
import ProjectShowcase from '../../sections/ProjectShowcase'
import ProjectGallery from '../../sections/ProjectGallery'

/**
 * Shows the project block exactly as the public site renders it (with the swipe gallery,
 * since the scroll-driven one needs the full page to scroll).
 * @param {{ open: boolean, onClose: () => void, project: any }} props
 */
export default function ProjectPreview({ open, onClose, project }) {
  return (
    <Modal open={open} onClose={onClose} title="Preview" size="xl">
      {project && (
        <div className="-mt-16">
          <ProjectShowcase
            project={project}
            index={Math.max(0, (project.sort_order ?? 1) - 1)}
            gallery={<ProjectGallery images={project.project_images ?? []} title={project.title} />}
          />
        </div>
      )}
    </Modal>
  )
}
