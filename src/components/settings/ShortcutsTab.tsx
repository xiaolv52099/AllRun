import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { AppConfig } from '../../types'
import { useI18n } from '../../hooks/useI18n'

type ShortcutKey = keyof AppConfig['shortcuts']

interface ShortcutItem {
  key: ShortcutKey
  labelKey: string
  descriptionKey: string
}

const shortcutItems: ShortcutItem[] = [
  {
    key: 'toggleWindow',
    labelKey: 'shortcuts.toggleWindow',
    descriptionKey: 'shortcuts.toggleWindowDesc',
  },
  {
    key: 'openSettings',
    labelKey: 'shortcuts.openSettings',
    descriptionKey: 'shortcuts.openSettingsDesc',
  },
]

export default function ShortcutsTab() {
  const { config, setConfig } = useStore()
  const { t } = useI18n()
  const [editingKey, setEditingKey] = useState<ShortcutKey | null>(null)
  const [tempShortcut, setTempShortcut] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingKey && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingKey])

  const handleKeyCapture = async (e: React.KeyboardEvent, key: ShortcutItem['key']) => {
    if (!config) return

    e.preventDefault()
    e.stopPropagation()

    const keys: string[] = []

    if (e.metaKey) keys.push('Cmd')
    if (e.ctrlKey) keys.push('Ctrl')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')

    // 添加主键
    const mainKey = e.key.toUpperCase()
    if (!['META', 'CONTROL', 'ALT', 'SHIFT'].includes(mainKey)) {
      keys.push(mainKey === ' ' ? 'Space' : mainKey)
    }

    if (keys.length > 1) {
      const shortcut = keys.join('+')
      setTempShortcut(shortcut)

      // 保存
      try {
        const newConfig = {
          ...config,
          shortcuts: {
            ...config?.shortcuts,
            [key]: shortcut,
          },
        }
        const savedConfig = await window.electronAPI.updateConfig(newConfig)
        setConfig(savedConfig)
        setEditingKey(null)
      } catch (error) {
        console.error('Failed to update shortcut:', error)
        alert(t('shortcuts.updateFailed'))
      }
    }
  }

  const formatShortcut = (shortcut: string) => {
    return shortcut
      .replace('CommandOrControl', 'Cmd')
      .replace(/\+/g, ' + ')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t('shortcuts.title')}</h3>

      <div className="space-y-3">
        {shortcutItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg"
          >
            <div>
              <p className="text-sm text-[var(--color-text-primary)]">{t(item.labelKey)}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{t(item.descriptionKey)}</p>
            </div>

            {editingKey === item.key ? (
              <input
                ref={inputRef}
                type="text"
                value={tempShortcut || t('shortcuts.capturePlaceholder')}
                onKeyDown={(e) => handleKeyCapture(e, item.key)}
                onBlur={() => setEditingKey(null)}
                className="w-32 px-2 py-1 text-sm text-center text-[var(--color-text-primary)] border border-[var(--color-accent)] rounded bg-[var(--color-bg-primary)] focus:outline-none"
                readOnly
              />
            ) : (
              <button
                onClick={() => {
                  setEditingKey(item.key)
                  setTempShortcut('')
                }}
                className="px-3 py-1 text-sm font-mono text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded hover:border-[var(--color-accent)] transition-colors"
              >
                {formatShortcut(config?.shortcuts?.[item.key] || '')}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--color-text-secondary)]">
        {t('shortcuts.pressHint')}
      </p>
    </div>
  )
}
