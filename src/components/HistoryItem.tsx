import { useEffect, useState } from 'react'
import { Copy, Star, Trash2, FileText, Image, File, Pencil, Check, X } from 'lucide-react'
import { HistoryItem } from '../types'

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
  const [isEditingRemark, setIsEditingRemark] = useState(false)
  const [remarkDraft, setRemarkDraft] = useState(item.remark || '')

  useEffect(() => {
    setRemarkDraft(item.remark || '')
  }, [item.remark])

  // 高亮搜索词
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

  // 渲染内容
  const renderContent = () => {
    switch (item.type) {
      case 'text':
        return (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#9da0a6] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#d4d4d4] truncate">
                {highlightText(item.content)}
              </p>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Image className="w-3.5 h-3.5 text-[#9da0a6] flex-shrink-0" />
            <div className="flex-shrink-0 rounded border border-[#3c3c3c] overflow-hidden bg-[#111111]">
              <img
                src={item.content}
                alt="剪贴板图片"
                className="h-8 w-24 object-cover"
              />
            </div>
            <span className="text-xs text-[#9da0a6] truncate">图片</span>
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-[#9da0a6] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#d4d4d4] truncate">
                {item.metadata?.fileName || item.content}
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
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
      className={`group h-full px-3 py-1 cursor-pointer border-b border-[#2d2d30] transition-colors ${
        isSelected
          ? 'bg-[#04395e]'
          : 'hover:bg-[#2a2d2e]'
      }`}
    >
      <div className="h-full flex flex-col justify-center gap-0.5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">{renderContent()}</div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCopy()
              }}
              className="p-1 rounded hover:bg-[#3c3c3c]"
              title="复制"
            >
              <Copy className="w-4 h-4 text-[#9da0a6]" />
            </button>
            {item.type === 'text' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                className="p-1 rounded hover:bg-[#3c3c3c]"
                title={item.isFavorited ? '取消收藏' : '收藏'}
              >
                <Star
                  className={`w-4 h-4 ${
                    item.isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-[#9da0a6]'
                  }`}
                />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 rounded hover:bg-[#3c3c3c]"
              title="删除"
            >
              <Trash2 className="w-4 h-4 text-[#9da0a6]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-[#9da0a6]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0">{formatTime(item.createdAt)}</span>
            {item.copyCount > 1 && <span className="truncate">· 复制 {item.copyCount} 次</span>}
          </div>

          {showRemarkEditor && (
            <div className="flex items-center gap-1 min-w-0 max-w-[55%]">
              {!isEditingRemark ? (
                <>
                  <span className="truncate">
                    备注: {item.remark ? highlightText(item.remark) : '未填写'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingRemark(true)
                    }}
                    className="p-0.5 rounded hover:bg-[#3c3c3c]"
                    title="编辑备注"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#9da0a6]" />
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
                    className="h-5 w-28 px-1.5 text-xs text-[#d4d4d4] bg-[#1e1e1e] border border-[#3c3c3c] rounded focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    placeholder="输入备注"
                    autoFocus
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      saveRemark()
                    }}
                    className="p-0.5 rounded hover:bg-[#3c3c3c]"
                    title="保存备注"
                  >
                    <Check className="w-3 h-3 text-[#9da0a6]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRemarkDraft(item.remark || '')
                      setIsEditingRemark(false)
                    }}
                    className="p-0.5 rounded hover:bg-[#3c3c3c]"
                    title="取消编辑"
                  >
                    <X className="w-3 h-3 text-[#9da0a6]" />
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
