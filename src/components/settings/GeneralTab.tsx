import { useStore } from '../../stores/useStore'
import { useState, useEffect } from 'react'

export default function GeneralTab() {
  const { config, setConfig } = useStore()
  const [localConfig, setLocalConfig] = useState(config?.general || {
    autoStart: false,
    historyRetentionDays: 30,
    maxHistoryItems: 100,
    imageStorageLimitMB: 200,
  })

  useEffect(() => {
    if (config?.general) {
      setLocalConfig(config.general)
    }
  }, [config])

  const handleChange = async (key: string, value: any) => {
    if (!config) return

    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)

    try {
      const updatedConfig = {
        ...config,
        general: newConfig,
      }
      const savedConfig = await window.electronAPI.updateConfig(updatedConfig)
      setConfig(savedConfig)
    } catch (error) {
      console.error('Failed to update config:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#d4d4d4]">基本设置</h3>

        {/* 开机自启 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#d4d4d4]">开机自启</p>
            <p className="text-xs text-[#9da0a6]">登录时自动启动 AllRun</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.autoStart}
              onChange={(e) => handleChange('autoStart', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#3c3c3c] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0e639c] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#ffffff] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#ffffff] after:border-[#3c3c3c] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0e639c]"></div>
          </label>
        </div>

        {/* 历史保留天数 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#d4d4d4]">历史保留天数</p>
            <p className="text-xs text-[#9da0a6]">超过天数的历史记录将自动清理</p>
          </div>
          <input
            type="number"
            value={localConfig.historyRetentionDays}
            onChange={(e) => handleChange('historyRetentionDays', parseInt(e.target.value) || 30)}
            min={1}
            max={365}
            className="w-20 px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#252526] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
          />
        </div>

        {/* 最大历史条数 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#d4d4d4]">最大历史条数</p>
            <p className="text-xs text-[#9da0a6]">超过数量时清理最旧的记录</p>
          </div>
          <input
            type="number"
            value={localConfig.maxHistoryItems}
            onChange={(e) => handleChange('maxHistoryItems', parseInt(e.target.value) || 100)}
            min={10}
            max={1000}
            className="w-20 px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#252526] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
          />
        </div>

        {/* 图片存储上限 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#d4d4d4]">图片存储上限 (MB)</p>
            <p className="text-xs text-[#9da0a6]">超过上限时清理最旧的图片</p>
          </div>
          <input
            type="number"
            value={localConfig.imageStorageLimitMB}
            onChange={(e) => handleChange('imageStorageLimitMB', parseInt(e.target.value) || 200)}
            min={50}
            max={2000}
            className="w-20 px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#252526] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
          />
        </div>
      </div>

      {/* 数据管理 */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[#d4d4d4]">数据管理</h3>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (confirm('确定要清空所有历史记录吗？收藏的内容不会被删除。')) {
                await window.electronAPI.clearHistory()
                // 刷新历史记录
                const history = await window.electronAPI.getHistory()
                useStore.getState().setHistory(history)
              }
            }}
            className="px-3 py-1.5 text-sm text-[#f48771] border border-[#6b2f2b] rounded hover:bg-[#3a1f1c]"
          >
            清空历史记录
          </button>
        </div>
      </div>
    </div>
  )
}
