import { useState, useEffect } from 'react'
import { Plus, Play, Trash2, Save } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { Command } from '../../types'

type CommandType = 'open_dir' | 'url' | 'shell' | 'script'

const commandTypes: { value: CommandType; label: string }[] = [
  { value: 'open_dir', label: '打开目录' },
  { value: 'url', label: '打开网址' },
  { value: 'shell', label: 'Shell 命令' },
  { value: 'script', label: '执行脚本' },
]

export default function CommandsTab() {
  const { commands, setCommands } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Command>>({})
  const [testing, setTesting] = useState(false)

  // 加载指令
  useEffect(() => {
    const loadCommands = async () => {
      const data = await window.electronAPI.getCommands()
      setCommands(data)
    }
    loadCommands()
  }, [setCommands])

  const handleAdd = async () => {
    const newCommand: Omit<Command, 'id'> = {
      name: '新指令',
      type: 'shell',
      command: 'echo "Hello"',
      shortcut: '',
    }
    const added = await window.electronAPI.addCommand(newCommand)
    setCommands([...commands, added])
    setEditingId(added.id)
    setEditForm(added)
  }

  const handleSave = async () => {
    if (!editingId) return
    const updated = await window.electronAPI.updateCommand(editingId, editForm)
    if (updated) {
      setCommands(commands.map((cmd) => (cmd.id === editingId ? updated : cmd)))
      setEditingId(null)
      setEditForm({})
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个指令吗？')) {
      await window.electronAPI.deleteCommand(id)
      setCommands(commands.filter((cmd) => cmd.id !== id))
    }
  }

  const handleTest = async () => {
    if (!editingId) return
    setTesting(true)
    try {
      await window.electronAPI.executeCommand(editingId)
      alert('执行成功！')
    } catch (error) {
      alert(`执行失败: ${(error as Error).message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#d4d4d4]">快捷指令配置</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[#0e639c] rounded hover:bg-[#1177bb]"
        >
          <Plus className="w-4 h-4" />
          添加指令
        </button>
      </div>

      <div className="space-y-2">
        {commands.map((command) => (
          <div
            key={command.id}
            className="p-3 bg-[#252526] border border-[#3c3c3c] rounded-lg"
          >
            {editingId === command.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[#9da0a6] mb-1">名称</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#9da0a6] mb-1">类型</label>
                    <select
                      value={editForm.type || 'shell'}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as CommandType })}
                      className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    >
                      {commandTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {editForm.type === 'open_dir' && (
                  <div>
                    <label className="block text-xs text-[#9da0a6] mb-1">目录路径</label>
                    <input
                      type="text"
                      value={editForm.path || ''}
                      onChange={(e) => setEditForm({ ...editForm, path: e.target.value })}
                      placeholder="~/Downloads"
                      className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    />
                  </div>
                )}

                {editForm.type === 'url' && (
                  <div>
                    <label className="block text-xs text-[#9da0a6] mb-1">网址</label>
                    <input
                      type="text"
                      value={editForm.url || ''}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    />
                  </div>
                )}

                {editForm.type === 'shell' && (
                  <div>
                    <label className="block text-xs text-[#9da0a6] mb-1">命令</label>
                    <textarea
                      value={editForm.command || ''}
                      onChange={(e) => setEditForm({ ...editForm, command: e.target.value })}
                      placeholder="echo {{selected_text}}"
                      rows={2}
                      className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    />
                    <p className="text-xs text-[#9da0a6] mt-1">
                      支持变量: {'{{cwd}}'}, {'{{selected_text}}'}
                    </p>
                  </div>
                )}

                {editForm.type === 'script' && (
                  <div>
                    <label className="block text-xs text-[#9da0a6] mb-1">脚本路径</label>
                    <input
                      type="text"
                      value={editForm.path || ''}
                      onChange={(e) => setEditForm({ ...editForm, path: e.target.value })}
                      placeholder="~/scripts/example.sh"
                      className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[#9da0a6] mb-1">快捷键 (可选)</label>
                  <input
                    type="text"
                    value={editForm.shortcut || ''}
                    onChange={(e) => setEditForm({ ...editForm, shortcut: e.target.value })}
                    placeholder="Cmd+Shift+G"
                    className="w-full px-2 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded bg-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#0e639c]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[#0e639c] rounded hover:bg-[#1177bb]"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[#3a3d41] rounded hover:bg-[#4a4d51] disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    测试
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditForm({})
                    }}
                    className="px-3 py-1 text-sm text-[#d4d4d4] border border-[#3c3c3c] rounded hover:bg-[#2a2d2e]"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#d4d4d4]">
                    {command.name}
                  </p>
                  <p className="text-xs text-[#9da0a6]">
                    {command.type === 'open_dir' && command.path}
                    {command.type === 'url' && command.url}
                    {command.type === 'shell' && command.command}
                    {command.type === 'script' && command.path}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(command.id)
                      setEditForm(command)
                    }}
                    className="px-2 py-1 text-xs text-[#4fc1ff] hover:bg-[#2a2d2e] rounded"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(command.id)}
                    className="p-1 text-[#9da0a6] hover:text-[#f48771]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
