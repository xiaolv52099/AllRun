import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

interface CommandParamsDialogProps {
  commandName: string
  paramNames: string[]
  onCancel: () => void
  onConfirm: (input: string) => Promise<void> | void
}

export default function CommandParamsDialog({
  commandName,
  paramNames,
  onCancel,
  onConfirm,
}: CommandParamsDialogProps) {
  const { t } = useI18n()
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (submitting) return

    setSubmitting(true)
    try {
      await onConfirm(inputValue.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="w-[520px] max-w-[90vw] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 bg-[var(--color-bg-secondary)]">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {t('commandParam.title', { name: commandName })}
          </h3>
          <button
            onClick={onCancel}
            className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            title={t('window.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            {t('commandParam.schema', { schema: paramNames.join(' ') })}
          </p>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmit()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                onCancel()
              }
            }}
            placeholder={t('commandParam.placeholder', { schema: paramNames.join(' ') })}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded bg-[var(--color-accent)] px-3 py-1.5 text-sm text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
            >
              {t('common.execute')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
