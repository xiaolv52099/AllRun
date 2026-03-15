const { execSync } = require('child_process')
const path = require('path')

function run(command) {
  try {
    execSync(command, { stdio: 'ignore' })
  } catch {
    // ignore
  }
}

function killProcess(pid) {
  try {
    process.kill(pid, 'SIGKILL')
  } catch {
    // ignore
  }
}

function listProcesses() {
  try {
    const output = execSync('ps -ax -o pid= -o command=', { encoding: 'utf8' })
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const firstSpace = line.indexOf(' ')
        if (firstSpace === -1) return null

        const pid = Number.parseInt(line.slice(0, firstSpace).trim(), 10)
        const command = line.slice(firstSpace + 1)

        if (!Number.isFinite(pid) || !command) {
          return null
        }

        return { pid, command }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

const cwd = process.cwd()
const electronBinary = path.join(cwd, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
const electronWrapper = path.join(cwd, 'node_modules/.bin/electron')
const concurrentlyWrapper = path.join(cwd, 'node_modules/.bin/concurrently')

// 清理端口占用
run('npx kill-port 5173')

for (const proc of listProcesses()) {
  const command = proc.command

  const isProjectElectron =
    command.includes(`${electronBinary} .`) ||
    command.includes(`${electronWrapper} .`)

  const isProjectConcurrently =
    command.includes(concurrentlyWrapper) &&
    command.includes('npm run dev:vite')

  if (isProjectElectron || isProjectConcurrently) {
    killProcess(proc.pid)
  }
}
