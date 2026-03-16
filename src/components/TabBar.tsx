import { useCallback, useMemo, useState } from 'react'
import { useStore } from '../stores/useStore'
import { TabType } from '../types'
import { Layers, FileText, Image, Star, Terminal } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'
import { normalizeTabOrder } from '../utils/tabOrder'

const tabMeta: Record<TabType, { labelKey: string; icon: React.ReactNode }> = {
  all: { labelKey: 'tab.all', icon: <Layers className="w-4 h-4" /> },
  commands: { labelKey: 'tab.commands', icon: <Terminal className="w-4 h-4" /> },
  text: { labelKey: 'tab.text', icon: <FileText className="w-4 h-4" /> },
  favorites: { labelKey: 'tab.favorites', icon: <Star className="w-4 h-4" /> },
  image: { labelKey: 'tab.image', icon: <Image className="w-4 h-4" /> },
}

function reorderTabs(order: TabType[], source: TabType, target: TabType) {
  if (source === target) {
    return order
  }
  const sourceIndex = order.indexOf(source)
  const targetIndex = order.indexOf(target)
  if (sourceIndex === -1 || targetIndex === -1) {
    return order
  }
  const next = [...order]
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}

export default function TabBar({ tabOrder }: { tabOrder?: TabType[] }) {
  const { activeTab, setActiveTab, config, setConfig } = useStore()
  const { t } = useI18n()
  const [draggingTab, setDraggingTab] = useState<TabType | null>(null)
  const orderedTabs = useMemo(
    () => normalizeTabOrder(tabOrder || config?.appearance?.tabOrder),
    [config?.appearance?.tabOrder, tabOrder]
  )

  const persistTabOrder = useCallback(async (nextOrder: TabType[]) => {
    try {
      const latest = await window.electronAPI.updateConfig({
        appearance: {
          tabOrder: nextOrder,
        },
      })
      setConfig(latest)
    } catch (error) {
      console.error('Failed to persist tab order:', error)
    }
  }, [setConfig])

  const handleDrop = useCallback(async (targetTab: TabType) => {
    if (!draggingTab || draggingTab === targetTab) {
      setDraggingTab(null)
      return
    }

    const nextOrder = reorderTabs(orderedTabs, draggingTab, targetTab)
    setDraggingTab(null)
    await persistTabOrder(nextOrder)
  }, [draggingTab, orderedTabs, persistTabOrder])

  return (
    <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {orderedTabs.map((tabId) => (
        <button
          key={tabId}
          draggable
          onDragStart={() => setDraggingTab(tabId)}
          onDragEnd={() => setDraggingTab(null)}
          onDragOver={(e) => {
            if (!draggingTab || draggingTab === tabId) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            handleDrop(tabId)
          }}
          onClick={() => setActiveTab(tabId)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tabId
              ? 'text-[var(--color-text-strong)] border-b-2 border-[var(--color-accent)] bg-[var(--color-bg-tab-active)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          {tabMeta[tabId].icon}
          {t(tabMeta[tabId].labelKey)}
        </button>
      ))}
    </div>
  )
}
