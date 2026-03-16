import { useEffect, useMemo } from 'react'
import { X, Settings2 } from 'lucide-react'
import SearchBar from './components/SearchBar'
import TabBar from './components/TabBar'
import HistoryList from './components/HistoryList'
import CommandsList from './components/CommandsList'
import Settings from './components/Settings'
import { useStore } from './stores/useStore'
import { TabType, Command } from './types'
import { useI18n } from './hooks/useI18n'
import { normalizeTabOrder } from './utils/tabOrder'

function detectSettingsView() {
  if (typeof window === 'undefined') return false
  const query = new URLSearchParams(window.location.search)
  return query.get('view') === 'settings'
}

function App() {
  const {
    activeTab,
    config,
    setConfig,
    setActiveTab,
    setCommands,
    setSearchQuery,
    setSelectedIndex,
  } = useStore()
  const { t } = useI18n()
  const hasElectronAPI = typeof window !== 'undefined' && 'electronAPI' in window
  const isSettingsView = useMemo(() => detectSettingsView(), [])
  const tabOrder = useMemo(
    () => normalizeTabOrder(config?.appearance?.tabOrder),
    [config?.appearance?.tabOrder]
  )

  useEffect(() => {
    const currentTheme = config?.appearance?.theme || 'dark'
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [config?.appearance?.theme])

  useEffect(() => {
    const language = config?.appearance?.language || 'zh-CN'
    document.documentElement.setAttribute('lang', language)
  }, [config?.appearance?.language])

  useEffect(() => {
    if (!hasElectronAPI) return

    const loadConfig = async () => {
      try {
        const latestConfig = await window.electronAPI.getConfig()
        setConfig(latestConfig)
      } catch (error) {
        console.error('Failed to load config in app:', error)
      }
    }

    loadConfig()
    return window.electronAPI.onConfigUpdated((nextConfig) => {
      setConfig(nextConfig)
    })
  }, [hasElectronAPI, setConfig])

  if (!hasElectronAPI) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
        <div className="max-w-xl text-center space-y-3">
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('browser.onlyElectronTitle')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('browser.onlyElectronDesc1')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('browser.onlyElectronDesc2')}
          </p>
        </div>
      </div>
    )
  }

  if (isSettingsView) {
    return <Settings />
  }

  return (
    <MainWindow
      activeTab={activeTab}
      hasElectronAPI={hasElectronAPI}
      setActiveTab={setActiveTab}
      setCommands={setCommands}
      setSearchQuery={setSearchQuery}
      setSelectedIndex={setSelectedIndex}
      tabOrder={tabOrder}
      t={t}
    />
  )
}

function MainWindow({
  activeTab,
  hasElectronAPI,
  setActiveTab,
  setCommands,
  setSearchQuery,
  setSelectedIndex,
  tabOrder,
  t,
}: {
  activeTab: TabType
  hasElectronAPI: boolean
  setActiveTab: (tab: TabType) => void
  setCommands: (commands: Command[]) => void
  setSearchQuery: (query: string) => void
  setSelectedIndex: (index: number) => void
  tabOrder: TabType[]
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  // 监听设置快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        window.electronAPI.openSettingsWindow()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 监听主进程快捷键事件
  useEffect(() => {
    if (!hasElectronAPI) return

    return window.electronAPI.onShortcutTriggered((action) => {
      if (action === 'openSettings') {
        window.electronAPI.openSettingsWindow()
      }
    })
  }, [hasElectronAPI])

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
  }, [activeTab, setActiveTab, setSearchQuery, tabOrder])

  // 每次窗口打开时，重置搜索和 Tab
  useEffect(() => {
    if (!hasElectronAPI) return

    return window.electronAPI.onWindowOpened(() => {
      setSearchQuery('')
      setActiveTab('all')
      setSelectedIndex(0)
    })
  }, [hasElectronAPI, setActiveTab, setSearchQuery, setSelectedIndex])

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="drag-region relative h-8 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
        <div className="absolute left-2 inset-y-0 flex items-center">
          <button
            onClick={() => window.electronAPI.hideWindow()}
            className="no-drag w-3 h-3 rounded-full bg-[#ff5f57] flex items-center justify-center hover:brightness-110 transition"
            title={t('window.close')}
          >
            <X className="w-2 h-2 text-black/80" strokeWidth={2.5} />
          </button>
        </div>
        <div className="absolute right-2 inset-y-0 flex items-center">
          <button
            onClick={() => window.electronAPI.openSettingsWindow()}
            className="no-drag p-1 rounded hover:bg-[var(--color-bg-hover)] transition-colors"
            title={t('window.settings')}
          >
            <Settings2 className="w-3.5 h-3.5 text-[var(--color-title)]" />
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-[var(--color-title)] font-medium">{t('app.name')}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden no-drag">
        <SearchBar />
        <TabBar tabOrder={tabOrder} />
        <div className="flex-1 overflow-hidden">
          {activeTab === 'commands' ? <CommandsList /> : <HistoryList />}
        </div>
      </div>
    </div>
  )
}

export default App
