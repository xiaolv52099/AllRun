import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import Fuse from 'fuse.js'
import { Play, Trash2, X, Copy } from 'lucide-react'
import { useStore } from '../stores/useStore'
import HistoryItemComponent from './HistoryItem'
import { Command, HistoryItem } from '../types'
import CommandParamsDialog from './CommandParamsDialog'
import { parseCommandParamInput, parseCommandParamNames } from '../utils/commandParams'
import { useI18n } from '../hooks/useI18n'

const historyFuseOptions = {
  keys: ['content', 'remark', 'metadata.fileName'],
  threshold: 0.4,
}

const commandFuseOptions = {
  keys: ['name', 'remark', 'description', 'path', 'url', 'command'],
  threshold: 0.4,
}

type ListEntry =
  | { kind: 'history'; item: HistoryItem }
  | { kind: 'command'; item: Command }

const ROW_HEIGHT = 56

function highlightKeyword(text: string, query: string) {
  const keyword = query.trim()
  if (!keyword) return text

  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={`${part}-${index}`} className="highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function getCommandIcon(type: string) {
  switch (type) {
    case 'open_dir':
      return '📁'
    case 'url':
      return '🌐'
    case 'shell':
      return '💻'
    case 'script':
      return '📜'
    default:
      return '⚡'
  }
}

export default function HistoryList() {
  const {
    history,
    setHistory,
    commands,
    setCommands,
    config,
    setConfig,
    searchQuery,
    activeTab,
    selectedIndex,
    setSelectedIndex,
    isLoading,
    setIsLoading,
  } = useStore()
  const { t } = useI18n()

  const listRef = useRef<List>(null)
  const [previewImage, setPreviewImage] = useState<HistoryItem | null>(null)
  const [draggingFavoriteId, setDraggingFavoriteId] = useState<string | null>(null)
  const [paramDialogState, setParamDialogState] = useState<{
    command: Command
    paramNames: string[]
  } | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await window.electronAPI.getHistory()
        setHistory(data)
      } catch (error) {
        console.error('Failed to load history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [setHistory, setIsLoading])

  useEffect(() => {
    const loadCommands = async () => {
      try {
        const data = await window.electronAPI.getCommands()
        setCommands(data)
      } catch (error) {
        console.error('Failed to load commands in history list:', error)
      }
    }

    loadCommands()
  }, [setCommands])

  useEffect(() => {
    return window.electronAPI.onClipboardChange((item: HistoryItem) => {
      const currentHistory = useStore.getState().history
      const exists = currentHistory.some((current) => current.id === item.id)

      if (exists) {
        setHistory([item, ...currentHistory.filter((current) => current.id !== item.id)])
        return
      }

      setHistory([item, ...currentHistory])
    })
  }, [setHistory])

  const favoriteOrderedIds = useMemo(() => {
    const favoriteIds = history.filter((item) => item.isFavorited).map((item) => item.id)
    const favoriteIdSet = new Set(favoriteIds)
    const preferredOrder = config?.appearance?.favoriteOrder || []
    const seen = new Set<string>()
    const result: string[] = []

    preferredOrder.forEach((id) => {
      if (!favoriteIdSet.has(id) || seen.has(id)) {
        return
      }
      seen.add(id)
      result.push(id)
    })

    favoriteIds.forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id)
        result.push(id)
      }
    })

    return result
  }, [config?.appearance?.favoriteOrder, history])

  const filteredHistory = useMemo(() => {
    let result = history

    if (activeTab === 'text') {
      result = result.filter((item) => item.type === 'text')
    } else if (activeTab === 'image') {
      result = result.filter((item) => item.type === 'image')
    } else if (activeTab === 'favorites') {
      result = result.filter((item) => item.isFavorited)
      const rank = new Map(favoriteOrderedIds.map((id, index) => [id, index]))
      result = [...result].sort((a, b) => {
        const aRank = rank.get(a.id)
        const bRank = rank.get(b.id)
        if (aRank === undefined && bRank === undefined) return 0
        if (aRank === undefined) return 1
        if (bRank === undefined) return -1
        return aRank - bRank
      })
    }

    if (searchQuery.trim()) {
      const fuse = new Fuse(result, historyFuseOptions)
      result = fuse.search(searchQuery).map((item) => item.item)
    }

    return result
  }, [activeTab, favoriteOrderedIds, history, searchQuery])

  const commandSearchResults = useMemo(() => {
    if (activeTab !== 'all' || !searchQuery.trim()) {
      return []
    }

    const fuse = new Fuse(commands, commandFuseOptions)
    return fuse.search(searchQuery).map((item) => item.item)
  }, [activeTab, commands, searchQuery])

  const items = useMemo<ListEntry[]>(() => {
    if (activeTab === 'all' && searchQuery.trim()) {
      return [
        ...commandSearchResults.map((item) => ({ kind: 'command', item }) as const),
        ...filteredHistory.map((item) => ({ kind: 'history', item }) as const),
      ]
    }

    return filteredHistory.map((item) => ({ kind: 'history', item }) as const)
  }, [activeTab, commandSearchResults, filteredHistory, searchQuery])

  useEffect(() => {
    if (selectedIndex > items.length - 1) {
      setSelectedIndex(Math.max(items.length - 1, 0))
    }
  }, [items.length, selectedIndex, setSelectedIndex])

  useEffect(() => {
    return window.electronAPI.onWindowOpened(() => {
      setSelectedIndex(0)
      listRef.current?.scrollTo(0)
    })
  }, [setSelectedIndex])

  const handleCopy = useCallback(async (item: HistoryItem) => {
    if (item.type === 'text') {
      await window.electronAPI.pasteTextAtCursor(item.content)
    } else if (item.type === 'image') {
      await window.electronAPI.writeImageClipboard(item.content)
    }
  }, [])

  const runCommand = useCallback(async (
    command: Command,
    params?: {
      commandArgs?: string[]
      commandNamedArgs?: Record<string, string>
      rawInput?: string
    }
  ) => {
    try {
      await window.electronAPI.executeCommand(command.id, params)
      await window.electronAPI.hideWindow()
      return true
    } catch (error) {
      console.error('Failed to execute command from search:', error)
      alert(t('error.executeFailed', { message: (error as Error).message }))
      return false
    }
  }, [t])

  const handleExecuteCommand = useCallback(async (command: Command) => {
    const paramNames = parseCommandParamNames(command.bashParams)
    if (command.type === 'shell' && paramNames.length > 0) {
      setParamDialogState({ command, paramNames })
      return
    }
    await runCommand(command)
  }, [runCommand])

  const handleConfirmParams = useCallback(async (input: string) => {
    if (!paramDialogState) return

    const parsed = parseCommandParamInput(input, paramDialogState.paramNames)
    const succeeded = await runCommand(paramDialogState.command, {
      rawInput: input,
      commandArgs: parsed.orderedArgs,
      commandNamedArgs: parsed.namedArgs,
    })

    if (succeeded) {
      setParamDialogState(null)
    }
  }, [paramDialogState, runCommand])

  const handleDeleteCommand = useCallback(async (id: string) => {
    if (!confirm(t('commands.deleteConfirm'))) {
      return
    }
    await window.electronAPI.deleteCommand(id)
    const currentCommands = useStore.getState().commands
    setCommands(currentCommands.filter((command) => command.id !== id))
  }, [setCommands, t])

  const handleActivate = useCallback(async (entry: ListEntry) => {
    if (entry.kind === 'history') {
      if (entry.item.type === 'image') {
        return
      }
      await handleCopy(entry.item)
    } else {
      await handleExecuteCommand(entry.item)
    }
  }, [handleCopy, handleExecuteCommand])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (paramDialogState) return
      if (items.length === 0) return

      const target = e.target as HTMLElement | null
      const isSearchInput = target instanceof HTMLInputElement && target.id === 'search-input'
      const isInputLike =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isInputLike && !isSearchInput) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(selectedIndex >= items.length - 1 ? 0 : selectedIndex + 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(Math.max(selectedIndex - 1, 0))
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        if (activeTab === 'image') {
          e.preventDefault()
          return
        }
        e.preventDefault()
        handleActivate(items[selectedIndex])
      } else if (e.key === 'Escape') {
        window.electronAPI.hideWindow()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, handleActivate, items, paramDialogState, selectedIndex, setSelectedIndex])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(selectedIndex, 'smart')
    }
  }, [selectedIndex])

  const persistFavoriteOrder = useCallback(async (nextOrder: string[]) => {
    try {
      const latest = await window.electronAPI.updateConfig({
        appearance: {
          favoriteOrder: nextOrder,
        },
      })
      setConfig(latest)
    } catch (error) {
      console.error('Failed to persist favorite order:', error)
    }
  }, [setConfig])

  const handleToggleFavorite = useCallback(async (id: string) => {
    await window.electronAPI.toggleFavorite(id)
    const target = history.find((item) => item.id === id)
    const nextIsFavorited = !target?.isFavorited

    setHistory(
      history.map((item) =>
        item.id === id ? { ...item, isFavorited: nextIsFavorited } : item
      )
    )

    const nextOrder = nextIsFavorited
      ? [id, ...favoriteOrderedIds.filter((favoriteId) => favoriteId !== id)]
      : favoriteOrderedIds.filter((favoriteId) => favoriteId !== id)
    await persistFavoriteOrder(nextOrder)
  }, [favoriteOrderedIds, history, persistFavoriteOrder, setHistory])

  const favoriteDragEnabled = activeTab === 'favorites' && !searchQuery.trim()

  const handleDropFavorite = useCallback(async (targetId: string) => {
    if (!favoriteDragEnabled || !draggingFavoriteId || draggingFavoriteId === targetId) {
      setDraggingFavoriteId(null)
      return
    }

    const sourceIndex = favoriteOrderedIds.indexOf(draggingFavoriteId)
    const targetIndex = favoriteOrderedIds.indexOf(targetId)
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingFavoriteId(null)
      return
    }

    const nextOrder = [...favoriteOrderedIds]
    const [moved] = nextOrder.splice(sourceIndex, 1)
    nextOrder.splice(targetIndex, 0, moved)
    setDraggingFavoriteId(null)
    await persistFavoriteOrder(nextOrder)
  }, [draggingFavoriteId, favoriteDragEnabled, favoriteOrderedIds, persistFavoriteOrder])

  const handleDelete = useCallback(async (id: string) => {
    await window.electronAPI.deleteHistory(id)
    setHistory(history.filter((item) => item.id !== id))
    if (favoriteOrderedIds.includes(id)) {
      await persistFavoriteOrder(favoriteOrderedIds.filter((favoriteId) => favoriteId !== id))
    }
  }, [favoriteOrderedIds, history, persistFavoriteOrder, setHistory])

  const handleUpdateRemark = useCallback(async (id: string, remark: string) => {
    const value = remark.trim()
    await window.electronAPI.updateRemark(id, value)
    const currentHistory = useStore.getState().history
    setHistory(
      currentHistory.map((item) =>
        item.id === id ? { ...item, remark: value } : item
      )
    )
  }, [setHistory])

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const entry = items[index]

      if (entry.kind === 'history') {
        const item = entry.item
        const isDraggableFavorite = favoriteDragEnabled && item.isFavorited
        return (
          <div
            style={style}
            draggable={isDraggableFavorite}
            onDragStart={() => {
              if (!isDraggableFavorite) return
              setDraggingFavoriteId(item.id)
            }}
            onDragEnd={() => setDraggingFavoriteId(null)}
            onDragOver={(e) => {
              if (!isDraggableFavorite || !draggingFavoriteId || draggingFavoriteId === item.id) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleDropFavorite(item.id)
            }}
          >
            <HistoryItemComponent
              item={item}
              isSelected={index === selectedIndex}
              searchQuery={searchQuery}
              onSelect={() => setSelectedIndex(index)}
              onCopy={() => handleCopy(item)}
              onOpenImage={item.type === 'image' ? () => setPreviewImage(item) : undefined}
              onUpdateRemark={(remark) => handleUpdateRemark(item.id, remark)}
              showRemarkEditor={activeTab === 'favorites' && item.type === 'text'}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          </div>
        )
      }

      const command = entry.item
      return (
        <div style={style}>
          <div
            onMouseMove={() => {
              if (selectedIndex !== index) {
                setSelectedIndex(index)
              }
            }}
            onClick={() => {
              setSelectedIndex(index)
              handleExecuteCommand(command)
            }}
            className={`group h-full px-3 py-1.5 cursor-pointer border-b border-[var(--color-border-muted)] transition-colors ${
              index === selectedIndex
                ? 'bg-[var(--color-selected)]'
                : 'hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <div className="flex items-center justify-between h-full gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-lg">{getCommandIcon(command.type)}</span>
                <div className="flex items-center justify-between gap-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {highlightKeyword(command.name, searchQuery)}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate shrink-0 max-w-[45%]">
                    {command.remark?.trim()
                      ? highlightKeyword(command.remark, searchQuery)
                      : t('history.remarkEmpty')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExecuteCommand(command)
                  }}
                  className="p-1.5 rounded hover:bg-[var(--color-border)]"
                  title={t('common.execute')}
                >
                  <Play className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCommand(command.id)
                  }}
                  className="p-1.5 rounded hover:bg-[var(--color-border)]"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    [
      activeTab,
      draggingFavoriteId,
      favoriteDragEnabled,
      handleCopy,
      handleDelete,
      handleDeleteCommand,
      handleDropFavorite,
      handleExecuteCommand,
      handleToggleFavorite,
      handleUpdateRemark,
      items,
      searchQuery,
      selectedIndex,
      setSelectedIndex,
      t,
    ]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-text-secondary)]">{t('common.loading')}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--color-text-secondary)]">
          {searchQuery ? t('history.noMatch') : t('history.noData')}
        </p>
      </div>
    )
  }

  return (
    <>
      <List
        ref={listRef}
        height={400}
        itemCount={items.length}
        itemSize={ROW_HEIGHT}
        width="100%"
      >
        {Row}
      </List>

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg w-full max-w-3xl max-h-full overflow-auto">
            <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-muted)]">
              <span className="text-sm text-[var(--color-text-primary)]">{t('history.previewImage')}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await window.electronAPI.writeImageClipboard(previewImage.content)
                  }}
                  className="p-1.5 rounded hover:bg-[var(--color-border)]"
                  title={t('history.copyImage')}
                >
                  <Copy className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded hover:bg-[var(--color-border)]"
                  title={t('window.close')}
                >
                  <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center">
              <img
                src={previewImage.content}
                alt={t('history.imageAlt')}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {paramDialogState && (
        <CommandParamsDialog
          commandName={paramDialogState.command.name}
          paramNames={paramDialogState.paramNames}
          onCancel={() => setParamDialogState(null)}
          onConfirm={handleConfirmParams}
        />
      )}
    </>
  )
}
