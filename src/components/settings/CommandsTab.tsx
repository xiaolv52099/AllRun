import { useState, useEffect } from 'react'
import { Plus, Play, Trash2, Save } from 'lucide-react'
import { useStore } from '../../stores/useStore'
import { Command } from '../../types'
import { useI18n } from '../../hooks/useI18n'

type CommandType = 'open_dir' | 'url' | 'shell' | 'script'

const commandTypes: { value: CommandType; labelKey: string }[] = [
  { value: 'open_dir', labelKey: 'commands.type.openDir' },
  { value: 'url', labelKey: 'commands.type.url' },
  { value: 'shell', labelKey: 'commands.type.shell' },
  { value: 'script', labelKey: 'commands.type.script' },
]

export default function CommandsTab() {
  const { commands, setCommands } = useStore()
  const { t } = useI18n()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Command>>({})
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const loadCommands = async () => {
      const data = await window.electronAPI.getCommands()
      setCommands(data)
    }
    loadCommands()
  }, [setCommands])

  const handleAdd = async () => {
    const newCommand: Omit<Command, 'id'> = {
      name: t('commands.newName'),
      type: 'shell',
      command: 'echo "Hello"',
      bashParams: '',
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
    if (confirm(t('commands.deleteConfirm'))) {
      await window.electronAPI.deleteCommand(id)
      setCommands(commands.filter((cmd) => cmd.id !== id))
    }
  }

  const handleTest = async () => {
    if (!editingId) return
    setTesting(true)
    try {
      await window.electronAPI.executeCommand(editingId)
      alert(t('commands.testSuccess'))
    } catch (error) {
      alert(t('commands.testFailed', { message: (error as Error).message }))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{t('commands.title')}</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[var(--color-accent)] rounded hover:bg-[var(--color-accent-hover)]"
        >
          <Plus className="w-4 h-4" />
          {t('commands.add')}
        </button>
      </div>

      <div className="space-y-2">
        {commands.map((command) => (
          <div
            key={command.id}
            className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg"
          >
            {editingId === command.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.name')}</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.type')}</label>
                    <select
                      value={editForm.type || 'shell'}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as CommandType })}
                      className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    >
                      {commandTypes.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {editForm.type === 'open_dir' && (
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.path')}</label>
                    <input
                      type="text"
                      value={editForm.path || ''}
                      onChange={(e) => setEditForm({ ...editForm, path: e.target.value })}
                      placeholder="~/Downloads"
                      className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                )}

                {editForm.type === 'url' && (
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.url')}</label>
                    <input
                      type="text"
                      value={editForm.url || ''}
                      onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                )}

                {editForm.type === 'shell' && (
                  <>
                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.command')}</label>
                      <textarea
                        value={editForm.command || ''}
                        onChange={(e) => setEditForm({ ...editForm, command: e.target.value })}
                        placeholder="echo {{selected_text}}"
                        rows={2}
                        className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {t('commands.field.commandHint')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.bashParams')}</label>
                      <input
                        type="text"
                        value={editForm.bashParams || ''}
                        onChange={(e) => setEditForm({ ...editForm, bashParams: e.target.value })}
                        placeholder={t('commands.placeholder.params')}
                        className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {t('commands.field.bashParamsHint')}
                      </p>
                    </div>
                  </>
                )}

                {editForm.type === 'script' && (
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.scriptPath')}</label>
                    <input
                      type="text"
                      value={editForm.path || ''}
                      onChange={(e) => setEditForm({ ...editForm, path: e.target.value })}
                      placeholder="~/scripts/example.sh"
                      className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{t('commands.field.shortcut')}</label>
                  <input
                    type="text"
                    value={editForm.shortcut || ''}
                    onChange={(e) => setEditForm({ ...editForm, shortcut: e.target.value })}
                    placeholder="Cmd+Shift+G"
                    className="w-full px-2 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[var(--color-accent)] rounded hover:bg-[var(--color-accent-hover)]"
                  >
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-[var(--color-muted-button)] rounded hover:bg-[var(--color-muted-button-hover)] disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    {t('commands.test')}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditForm({})
                    }}
                    className="px-3 py-1 text-sm text-[var(--color-text-primary)] border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-hover)]"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {command.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] break-words">
                    {command.type === 'open_dir' && command.path}
                    {command.type === 'url' && command.url}
                    {command.type === 'shell' && command.command}
                    {command.type === 'script' && command.path}
                  </p>
                  {command.type === 'shell' && command.bashParams && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {t('commands.paramPreview', { value: command.bashParams })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 self-center">
                  <button
                    onClick={() => {
                      setEditingId(command.id)
                      setEditForm(command)
                    }}
                    className="px-2 py-1 text-xs whitespace-nowrap leading-none text-[var(--color-accent-hover)] hover:bg-[var(--color-bg-hover)] rounded"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(command.id)}
                    className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)]"
                    title={t('common.delete')}
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
