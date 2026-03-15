import { useStore } from '../stores/useStore'
import { TabType } from '../types'
import { Layers, FileText, Image, Star, Terminal } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

const tabs: { id: TabType; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'all', labelKey: 'tab.all', icon: <Layers className="w-4 h-4" /> },
  { id: 'text', labelKey: 'tab.text', icon: <FileText className="w-4 h-4" /> },
  { id: 'image', labelKey: 'tab.image', icon: <Image className="w-4 h-4" /> },
  { id: 'favorites', labelKey: 'tab.favorites', icon: <Star className="w-4 h-4" /> },
  { id: 'commands', labelKey: 'tab.commands', icon: <Terminal className="w-4 h-4" /> },
]

export default function TabBar() {
  const { activeTab, setActiveTab } = useStore()
  const { t } = useI18n()

  return (
    <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-[var(--color-text-strong)] border-b-2 border-[var(--color-accent)] bg-[var(--color-bg-tab-active)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          }`}
        >
          {tab.icon}
          {t(tab.labelKey)}
        </button>
      ))}
    </div>
  )
}
