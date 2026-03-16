import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Fuse from 'fuse.js'
import { useStore } from '../stores/useStore'
import { Command } from '../types'
import { Play, Trash2 } from 'lucide-react'
import CommandParamsDialog from './CommandParamsDialog'
import { parseCommandParamInput, parseCommandParamNames } from '../utils/commandParams'
import { useI18n } from '../hooks/useI18n'
import { getCommandDetail } from '../utils/commandDisplay'

const commandFuseOptions = {
  keys: ['name', 'remark', 'description', 'path', 'url', 'command'],
  threshold: 0.4,
}

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

export default function CommandsList() {
  const {
    commands,
    setCommands,
    searchQuery,
    activeTab,
    selectedIndex,
    setSelectedIndex,
  } = useStore()
  const { t } = useI18n()
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [draggingCommandId, setDraggingCommandId] = useState<string | null>(null)
  const [paramDialogState, setParamDialogState] = useState<{
    command: Command
    paramNames: string[]
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragEnabled = !searchQuery.trim()

  // 加载快捷指令
  useEffect(() => {
    const loadCommands = async () => {
      try {
        const data = await window.electronAPI.getCommands()
        setCommands(data)
      } catch (error) {
        console.error('Failed to load commands:', error)
      }
    }
    loadCommands()
  }, [setCommands])

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      return commands
    }

    const fuse = new Fuse(commands, commandFuseOptions)
    return fuse.search(searchQuery).map((item) => item.item)
  }, [commands, searchQuery])

  const selectedCommand = filteredCommands[selectedIndex]
  const selectedCommandDetail = selectedCommand ? getCommandDetail(selectedCommand) : ''

  useEffect(() => {
    if (selectedIndex > filteredCommands.length - 1) {
      setSelectedIndex(Math.max(filteredCommands.length - 1, 0))
    }
  }, [filteredCommands.length, selectedIndex, setSelectedIndex])

  const runCommand = useCallback(async (
    command: Command,
    params?: {
      commandArgs?: string[]
      commandNamedArgs?: Record<string, string>
      rawInput?: string
    }
  ) => {
    setExecutingId(command.id)
    try {
      await window.electronAPI.executeCommand(command.id, params)
      return true
    } catch (error) {
      console.error('Failed to execute command:', error)
      alert(t('error.executeFailed', { message: (error as Error).message }))
      return false
    } finally {
      setExecutingId(null)
    }
  }, [t])

  const handleExecute = useCallback(async (command: Command) => {
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

  useEffect(() => {
    if (activeTab !== 'commands') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (paramDialogState) return
      if (filteredCommands.length === 0) return

      const target = e.target as HTMLElement | null
      const isSearchInput = target instanceof HTMLInputElement && target.id === 'search-input'
      const isInputLike =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isInputLike && !isSearchInput) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(selectedIndex >= filteredCommands.length - 1 ? 0 : selectedIndex + 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(selectedIndex <= 0 ? filteredCommands.length - 1 : selectedIndex - 1)
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        handleExecute(filteredCommands[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, filteredCommands, handleExecute, paramDialogState, selectedIndex, setSelectedIndex])

  useEffect(() => {
    if (activeTab !== 'commands') return

    const selected = containerRef.current?.querySelector<HTMLElement>(
      `[data-command-index="${selectedIndex}"]`
    )
    selected?.scrollIntoView({ block: 'nearest' })
  }, [activeTab, selectedIndex, filteredCommands.length])

  useEffect(() => {
    return window.electronAPI.onWindowOpened(() => {
      setSelectedIndex(0)
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    })
  }, [setSelectedIndex])

  const handleDelete = async (id: string) => {
    if (confirm(t('commands.deleteConfirm'))) {
      await window.electronAPI.deleteCommand(id)
      setCommands(commands.filter((cmd) => cmd.id !== id))
    }
  }

  const handleDropReorder = useCallback(async (targetId: string) => {
    if (!isDragEnabled || !draggingCommandId || draggingCommandId === targetId) {
      setDraggingCommandId(null)
      return
    }

    const currentCommands = useStore.getState().commands
    const sourceIndex = currentCommands.findIndex((command) => command.id === draggingCommandId)
    const targetIndex = currentCommands.findIndex((command) => command.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggingCommandId(null)
      return
    }

    const nextCommands = [...currentCommands]
    const [moved] = nextCommands.splice(sourceIndex, 1)
    nextCommands.splice(targetIndex, 0, moved)
    setCommands(nextCommands)
    setSelectedIndex(targetIndex)
    setDraggingCommandId(null)

    try {
      const savedCommands = await window.electronAPI.reorderCommands(nextCommands.map((command) => command.id))
      setCommands(savedCommands)
    } catch (error) {
      console.error('Failed to reorder commands:', error)
    }
  }, [draggingCommandId, isDragEnabled, setCommands, setSelectedIndex])

  // 获取指令图标
  const getCommandIcon = (type: string) => {
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

  return (
    <>
      <div className="h-full flex flex-col">
        <div ref={containerRef} className="flex-1 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[var(--color-text-secondary)]">
                {searchQuery ? t('commands.noMatch') : t('commands.empty')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-muted)]">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  data-command-index={index}
                  draggable={isDragEnabled}
                  onDragStart={() => {
                    if (!isDragEnabled) return
                    setDraggingCommandId(command.id)
                  }}
                  onDragEnd={() => setDraggingCommandId(null)}
                  onDragOver={(e) => {
                    if (!isDragEnabled || !draggingCommandId || draggingCommandId === command.id) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleDropReorder(command.id)
                  }}
                  className={`group px-3 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-[var(--color-selected)]'
                      : 'hover:bg-[var(--color-bg-hover)]'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    setSelectedIndex(index)
                    handleExecute(command)
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-lg">{getCommandIcon(command.type)}</span>
                      <div className="flex items-center justify-between gap-3 min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {highlightKeyword(command.name, searchQuery)}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate shrink-0 max-w-[45%]">
                          {command.remark?.trim() ? highlightKeyword(command.remark, searchQuery) : t('history.remarkEmpty')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExecute(command)
                        }}
                        disabled={executingId === command.id}
                        className="p-1.5 rounded hover:bg-[var(--color-border)]"
                        title={t('common.execute')}
                      >
                        <Play
                          className={`w-4 h-4 text-[var(--color-text-secondary)] ${
                            executingId === command.id ? 'animate-pulse' : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(command.id)
                        }}
                        className="p-1.5 rounded hover:bg-[var(--color-border)]"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-[var(--color-border-muted)] bg-[var(--color-bg-secondary)]">
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            {selectedCommandDetail}
          </p>
        </div>
      </div>

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
