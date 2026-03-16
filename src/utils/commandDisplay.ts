import { Command } from '../types'

export function getCommandDetail(command: Command) {
  if (command.type === 'open_dir') return command.path || ''
  if (command.type === 'url') return command.url || ''
  if (command.type === 'shell') return command.command || ''
  if (command.type === 'script') return command.path || ''
  return ''
}
