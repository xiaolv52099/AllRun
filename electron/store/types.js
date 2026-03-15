// TypeScript 类型声明 (保留为注释以供参考)
/*
// 历史记录条目类型
export interface HistoryItem {
  id: string
  type: 'text' | 'image' | 'file'
  content: string // 文本内容、图片路径或文件路径
  copyCount: number
  createdAt: string
  updatedAt: string
  isFavorited: boolean
  remark: string
  metadata?: {
    fileName?: string
    fileSize?: number
    fileType?: string
    imageWidth?: number
    imageHeight?: number
  }
}

// 快捷指令类型
export interface Command {
  id: string
  name: string
  type: 'open_dir' | 'url' | 'shell' | 'script'
  path?: string
  url?: string
  command?: string
  shortcut?: string
  icon?: string
  description?: string
}

// 应用配置类型
export interface AppConfig {
  window: {
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
}

// Tab 类型
export type TabType = 'all' | 'text' | 'favorites' | 'commands'

// 剪切板内容类型
export interface ClipboardContent {
  type: 'text' | 'image' | 'file'
  content: string | Buffer
  metadata?: Record<string, any>
}
*/
