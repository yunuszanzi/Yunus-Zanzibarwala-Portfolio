/**
 * Title row for an admin page.
 * @param {{ title: string, description?: string, actions?: import('react').ReactNode }} props
 */
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
        {description && <p className="text-muted mt-2 max-w-xl text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
