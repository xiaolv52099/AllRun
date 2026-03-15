const { shell } = require('electron');
const { spawn } = require('child_process');

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
    // 替换变量
    let cmd = command
      .replace(/\{\{cwd\}\}/g, params.cwd || process.cwd())
      .replace(/\{\{selected_text\}\}/g, params.selectedText || '')

    return new Promise((resolve, reject) => {
      const isWindows = process.platform === 'win32'
      const shell = isWindows ? 'cmd.exe' : '/bin/bash'
      const args = isWindows ? ['/c', cmd] : ['-c', cmd]

      const child = spawn(shell, args, {
        cwd: params.cwd,
        env: { ...process.env }
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
        CWD: params.cwd || process.cwd()
      }

      const child = spawn(interpreter, [expandedPath], {
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
