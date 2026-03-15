import { useEffect, useState } from 'react'
import { Copy, Star, Trash2, FileText, Image, File, Pencil, Check, X } from 'lucide-react'
import { HistoryItem } from '../types'
import { useI18n } from '../hooks/useI18n'

interface HistoryItemProps {
  item: HistoryItem
  isSelected: boolean
  searchQuery: string
  onSelect: () => void
  onCopy: () => void
  onOpenImage?: () => void
  onUpdateRemark?: (remark: string) => void
  showRemarkEditor?: boolean
  onToggleFavorite: () => void
  onDelete: () => void
}

export default function HistoryItemComponent({
  item,
  isSelected,
  searchQuery,
  onSelect,
  onCopy,
  onOpenImage,
  onUpdateRemark,
  showRemarkEditor = false,
  onToggleFavorite,
  onDelete,
}: HistoryItemProps) {
  const { language, t } = useI18n()
  const [isEditingRemark, setIsEditingRemark] = useState(false)
  const [remarkDraft, setRemarkDraft] = useState(item.remark || '')

  useEffect(() => {
    setRemarkDraft(item.remark || '')
  }, [item.remark])

  const highlightText = (text: string) => {
    const keyword = searchQuery.trim()
    if (!keyword) return text

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <mark key={i} className="highlight">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)] truncate">
                {highlightText(item.content)}
              </p>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Image className="w-3.5 h-3.5 text-[var(--color-text-secondary)] flex-shrink-0" />
            <div className="flex-shrink-0 rounded border border-[var(--color-border)] overflow-hidden bg-[var(--color-image-thumb-bg)]">
              <img
                src={item.content}
                alt={t('history.imageAlt')}
                className="h-8 w-24 object-cover"
              />
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] truncate">{t('history.imageLabel')}</span>
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)] truncate">
                {item.metadata?.fileName || item.content}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('history.justNow')
    if (minutes < 60) return t('history.minutesAgo', { count: minutes })
    if (hours < 24) return t('history.hoursAgo', { count: hours })
    if (days < 7) return t('history.daysAgo', { count: days })
    return date.toLocaleDateString(language)
  }

  const saveRemark = () => {
    const value = remarkDraft.trim()
    onUpdateRemark?.(value)
    setIsEditingRemark(false)
  }

  return (
    <div
      onClick={() => {
        onSelect()
        if (item.type === 'image') {
          onOpenImage?.()
        }
      }}
      onDoubleClick={() => {
        if (item.type === 'text') {
          onCopy()
        }
      }}
      className={`group h-full px-3 py-1 cursor-pointer border-b border-[var(--color-border-muted)] transition-colors ${
        isSelected
          ? 'bg-[var(--color-selected)]'
          : 'hover:bg-[var(--color-bg-hover)]'
      }`}
    >
      <div className="h-full flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">{renderContent()}</div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCopy()
              }}
              className="p-1 rounded hover:bg-[var(--color-border)]"
              title={t('common.copy')}
            >
              <Copy className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
            {item.type === 'text' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className="p-1 rounded hover:bg-[var(--color-border)]"
                title={item.isFavorited ? t('history.unfavorite') : t('history.favorite')}
              >
                <Star
                  className={`w-4 h-4 ${
                    item.isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--color-text-secondary)]'
                  }`}
                />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 rounded hover:bg-[var(--color-border)]"
              title={t('common.delete')}
            >
              <Trash2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0">{formatTime(item.createdAt)}</span>
            {item.copyCount > 1 && (
              <span className="truncate">{t('history.copyTimes', { count: item.copyCount })}</span>
            )}
          </div>

          {showRemarkEditor && (
            <div className="flex items-center gap-1 min-w-0 max-w-[55%]">
              {!isEditingRemark ? (
                <>
                  <span className="truncate">
                    {t('history.remark')}: {item.remark ? highlightText(item.remark) : t('history.remarkEmpty')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingRemark(true)
                    }}
                    className="p-0.5 rounded hover:bg-[var(--color-border)]"
                    title={t('history.editRemark')}
                  >
                    <Pencil className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                  </button>
                </>
              ) : (
                <>
                  <input
                    value={remarkDraft}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setRemarkDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        saveRemark()
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        setRemarkDraft(item.remark || '')
                        setIsEditingRemark(false)
                      }
                    }}
                    className="h-5 w-28 px-1.5 text-xs text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    placeholder={t('history.inputRemark')}
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveRemark()
                    }}
                    className="p-0.5 rounded hover:bg-[var(--color-border)]"
                    title={t('history.saveRemark')}
                  >
                    <Check className="w-3 h-3 text-[var(--color-text-secondary)]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRemarkDraft(item.remark || '')
                      setIsEditingRemark(false)
                    }}
                    className="p-0.5 rounded hover:bg-[var(--color-border)]"
                    title={t('history.cancelRemark')}
                  >
                    <X className="w-3 h-3 text-[var(--color-text-secondary)]" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
