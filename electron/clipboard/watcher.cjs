const { clipboard } = require('electron')
const path = require('path')
const { getClipboardFilePaths } = require('./filePaths.cjs')

class ClipboardWatcher {
  constructor(historyStore, onChange) {
    this.historyStore = historyStore
    this.onChange = typeof onChange === 'function' ? onChange : () => {}
    this.interval = null
    this.lastContent = ''
    this.lastImageHash = ''
    this.lastFileSignature = ''
    this.checkInterval = 100 // 100ms
  }

  start() {
    // 初始化时记录当前剪切板内容
    this.lastContent = clipboard.readText() || ''

    const image = clipboard.readImage()
    if (!image.isEmpty()) {
      this.lastImageHash = this.hashImage(image)
    }

    const initialFilePaths = getClipboardFilePaths()
    if (initialFilePaths.length > 0) {
      this.lastFileSignature = initialFilePaths.join('\n')
    }

    // 开始轮询
    this.interval = setInterval(() => this.check(), this.checkInterval)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  check() {
    try {
      // 检查图片
      const image = clipboard.readImage()
      if (!image.isEmpty()) {
        const hash = this.hashImage(image)
        if (hash !== this.lastImageHash) {
          this.lastImageHash = hash
          this.lastContent = ''
          this.lastFileSignature = ''
          this.handleImage(image)
          return
        }
      }

      // 检查文件
      const filePaths = getClipboardFilePaths()
      if (filePaths.length > 0) {
        const signature = filePaths.join('\n')
        if (signature === this.lastFileSignature) {
          return
        }

        this.lastFileSignature = signature
        this.lastContent = ''
        this.lastImageHash = ''
        this.handleFiles(filePaths)
        return
      }

      // 检查文本
      const text = clipboard.readText()
      if (text && text !== this.lastContent) {
        this.lastContent = text
        this.lastImageHash = ''
        this.lastFileSignature = ''
        this.handleText(text)
      }
    } catch (error) {
      // 避免单次剪贴板解析异常导致监听链路中断
      console.error('Clipboard watcher check failed:', error)
    }
  }

  handleText(text) {
    const item = this.historyStore.add({
      type: 'text',
      content: text
    })
    this.emitChange(item)
  }

  handleImage(image) {
    // 图片处理逻辑 - 需要与 imageHandler 配合
    const buffer = image.toPNG()
    // 这里简化处理，实际应该转换为 WebP
    const base64 = buffer.toString('base64')

    const item = this.historyStore.add({
      type: 'image',
      content: `data:image/png;base64,${base64}`
    })
    this.emitChange(item)
  }

  handleFiles(filePaths) {
    filePaths.forEach(filePath => {
      const item = this.historyStore.add({
        type: 'file',
        content: filePath,
        metadata: {
          fileName: path.basename(filePath) || filePath,
        }
      })
      this.emitChange(item)
    })
  }

  emitChange(item) {
    try {
      this.onChange(item)
    } catch (error) {
      console.error('Failed to emit clipboard change:', error)
    }
  }

  hashImage(image) {
    const buffer = image.toBitmap()
    return this.simpleHash(buffer.toString('base64'))
  }

  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
}

module.exports = ClipboardWatcher
