import { useStore } from '../../stores/useStore'
import { useState, useEffect } from 'react'
import { languageOptions, type LanguageCode } from '../../i18n'
import { useI18n } from '../../hooks/useI18n'

const defaultGeneralConfig = {
  autoStart: false,
  historyRetentionDays: 30,
  maxHistoryItems: 100,
  imageStorageLimitMB: 200,
}

const defaultAppearanceConfig = {
  theme: 'dark' as const,
  settingsZoom: 100,
  language: 'zh-CN' as LanguageCode,
}

export default function GeneralTab() {
  const { config, setConfig } = useStore()
  const { t } = useI18n()
  const [localGeneralConfig, setLocalGeneralConfig] = useState(config?.general || defaultGeneralConfig)
  const [localAppearanceConfig, setLocalAppearanceConfig] = useState(config?.appearance || defaultAppearanceConfig)

  useEffect(() => {
    if (config?.general) {
      setLocalGeneralConfig(config.general)
    }
    if (config?.appearance) {
      setLocalAppearanceConfig(config.appearance)
    }
  }, [config])

  const handleGeneralChange = async (key: string, value: boolean | number) => {
    if (!config) return

    const newGeneralConfig = { ...localGeneralConfig, [key]: value }
    setLocalGeneralConfig(newGeneralConfig)

    try {
      const updatedConfig = {
        ...config,
        general: newGeneralConfig,
      }
      const savedConfig = await window.electronAPI.updateConfig(updatedConfig)
      setConfig(savedConfig)
    } catch (error) {
      console.error('Failed to update config:', error)
    }
  }

  const saveAppearanceConfig = async (appearanceConfig: typeof localAppearanceConfig) => {
    if (!config) return

    try {
      const updatedConfig = {
        ...config,
        appearance: appearanceConfig,
      }
      const savedConfig = await window.electronAPI.updateConfig(updatedConfig)
      setConfig(savedConfig)
    } catch (error) {
      console.error('Failed to update appearance config:', error)
    }
  }

  const handleThemeChange = async (theme: 'dark' | 'light') => {
    const nextAppearanceConfig = {
      ...localAppearanceConfig,
      theme,
    }
    setLocalAppearanceConfig(nextAppearanceConfig)
    await saveAppearanceConfig(nextAppearanceConfig)
  }

  const handleLanguageChange = async (language: LanguageCode) => {
    const nextAppearanceConfig = {
      ...localAppearanceConfig,
      language,
    }
    setLocalAppearanceConfig(nextAppearanceConfig)
    await saveAppearanceConfig(nextAppearanceConfig)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t('settings.section.basic')}</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-primary)]">{t('settings.autoStart')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.autoStartDesc')}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localGeneralConfig.autoStart}
              onChange={(e) => handleGeneralChange('autoStart', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#ffffff] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#ffffff] after:border-[var(--color-border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-primary)]">{t('settings.historyRetentionDays')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.historyRetentionDaysDesc')}</p>
          </div>
          <input
            type="number"
            value={localGeneralConfig.historyRetentionDays}
            onChange={(e) => handleGeneralChange('historyRetentionDays', parseInt(e.target.value) || 30)}
            min={1}
            max={365}
            className="w-20 px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-primary)]">{t('settings.maxHistoryItems')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.maxHistoryItemsDesc')}</p>
          </div>
          <input
            type="number"
            value={localGeneralConfig.maxHistoryItems}
            onChange={(e) => handleGeneralChange('maxHistoryItems', parseInt(e.target.value) || 100)}
            min={10}
            max={1000}
            className="w-20 px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-primary)]">{t('settings.imageStorageLimit')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.imageStorageLimitDesc')}</p>
          </div>
          <input
            type="number"
            value={localGeneralConfig.imageStorageLimitMB}
            onChange={(e) => handleGeneralChange('imageStorageLimitMB', parseInt(e.target.value) || 200)}
            min={50}
            max={2000}
            className="w-20 px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t('settings.section.appearance')}</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-primary)]">{t('settings.theme')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.themeDesc')}</p>
          </div>
          <select
            value={localAppearanceConfig.theme}
            onChange={(e) => handleThemeChange(e.target.value as 'dark' | 'light')}
            className="w-28 px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="dark">{t('settings.themeDark')}</option>
            <option value="light">{t('settings.themeLight')}</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-primary)]">{t('settings.language')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.languageDesc')}</p>
          </div>
          <select
            value={localAppearanceConfig.language}
            onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
            className="w-36 px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            {languageOptions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.resizeTip')}</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t('settings.section.data')}</h3>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (confirm(t('settings.clearHistoryConfirm'))) {
                await window.electronAPI.clearHistory()
                const history = await window.electronAPI.getHistory()
                useStore.getState().setHistory(history)
              }
            }}
            className="px-3 py-1.5 text-sm text-[var(--color-danger)] border border-[var(--color-danger-border)] rounded hover:bg-[var(--color-danger-hover-bg)]"
          >
            {t('settings.clearHistory')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t('settings.section.system')}</h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--color-text-secondary)]">{t('settings.quitAppDesc')}</p>
          <button
            onClick={() => window.electronAPI.quitApp()}
            className="px-3 py-1.5 text-sm text-white bg-[var(--color-danger)] rounded hover:brightness-95"
          >
            {t('settings.quitApp')}
          </button>
        </div>
      </div>
    </div>
  )
}
