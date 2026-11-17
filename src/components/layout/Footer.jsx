/** @param {{ name: string, socials?: {label:string,url:string}[] }} props */
export default function Footer({ name, socials = [] }) {
  return (
    <footer className="border-line border-t">
      <div className="text-muted mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          &copy; {new Date().getFullYear()} {name}
        </p>
        {socials.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-fg inline-flex min-h-11 items-center transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  )
}
