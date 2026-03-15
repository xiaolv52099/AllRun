import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Fuse from 'fuse.js'
import { useStore } from '../stores/useStore'
import { Command } from '../types'
import { Play, Trash2 } from 'lucide-react'

const commandFuseOptions = {
  keys: ['name', 'description', 'path', 'url', 'command'],
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
  const [executingId, setExecutingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (selectedIndex > filteredCommands.length - 1) {
      setSelectedIndex(Math.max(filteredCommands.length - 1, 0))
    }
  }, [filteredCommands.length, selectedIndex, setSelectedIndex])

  const handleExecute = useCallback(async (command: Command) => {
    setExecutingId(command.id)
    try {
      await window.electronAPI.executeCommand(command.id)
    } catch (error) {
      console.error('Failed to execute command:', error)
      alert(`执行失败: ${(error as Error).message}`)
    } finally {
      setExecutingId(null)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'commands') return

    const handleKeyDown = (e: KeyboardEvent) => {
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
        setSelectedIndex(Math.max(selectedIndex - 1, 0))
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault()
        handleExecute(filteredCommands[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, filteredCommands, handleExecute, selectedIndex, setSelectedIndex])

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
    if (confirm('确定要删除这个指令吗？')) {
      await window.electronAPI.deleteCommand(id)
      setCommands(commands.filter((cmd) => cmd.id !== id))
    }
  }

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
    <div ref={containerRef} className="h-full overflow-y-auto">
      {filteredCommands.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-[#9da0a6]">
            {searchQuery ? '没有匹配的指令' : '暂无快捷指令，请在设置中添加'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#2d2d30]">
          {filteredCommands.map((command, index) => (
            <div
              key={command.id}
              data-command-index={index}
              className={`group px-3 py-1.5 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-[#04395e]'
                  : 'hover:bg-[#2a2d2e]'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                setSelectedIndex(index)
                handleExecute(command)
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getCommandIcon(command.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-[#d4d4d4]">
                      {highlightKeyword(command.name, searchQuery)}
                    </p>
                    <p className="text-xs text-[#9da0a6]">
                      {command.description || command.path || command.url || command.command}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExecute(command)
                    }}
                    disabled={executingId === command.id}
                    className="p-1.5 rounded hover:bg-[#3c3c3c]"
                    title="执行"
                  >
                    <Play
                      className={`w-4 h-4 text-[#9da0a6] ${
                        executingId === command.id ? 'animate-pulse' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(command.id)
                    }}
                    className="p-1.5 rounded hover:bg-[#3c3c3c]"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-[#9da0a6]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
