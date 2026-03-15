import { Command } from '../types'

export interface ParsedCommandParams {
  orderedArgs: string[]
  namedArgs: Record<string, string>
}

function stripOuterQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function tokenizeInput(input: string) {
  const matches = input.match(/"[^"]*"|'[^']*'|\S+/g)
  if (!matches) return []
  return matches.map((token) => stripOuterQuotes(token.trim())).filter(Boolean)
}

export function parseCommandParamNames(schema?: string) {
  if (!schema) return []

  const seen = new Set<string>()
  const names: string[] = []

  schema
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      const normalized = token.replace(/=$/, '')
      if (!normalized || seen.has(normalized)) return
      seen.add(normalized)
      names.push(normalized)
    })

  return names
}

export function hasShellParamConfig(command: Command) {
  return command.type === 'shell' && parseCommandParamNames(command.bashParams).length > 0
}

export function parseCommandParamInput(input: string, paramNames: string[]): ParsedCommandParams {
  const tokens = tokenizeInput(input.trim())
  if (tokens.length === 0) {
    return {
      orderedArgs: [],
      namedArgs: {},
    }
  }

  const namedArgs: Record<string, string> = {}
  const positionalTokens: string[] = []

  for (const token of tokens) {
    const equalIndex = token.indexOf('=')
    if (equalIndex > 0) {
      const key = token.slice(0, equalIndex).trim()
      const value = stripOuterQuotes(token.slice(equalIndex + 1).trim())
      if (paramNames.includes(key)) {
        namedArgs[key] = value
        continue
      }
    }
    positionalTokens.push(token)
  }

  const orderedArgs: string[] = []
  let positionalIndex = 0

  for (const name of paramNames) {
    if (namedArgs[name] !== undefined) {
      orderedArgs.push(namedArgs[name])
      continue
    }
    if (positionalTokens[positionalIndex] !== undefined) {
      const value = positionalTokens[positionalIndex]
      namedArgs[name] = value
      orderedArgs.push(value)
      positionalIndex += 1
    }
  }

  const remainArgs = positionalTokens.slice(positionalIndex)
  return {
    orderedArgs: [...orderedArgs, ...remainArgs],
    namedArgs,
  }
}
