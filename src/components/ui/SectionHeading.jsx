import Reveal from './Reveal'

/**
 * Eyebrow label + large heading used at the top of every section.
 * @param {{ index: string, label: string, title?: string, id?: string }} props
 */
export default function SectionHeading({ index, label, title, id }) {
  return (
    <Reveal className="mb-12 md:mb-16">
      <p className="text-muted mb-4 flex items-center gap-3 font-mono text-xs tracking-[0.2em] uppercase">
        <span className="text-accent">{index}</span>
        <span className="bg-line h-px w-8" aria-hidden="true" />
        {label}
      </p>
      {title && (
        <h2
          id={id}
          className="font-display max-w-3xl text-4xl leading-[1.05] tracking-tight md:text-6xl"
        >
          {title}
        </h2>
      )}
    </Reveal>
  )
}
