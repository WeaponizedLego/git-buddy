import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

interface Settings {
  lastProjectPath: string | null
}

const defaults: Settings = {
  lastProjectPath: null
}

function getSettingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function getSettings(): Settings {
  try {
    const raw = readFileSync(getSettingsPath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return { ...defaults, ...parsed }
  } catch {
    return { ...defaults }
  }
}

function saveSettings(settings: Settings): void {
  const filePath = getSettingsPath()
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
}

export function getLastProjectPath(): string | null {
  return getSettings().lastProjectPath
}

export function saveLastProjectPath(path: string | null): void {
  const settings = getSettings()
  settings.lastProjectPath = path
  saveSettings(settings)
}
