import { useStore } from '../stores/useStore'
import { TabType } from '../types'
import { Layers, FileText, Image, Star, Terminal } from 'lucide-react'

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: '全部', icon: <Layers className="w-4 h-4" /> },
  { id: 'text', label: '文本', icon: <FileText className="w-4 h-4" /> },
  { id: 'image', label: '图片', icon: <Image className="w-4 h-4" /> },
  { id: 'favorites', label: '收藏', icon: <Star className="w-4 h-4" /> },
  { id: 'commands', label: '指令', icon: <Terminal className="w-4 h-4" /> },
]

export default function TabBar() {
  const { activeTab, setActiveTab } = useStore()

  return (
    <div className="flex border-b border-[#3c3c3c] bg-[#252526]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-[#ffffff] border-b-2 border-[#0e639c] bg-[#1f1f1f]'
              : 'text-[#9da0a6] hover:text-[#d4d4d4] hover:bg-[#2a2d2e]'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
