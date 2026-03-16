const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_COMMANDS = [
  {
    id: 'cmd-001',
    name: '打开下载目录',
    remark: '',
    type: 'open_dir',
    path: '~/Downloads',
    shortcut: 'Cmd+Shift+D'
  },
  {
    id: 'cmd-002',
    name: '打开 GitHub',
    remark: '',
    type: 'url',
    url: 'https://github.com',
    shortcut: 'Cmd+Shift+G'
  }
]

class CommandsStore {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'commands.json')
    this.commands = []
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        this.commands = JSON.parse(data).map((command) => ({
          remark: '',
          ...command,
        }))
      } else {
        // 使用默认配置
        this.commands = [...DEFAULT_COMMANDS]
        this.save()
      }
    } catch (error) {
      console.error('Failed to load commands:', error)
      this.commands = [...DEFAULT_COMMANDS]
    }
  }

  save() {
    try {
      const userDataPath = app.getPath('userData')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.commands, null, 2))
    } catch (error) {
      console.error('Failed to save commands:', error)
    }
  }

  getAll() {
    return [...this.commands]
  }

  getById(id) {
    return this.commands.find(cmd => cmd.id === id)
  }

  add(command) {
    const newCommand = {
      remark: '',
      ...command,
      id: uuidv4()
    }
    this.commands.push(newCommand)
    this.save()
    return newCommand
  }

  update(id, command) {
    const index = this.commands.findIndex(cmd => cmd.id === id)
    if (index !== -1) {
      this.commands[index] = { ...this.commands[index], ...command }
      this.save()
      return this.commands[index]
    }
    return undefined
  }

  delete(id) {
    const index = this.commands.findIndex(cmd => cmd.id === id)
    if (index !== -1) {
      this.commands.splice(index, 1)
      this.save()
      return true
    }
    return false
  }

  reorder(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return this.getAll()
    }

    const map = new Map(this.commands.map((command) => [command.id, command]))
    const used = new Set()
    const reordered = []

    ids.forEach((id) => {
      if (used.has(id)) return
      const command = map.get(id)
      if (!command) return
      used.add(id)
      reordered.push(command)
    })

    this.commands.forEach((command) => {
      if (!used.has(command.id)) {
        reordered.push(command)
      }
    })

    this.commands = reordered
    this.save()
    return this.getAll()
  }

  import(commands) {
    this.commands = commands
    this.save()
  }

  export() {
    return this.getAll()
  }
}

module.exports = CommandsStore
