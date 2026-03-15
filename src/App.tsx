import { useEffect } from 'react'
import SearchBar from './components/SearchBar'
import TabBar from './components/TabBar'
import HistoryList from './components/HistoryList'
import CommandsList from './components/CommandsList'
import Settings from './components/Settings'
import { useStore } from './stores/useStore'
import { TabType } from './types'
import { X, Settings2 } from 'lucide-react'

const tabOrder: TabType[] = ['all', 'text', 'image', 'favorites', 'commands']

function App() {
  const {
    activeTab,
    showSettings,
    setShowSettings,
    setActiveTab,
    setCommands,
    setSearchQuery,
    setSelectedIndex,
  } = useStore()
  const hasElectronAPI = typeof window !== 'undefined' && 'electronAPI' in window

  // 监听设置快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(!showSettings)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, setShowSettings])

  // 监听主进程快捷键事件
  useEffect(() => {
    if (!hasElectronAPI) return

    return window.electronAPI.onShortcutTriggered((action) => {
      if (action === 'openSettings') {
        setShowSettings(true)
      }
    })
  }, [hasElectronAPI, setShowSettings])

  // 全局加载快捷指令，供“全部”搜索联动
  useEffect(() => {
    if (!hasElectronAPI) return

    const loadCommands = async () => {
      try {
        const commands = await window.electronAPI.getCommands()
        setCommands(commands)
      } catch (error) {
        console.error('Failed to load commands in app:', error)
      }
    }

    loadCommands()
  }, [hasElectronAPI, setCommands])

  // Tab 左右键切换
  useEffect(() => {
    const handleTabSwitch = (e: KeyboardEvent) => {
      if (showSettings) return

      const target = e.target as HTMLElement | null
      const isSearchInput = target instanceof HTMLInputElement && target.id === 'search-input'
      const isInputLike =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isInputLike && !isSearchInput) return

      const currentIndex = tabOrder.indexOf(activeTab)
      if (currentIndex === -1) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (isSearchInput) {
          setSearchQuery((target as HTMLInputElement).value)
        }
        const nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length
        setActiveTab(tabOrder[nextIndex])
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (isSearchInput) {
          setSearchQuery((target as HTMLInputElement).value)
        }
        const nextIndex = (currentIndex + 1) % tabOrder.length
        setActiveTab(tabOrder[nextIndex])
      }
    }

    window.addEventListener('keydown', handleTabSwitch)
    return () => window.removeEventListener('keydown', handleTabSwitch)
  }, [activeTab, setActiveTab, setSearchQuery, showSettings])

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // 每次窗口打开时，重置搜索和 Tab
  useEffect(() => {
    if (!hasElectronAPI) return

    return window.electronAPI.onWindowOpened(() => {
      setSearchQuery('')
      setActiveTab('all')
      setSelectedIndex(0)
    })
  }, [hasElectronAPI, setActiveTab, setSearchQuery, setSelectedIndex])

  if (!hasElectronAPI) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-xl text-center space-y-3">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">请在 Electron 中调试 AllRun</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            当前是浏览器预览页面，桌面能力（剪贴板监听、全局快捷键、自动粘贴）不可用。
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            在终端运行 `npm run dev`，并操作弹出的桌面窗口；不要直接访问 `http://localhost:5173`。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      {/* 标题栏拖拽区域 */}
      <div className="drag-region relative h-8 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="absolute left-2 inset-y-0 flex items-center">
          <button
            onClick={() => window.electronAPI.hideWindow()}
            className="no-drag w-3 h-3 rounded-full bg-[#ff5f57] flex items-center justify-center hover:brightness-110 transition"
            title="关闭"
          >
            <X className="w-2 h-2 text-black/80" strokeWidth={2.5} />
          </button>
        </div>
        <div className="absolute right-2 inset-y-0 flex items-center">
          <button
            onClick={() => setShowSettings(true)}
            className="no-drag p-1 rounded hover:bg-[#2a2d2e] transition-colors"
            title="设置"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#c5c5c5]" />
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-[#c5c5c5] font-medium">AllRun</span>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden no-drag">
        {/* 搜索栏 */}
        <SearchBar />

        {/* Tab 导航 */}
        <TabBar />

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'commands' ? (
            <CommandsList />
          ) : (
            <HistoryList />
          )}
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && <Settings />}
    </div>
  )
}

export default App
