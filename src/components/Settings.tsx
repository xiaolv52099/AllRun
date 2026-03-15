import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../stores/useStore'
import GeneralTab from './settings/GeneralTab'
import ShortcutsTab from './settings/ShortcutsTab'
import CommandsTab from './settings/CommandsTab'

type SettingsTab = 'general' | 'shortcuts' | 'commands'

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: '通用' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'commands', label: '快捷指令' },
]

export default function Settings() {
  const { setShowSettings, setConfig } = useStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  // 加载配置
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

  const handleClose = () => {
    setShowSettings(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-xl w-[600px] max-h-[80vh] overflow-hidden animate-fade-in">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c] bg-[#252526]">
          <h2 className="text-lg font-semibold text-[#d4d4d4]">设置</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-[#2a2d2e]"
          >
            <X className="w-5 h-5 text-[#9da0a6]" />
          </button>
        </div>

        {/* Tab 栏 */}
        <div className="flex border-b border-[#3c3c3c] bg-[#252526]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-[#ffffff] border-b-2 border-[#0e639c] bg-[#1f1f1f]'
                  : 'text-[#9da0a6] hover:text-[#d4d4d4] hover:bg-[#2a2d2e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)] bg-[#1e1e1e] text-[#d4d4d4]">
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'shortcuts' && <ShortcutsTab />}
          {activeTab === 'commands' && <CommandsTab />}
        </div>
      </div>
    </div>
  )
}
