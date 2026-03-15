const { shell } = require('electron');
const { spawn } = require('child_process');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function quoteArg(value, isWindows) {
  const normalized = String(value ?? '')
  if (isWindows) {
    return `"${normalized.replace(/"/g, '\\"')}"`
  }
  return `'${normalized.replace(/'/g, `'\\''`)}'`
}

function normalizeNamedArgs(namedArgs) {
  if (!namedArgs || typeof namedArgs !== 'object') {
    return {}
  }

  return Object.entries(namedArgs).reduce((acc, [key, value]) => {
    if (!key) return acc
    acc[key] = String(value ?? '')
    return acc
  }, {})
}

function buildNamedArgsEnv(namedArgs) {
  const env = {}
  for (const [key, value] of Object.entries(namedArgs)) {
    const normalizedKey = key
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[^a-zA-Z_]+/, '')
      .toUpperCase()
    if (!normalizedKey) continue
    env[normalizedKey] = value
  }
  return env
}

class CommandExecutor {
  execute(command, params = {}) {
    switch (command.type) {
      case 'open_dir':
        return this.openDir(command.path || '')
      case 'url':
        return this.openUrl(command.url || '')
      case 'shell':
        return this.executeShell(command.command || '', params)
      case 'script':
        return this.executeScript(command.path || '', params)
      default:
        throw new Error(`Unknown command type: ${command.type}`)
    }
  }

  openDir(path) {
    // 替换 ~ 为用户目录
    const expandedPath = path.replace(/^~/, process.env.HOME || '')
    return shell.openPath(expandedPath)
  }

  openUrl(url) {
    return shell.openExternal(url)
  }

  executeShell(command, params) {
    const isWindows = process.platform === 'win32'
    const namedArgs = normalizeNamedArgs(params.commandNamedArgs)
    const orderedArgs = Array.isArray(params.commandArgs)
      ? params.commandArgs.map((arg) => String(arg ?? ''))
      : []

    // 替换变量
    let cmd = command
      .replace(/\{\{cwd\}\}/g, params.cwd || process.cwd())
      .replace(/\{\{selected_text\}\}/g, params.selectedText || '')

    for (const [key, value] of Object.entries(namedArgs)) {
      const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g')
      cmd = cmd.replace(pattern, value)
    }

    if (orderedArgs.length > 0) {
      const renderedArgs = orderedArgs.map((arg) => quoteArg(arg, isWindows)).join(' ')
      cmd = `${cmd} ${renderedArgs}`
    }

    return new Promise((resolve, reject) => {
      const shell = isWindows ? 'cmd.exe' : '/bin/bash'
      const args = isWindows ? ['/c', cmd] : ['-c', cmd]

      const child = spawn(shell, args, {
        cwd: params.cwd,
        env: {
          ...process.env,
          ...buildNamedArgsEnv(namedArgs)
        }
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr })
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`))
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  executeScript(scriptPath, params) {
    const expandedPath = scriptPath.replace(/^~/, process.env.HOME || '')
    const ext = expandedPath.split('.').pop()?.toLowerCase()
    const namedArgs = normalizeNamedArgs(params.commandNamedArgs)
    const orderedArgs = Array.isArray(params.commandArgs)
      ? params.commandArgs.map((arg) => String(arg ?? ''))
      : []

    let interpreter
    switch (ext) {
      case 'sh':
        interpreter = '/bin/bash'
        break
      case 'bat':
        interpreter = 'cmd.exe'
        break
      case 'ps1':
        interpreter = 'powershell.exe'
        break
      case 'py':
        interpreter = 'python3'
        break
      default:
        interpreter = '/bin/sh'
    }

    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        SELECTED_TEXT: params.selectedText || '',
        CWD: params.cwd || process.cwd(),
        ...buildNamedArgsEnv(namedArgs)
      }

      const child = spawn(interpreter, [expandedPath, ...orderedArgs], {
        cwd: params.cwd,
        env
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr })
        } else {
          reject(new Error(`Script failed with code ${code}: ${stderr}`))
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }
}

module.exports = CommandExecutor
