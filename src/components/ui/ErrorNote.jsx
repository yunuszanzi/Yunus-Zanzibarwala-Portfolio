/** Small inline message when a section's data fails to load. */
export default function ErrorNote({ what = 'this section' }) {
  return (
    <p role="status" className="border-line text-muted rounded-lg border border-dashed p-4 text-sm">
      Couldn&apos;t load {what}. Refresh the page to try again.
    </p>
  )
}
