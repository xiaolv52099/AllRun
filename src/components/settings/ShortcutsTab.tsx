import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { AppConfig } from '../../types'

type ShortcutKey = keyof AppConfig['shortcuts']

interface ShortcutItem {
  key: ShortcutKey
  label: string
  description: string
}

const shortcutItems: ShortcutItem[] = [
  {
    key: 'toggleWindow',
    label: '显示/隐藏窗口',
    description: '快速唤起或隐藏主窗口',
  },
  {
    key: 'openSettings',
    label: '打开设置',
    description: '打开设置弹窗',
  },
]

export default function ShortcutsTab() {
  const { config, setConfig } = useStore()
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
        alert('快捷键设置失败，可能与其他快捷键冲突')
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
      <h3 className="text-sm font-medium text-[#d4d4d4]">快捷键设置</h3>

      <div className="space-y-3">
        {shortcutItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 bg-[#252526] border border-[#3c3c3c] rounded-lg"
          >
            <div>
              <p className="text-sm text-[#d4d4d4]">{item.label}</p>
              <p className="text-xs text-[#9da0a6]">{item.description}</p>
            </div>

            {editingKey === item.key ? (
              <input
                ref={inputRef}
                type="text"
                value={tempShortcut || '请按下快捷键组合...'}
                onKeyDown={(e) => handleKeyCapture(e, item.key)}
                onBlur={() => setEditingKey(null)}
                className="w-32 px-2 py-1 text-sm text-center text-[#d4d4d4] border border-[#0e639c] rounded bg-[#1e1e1e] focus:outline-none"
                readOnly
              />
            ) : (
              <button
                onClick={() => {
                  setEditingKey(item.key)
                  setTempShortcut('')
                }}
                className="px-3 py-1 text-sm font-mono text-[#d4d4d4] bg-[#1e1e1e] border border-[#3c3c3c] rounded hover:border-[#0e639c] transition-colors"
              >
                {formatShortcut(config?.shortcuts?.[item.key] || '')}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-[#9da0a6]">
        点击快捷键区域，然后按下新的快捷键组合即可修改
      </p>
    </div>
  )
}
