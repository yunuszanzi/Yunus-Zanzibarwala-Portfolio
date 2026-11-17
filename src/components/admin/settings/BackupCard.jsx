import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Loader2, Upload } from 'lucide-react'
import Button from '../../ui/Button'
import ConfirmDialog from '../../ui/ConfirmDialog'
import { FormSection } from '../FormFields'
import { downloadJson, exportContent, importContent, validateBackup } from '../../../lib/backup'
import { useToast } from '../../../hooks/useToast'
import { errorMessage } from '../../../lib/utils'

export default function BackupCard() {
  const toast = useToast()
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [pending, setPending] = useState(null) // parsed backup waiting for confirmation

  const onExport = async () => {
    setExporting(true)
    try {
      const data = await exportContent()
      downloadJson(data, `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`)
      toast('Backup downloaded')
    } catch (err) {
      toast(errorMessage(err), 'error')
    } finally {
      setExporting(false)
    }
  }

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPending(validateBackup(JSON.parse(await file.text())))
    } catch (err) {
      toast(err instanceof SyntaxError ? 'That file isn’t valid JSON.' : err.message, 'error')
    }
  }

  const onImport = async () => {
    try {
      await importContent(pending)
      await qc.invalidateQueries()
      toast('Backup imported')
    } catch (err) {
      toast(errorMessage(err), 'error')
    }
  }

  return (
    <FormSection
      title="Backup"
      description="Download all content as a JSON file, or restore from one. Messages aren’t included. Uploaded files stay in storage; the backup only holds their links."
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={onExport} disabled={exporting}>
          {exporting ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Download size={15} aria-hidden="true" />
          )}
          Export JSON
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={15} aria-hidden="true" /> Import JSON
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onPick}
          className="sr-only"
          aria-label="Choose a backup file to import"
        />
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={onImport}
        title="Replace all content?"
        message={
          <>
            Everything on the site (settings, projects, skills, experience and the rest) is replaced
            with the backup from{' '}
            <strong className="text-fg">
              {pending?.exported_at ? new Date(pending.exported_at).toLocaleString() : 'this file'}
            </strong>
            . Export a fresh backup first if you’re not sure.
          </>
        }
        confirmLabel="Replace content"
      />
    </FormSection>
  )
}
