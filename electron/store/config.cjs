const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_TAB_ORDER = ['all', 'commands', 'text', 'favorites', 'image']

const DEFAULT_CONFIG = {
  window: {
    width: 450,
    height: 400
  },
  settingsWindow: {
    width: 450,
    height: 400
  },
  shortcuts: {
    toggleWindow: 'CommandOrControl+1',
    openSettings: 'CommandOrControl+,'
  },
  general: {
    autoStart: false,
    historyRetentionDays: 30,
    maxHistoryItems: 100,
    imageStorageLimitMB: 200
  },
  appearance: {
    theme: 'dark',
    settingsZoom: 100,
    language: 'zh-CN',
    tabOrder: [...DEFAULT_TAB_ORDER],
    favoriteOrder: [],
  }
}

function normalizeTabOrder(order) {
  const source = Array.isArray(order) ? order : []
  const seen = new Set()
  const result = []

  source.forEach((item) => {
    if (DEFAULT_TAB_ORDER.includes(item) && !seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  })

  DEFAULT_TAB_ORDER.forEach((item) => {
    if (!seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  })

  return result
}

function normalizeFavoriteOrder(order) {
  if (!Array.isArray(order)) {
    return []
  }

  const seen = new Set()
  const result = []
  order.forEach((item) => {
    if (typeof item !== 'string' || !item || seen.has(item)) {
      return
    }
    seen.add(item)
    result.push(item)
  })
  return result
}

function mergeConfig(config = {}) {
  const appearance = {
    ...DEFAULT_CONFIG.appearance,
    ...config.appearance,
  }

  return {
    ...DEFAULT_CONFIG,
    ...config,
    window: {
      ...DEFAULT_CONFIG.window,
      ...config.window,
    },
    settingsWindow: {
      ...DEFAULT_CONFIG.settingsWindow,
      ...config.settingsWindow,
    },
    shortcuts: {
      ...DEFAULT_CONFIG.shortcuts,
      ...config.shortcuts,
    },
    general: {
      ...DEFAULT_CONFIG.general,
      ...config.general,
    },
    appearance: {
      ...appearance,
      tabOrder: normalizeTabOrder(appearance.tabOrder),
      favoriteOrder: normalizeFavoriteOrder(appearance.favoriteOrder),
    },
  }
}

class ConfigStore {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'config.json')
    this.config = this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        return mergeConfig(JSON.parse(data))
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
    return mergeConfig()
  }

  save() {
    try {
      const userDataPath = app.getPath('userData')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.config, null, 2))
    } catch (error) {
      console.error('Failed to save config:', error)
    }
  }

  getConfig() {
    return mergeConfig(this.config)
  }

  updateConfig(config) {
    this.config = mergeConfig({
      ...this.config,
      ...config,
      window: {
        ...this.config.window,
        ...config.window,
      },
      settingsWindow: {
        ...this.config.settingsWindow,
        ...config.settingsWindow,
      },
      shortcuts: {
        ...this.config.shortcuts,
        ...config.shortcuts,
      },
      general: {
        ...this.config.general,
        ...config.general,
      },
      appearance: {
        ...this.config.appearance,
        ...config.appearance,
      },
    })
    this.save()
  }

  updateWindowSettings(window) {
    this.config.window = { ...this.config.window, ...window }
    this.save()
  }

  updateSettingsWindowSettings(window) {
    this.config.settingsWindow = { ...this.config.settingsWindow, ...window }
    this.save()
  }

  updateShortcuts(shortcuts) {
    this.config.shortcuts = { ...this.config.shortcuts, ...shortcuts }
    this.save()
  }

  updateGeneral(general) {
    this.config.general = { ...this.config.general, ...general }
    this.save()
  }

  getShortcut(action) {
    return this.config.shortcuts[action]
  }

  getWindowSettings() {
    return { ...this.config.window }
  }
}

module.exports = ConfigStore
