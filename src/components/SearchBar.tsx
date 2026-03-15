import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '../stores/useStore'
import { useI18n } from '../hooks/useI18n'

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useStore()
  const { t } = useI18n()
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  // 防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery)
    }, 80)

    return () => clearTimeout(timer)
  }, [localQuery, setSearchQuery])

  const focusSearchInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length)
    })
  }, [])

  // 首次渲染自动聚焦
  useEffect(() => {
    focusSearchInput()
  }, [focusSearchInput])

  // 每次窗口重新打开时，聚焦搜索框
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI?.onWindowOpened) {
      return
    }
    return window.electronAPI.onWindowOpened(() => {
      focusSearchInput()
    })
  }, [focusSearchInput])

  const handleClear = useCallback(() => {
    setLocalQuery('')
    setSearchQuery('')
  }, [setSearchQuery])

  return (
    <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full pl-10 pr-8 py-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--color-border)]"
          >
            <X className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
          </button>
        )}
      </div>
    </div>
  )
}
