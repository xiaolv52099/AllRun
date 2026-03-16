const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class HistoryStore {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'history.json')
    this.items = []
    this.maxItems = 100
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        this.items = JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
      this.items = []
    }
  }

  save() {
    try {
      const userDataPath = app.getPath('userData')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2))
    } catch (error) {
      console.error('Failed to save history:', error)
    }
  }

  getAll() {
    return [...this.items].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  getById(id) {
    return this.items.find(item => item.id === id)
  }

  add(item) {
    const now = new Date().toISOString()

    // 检查是否存在相同内容
    const existing = this.items.find(i => i.content === item.content && i.type === item.type)
    if (existing) {
      existing.copyCount++
      existing.updatedAt = now
      const existingIndex = this.items.findIndex(i => i.id === existing.id)
      if (existingIndex > 0) {
        this.items.splice(existingIndex, 1)
        this.items.unshift(existing)
      }
      this.save()
      return existing
    }

    // 创建新条目
    const newItem = {
      ...item,
      id: uuidv4(),
      copyCount: 1,
      createdAt: now,
      updatedAt: now,
      isFavorited: false,
      remark: ''
    }

    this.items.unshift(newItem)

    // 限制数量
    if (this.items.length > this.maxItems) {
      // 移除未收藏的最旧条目
      const toRemove = this.items
        .filter(i => !i.isFavorited)
        .slice(this.maxItems)
      toRemove.forEach(i => {
        const index = this.items.findIndex(item => item.id === i.id)
        if (index !== -1) {
          this.items.splice(index, 1)
        }
      })
    }

    this.save()
    return newItem
  }

  delete(id) {
    const index = this.items.findIndex(item => item.id === id)
    if (index !== -1) {
      this.items.splice(index, 1)
      this.save()
      return true
    }
    return false
  }

  clear() {
    // 只保留收藏的条目
    this.items = this.items.filter(item => item.isFavorited)
    this.save()
  }

  updateFavorite(id, isFavorited) {
    const item = this.items.find(i => i.id === id)
    if (item) {
      item.isFavorited = isFavorited
      this.save()
      return true
    }
    return false
  }

  updateRemark(id, remark) {
    const item = this.items.find(i => i.id === id)
    if (item) {
      item.remark = remark
      this.save()
      return true
    }
    return false
  }

  setMaxItems(max) {
    this.maxItems = max
    this.save()
  }
}

module.exports = HistoryStore
