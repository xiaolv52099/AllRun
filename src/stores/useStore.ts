import { create } from 'zustand'
import { TabType, HistoryItem, Command, AppConfig } from '../types'

interface StoreState {
  // 历史记录
  history: HistoryItem[]
  setHistory: (history: HistoryItem[]) => void

  // 搜索
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Tab
  activeTab: TabType
  setActiveTab: (tab: TabType) => void

  // 选中项
  selectedIndex: number
  setSelectedIndex: (index: number) => void

  // 配置
  config: AppConfig | null
  setConfig: (config: AppConfig) => void

  // 快捷指令
  commands: Command[]
  setCommands: (commands: Command[]) => void

  // 加载状态
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
  // 历史记录
  history: [],
  setHistory: (history) => set({ history }),

  // 搜索
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery, selectedIndex: 0 }),

  // Tab
  activeTab: 'all',
  setActiveTab: (activeTab) => set({ activeTab, selectedIndex: 0 }),

  // 选中项
  selectedIndex: 0,
  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

  // 配置
  config: null,
  setConfig: (config) => set({ config }),

  // 快捷指令
  commands: [],
  setCommands: (commands) => set({ commands }),

  // 加载状态
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}))
