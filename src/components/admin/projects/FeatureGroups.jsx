import { useFieldArray } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import Button from '../../ui/Button'
import { FormSection, TextField } from '../FormFields'

const MAX = 6

/** Repeatable "heading + bullet list" groups. Bullets are one per line. */
export default function FeatureGroups({ form }) {
  const groups = useFieldArray({ control: form.control, name: 'feature_groups' })
  return (
    <FormSection title="Feature groups" description="2–4 groups read best. One bullet per line.">
      {groups.fields.length === 0 && <p className="text-muted text-sm">No feature groups yet.</p>}
      {groups.fields.map((f, i) => (
        <fieldset key={f.id} className="border-line space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <legend className="text-muted font-mono text-xs">Group {i + 1}</legend>
            <Button
              variant="subtle"
              className="min-h-9 px-3"
              onClick={() => groups.remove(i)}
              aria-label={`Remove group ${i + 1}`}
            >
              <Trash2 size={15} />
            </Button>
          </div>
          <TextField form={form} name={`feature_groups.${i}.heading`} label="Heading" />
          <TextField
            form={form}
            name={`feature_groups.${i}.bullets_text`}
            label="Bullets"
            textarea
            rows={4}
            placeholder={'Fingerprint sign-in\nOffline mode'}
          />
        </fieldset>
      ))}
      {groups.fields.length < MAX && (
        <Button variant="ghost" onClick={() => groups.append({ heading: '', bullets_text: '' })}>
          <Plus size={15} aria-hidden="true" /> Add group
        </Button>
      )}
    </FormSection>
  )
}
