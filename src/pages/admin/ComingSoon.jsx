import PageHeader from '../../components/admin/PageHeader'

/** Temporary page for modules built in Phase 7. */
export default function ComingSoon({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <p className="border-line text-muted rounded-xl border border-dashed p-8 text-sm">
        This editor isn’t built yet. It’s next on the list.
      </p>
    </>
  )
}
