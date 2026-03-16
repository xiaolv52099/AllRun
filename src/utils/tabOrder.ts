import { TabType } from '../types'

export const DEFAULT_TAB_ORDER: TabType[] = ['all', 'commands', 'text', 'favorites', 'image']

export function normalizeTabOrder(order?: readonly string[] | null): TabType[] {
  const source = Array.isArray(order) ? order : []
  const seen = new Set<TabType>()
  const result: TabType[] = []

  source.forEach((item) => {
    if (!DEFAULT_TAB_ORDER.includes(item as TabType)) {
      return
    }
    const tab = item as TabType
    if (seen.has(tab)) {
      return
    }
    seen.add(tab)
    result.push(tab)
  })

  DEFAULT_TAB_ORDER.forEach((item) => {
    if (!seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  })

  return result
}
