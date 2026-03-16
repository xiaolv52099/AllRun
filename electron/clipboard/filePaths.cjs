const path = require('path')
const { clipboard } = require('electron')

function decodeFileUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'file:') {
      return null
    }

    if (process.platform === 'win32') {
      const pathname = decodeURIComponent(url.pathname || '')
      return pathname.replace(/^\/+/, '').replace(/\//g, '\\')
    }

    return decodeURIComponent(url.pathname || '')
  } catch {
    return null
  }
}

function parseFileUrlLines(text) {
  if (!text) {
    return []
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('file://'))
    .map(decodeFileUrl)
    .filter(Boolean)
}

function parseWindowsFileNameW(buffer) {
  if (!buffer || buffer.length === 0) {
    return []
  }

  return buffer
    .toString('utf16le')
    .split('\u0000')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => path.normalize(line))
}

function parseWindowsFileName(buffer) {
  if (!buffer || buffer.length === 0) {
    return []
  }

  return buffer
    .toString('utf8')
    .split('\u0000')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => path.normalize(line))
}

function dedupePaths(paths) {
  const seen = new Set()
  const result = []

  paths.forEach((item) => {
    if (!item || seen.has(item)) {
      return
    }
    seen.add(item)
    result.push(item)
  })

  return result
}

function getClipboardFilePaths() {
  const formats = clipboard.availableFormats()

  const filePaths = []

  if (formats.includes('public.file-url') || formats.includes('NSFilenamesPboardType')) {
    filePaths.push(...parseFileUrlLines(clipboard.readText().trim()))
  }

  if (process.platform === 'win32') {
    try {
      if (formats.includes('FileNameW')) {
        filePaths.push(...parseWindowsFileNameW(clipboard.readBuffer('FileNameW')))
      }
      if (formats.includes('FileName')) {
        filePaths.push(...parseWindowsFileName(clipboard.readBuffer('FileName')))
      }
    } catch {
      // ignore
    }
  }

  return dedupePaths(filePaths)
}

module.exports.getClipboardFilePaths = getClipboardFilePaths
