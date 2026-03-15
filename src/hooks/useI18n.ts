import { useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { t, type LanguageCode } from '../i18n'

export function useI18n() {
  const language = useStore((state) => state.config?.appearance?.language ?? 'zh-CN') as LanguageCode
  const translate = useCallback(
    (key: string, vars?: Record<string, string | number>) => t(language, key, vars),
    [language]
  )
  return {
    language,
    t: translate,
  }
}
