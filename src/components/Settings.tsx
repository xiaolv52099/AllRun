import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../stores/useStore'
import GeneralTab from './settings/GeneralTab'
import ShortcutsTab from './settings/ShortcutsTab'
import CommandsTab from './settings/CommandsTab'
import { useI18n } from '../hooks/useI18n'

type SettingsTab = 'general' | 'shortcuts' | 'commands'

export default function Settings() {
  const { setConfig } = useStore()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const isWindows = useMemo(
    () => typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('win'),
    []
  )

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: t('settings.tab.general') },
    { id: 'shortcuts', label: t('settings.tab.shortcuts') },
    { id: 'commands', label: t('settings.tab.commands') },
  ]

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await window.electronAPI.getConfig()
        setConfig(data)
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }
    loadConfig()
  }, [setConfig])

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="drag-region relative h-8 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        {!isWindows && (
          <div className="absolute left-2 inset-y-0 flex items-center">
            <button
              onClick={() => window.electronAPI.closeSettingsWindow()}
              className="no-drag w-3 h-3 rounded-full bg-[#ff5f57] flex items-center justify-center hover:brightness-110 transition"
              title={t('window.close')}
            >
              <X className="w-2 h-2 text-black/80" strokeWidth={2.5} />
            </button>
          </div>
        )}
        {isWindows && (
          <div className="absolute right-2 inset-y-0 flex items-center no-drag">
            <button
              onClick={() => window.electronAPI.closeSettingsWindow()}
              className="h-6 w-10 flex items-center justify-center rounded-sm text-[var(--color-text-secondary)] hover:text-white hover:bg-[#e81123] transition-colors"
              title={t('window.close')}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-[var(--color-title)] font-medium">{t('settings.title')}</span>
        </div>
      </div>

      <div className="no-drag flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <p className="text-xs text-[var(--color-text-secondary)]">{t('window.dragResizeHint')}</p>
        </div>

        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[var(--color-text-strong)] border-b-2 border-[var(--color-accent)] bg-[var(--color-bg-tab-active)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'shortcuts' && <ShortcutsTab />}
          {activeTab === 'commands' && <CommandsTab />}
        </div>
      </div>
    </div>
  )
}
