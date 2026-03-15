const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class FavoritesStore {
  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'favorites.json')
    this.items = new Map()
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8')
        const items = JSON.parse(data)
        this.items = new Map(items.map(item => [item.id, item]))
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
      this.items = new Map()
    }
  }

  save() {
    try {
      const userDataPath = app.getPath('userData')
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true })
      }
      const items = Array.from(this.items.values())
      fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2))
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }

  getAll() {
    return Array.from(this.items.values())
  }

  isFavorited(id) {
    return this.items.has(id)
  }

  toggle(id, remark) {
    if (this.items.has(id)) {
      this.items.delete(id)
    } else {
      this.items.set(id, {
        id,
        remark,
        createdAt: new Date().toISOString()
      })
    }
    this.save()
    return this.items.has(id)
  }

  updateRemark(id, remark) {
    const item = this.items.get(id)
    if (item) {
      item.remark = remark
      this.save()
      return true
    }
    return false
  }

  getRemark(id) {
    return this.items.get(id)?.remark || ''
  }

  remove(id) {
    const result = this.items.delete(id)
    if (result) {
      this.save()
    }
    return result
  }
}

module.exports = FavoritesStore
