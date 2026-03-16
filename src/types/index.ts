export type HistoryType = 'text' | 'image' | 'file'
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export interface HistoryMetadata {
  fileName?: string
  fileSize?: number
  fileType?: string
  imageWidth?: number
  imageHeight?: number
}

export interface HistoryItem {
  id: string
  type: HistoryType
  content: string
  copyCount: number
  createdAt: string
  updatedAt: string
  isFavorited: boolean
  remark: string
  metadata?: HistoryMetadata
}

export type CommandType = 'open_dir' | 'url' | 'shell' | 'script'

export interface Command {
  id: string
  name: string
  remark?: string
  type: CommandType
  path?: string
  url?: string
  command?: string
  bashParams?: string
  shortcut?: string
  icon?: string
  description?: string
}

export interface AppConfig {
  window: {
    width: number
    height: number
  }
  settingsWindow: {
    width: number
    height: number
  }
  shortcuts: {
    toggleWindow: string
    openSettings: string
  }
  general: {
    autoStart: boolean
    historyRetentionDays: number
    maxHistoryItems: number
    imageStorageLimitMB: number
  }
  appearance: {
    theme: 'dark' | 'light'
    settingsZoom: number
    language: 'zh-CN' | 'zh-TW' | 'en-US' | 'ko-KR' | 'ja-JP'
    tabOrder: TabType[]
    favoriteOrder: string[]
  }
}

export type TabType = 'all' | 'text' | 'image' | 'favorites' | 'commands'

export interface ClipboardContent {
  type: HistoryType
  content: string | string[]
  formats?: string[]
}

export interface ElectronAPI {
  getHistory: () => Promise<HistoryItem[]>
  addHistory: (item: Partial<HistoryItem>) => Promise<HistoryItem>
  deleteHistory: (id: string) => Promise<boolean>
  clearHistory: () => Promise<void>

  getFavorites: () => Promise<{ id: string; remark: string; createdAt: string }[]>
  toggleFavorite: (id: string) => Promise<boolean>
  updateRemark: (id: string, remark: string) => Promise<boolean>

  getConfig: () => Promise<AppConfig>
  updateConfig: (config: DeepPartial<AppConfig>) => Promise<AppConfig>

  getCommands: () => Promise<Command[]>
  addCommand: (command: Omit<Command, 'id'>) => Promise<Command>
  updateCommand: (id: string, command: Partial<Command>) => Promise<Command | undefined>
  deleteCommand: (id: string) => Promise<boolean>
  reorderCommands: (ids: string[]) => Promise<Command[]>
  executeCommand: (
    id: string,
    params?: Record<string, unknown> & {
      commandArgs?: string[]
      commandNamedArgs?: Record<string, string>
      rawInput?: string
    }
  ) => Promise<unknown>

  readClipboard: () => Promise<ClipboardContent>
  writeClipboard: (text: string) => Promise<boolean>
  writeImageClipboard: (dataUrl: string) => Promise<boolean>
  pasteTextAtCursor: (text: string) => Promise<boolean>

  hideWindow: () => Promise<void>
  showWindow: () => Promise<void>
  toggleWindow: () => Promise<void>
  openSettingsWindow: () => Promise<boolean>
  closeSettingsWindow: () => Promise<boolean>
  quitApp: () => Promise<boolean>

  onClipboardChange: (callback: (item: HistoryItem) => void) => () => void
  onShortcutTriggered: (callback: (action: string) => void) => () => void
  onWindowOpened: (callback: () => void) => () => void
  onConfigUpdated: (callback: (config: AppConfig) => void) => () => void
  onCommandsUpdated: (callback: (commands: Command[]) => void) => () => void
}
