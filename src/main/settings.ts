import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

interface Settings {
  lastProjectPath: string | null
  lastUpdateCheck: number | null
  snoozedVersion: string | null
}

const defaults: Settings = {
  lastProjectPath: null,
  lastUpdateCheck: null,
  snoozedVersion: null
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

export function getUpdateSettings(): { lastUpdateCheck: number | null; snoozedVersion: string | null } {
  const s = getSettings()
  return { lastUpdateCheck: s.lastUpdateCheck, snoozedVersion: s.snoozedVersion }
}

export function saveUpdateSettings(lastUpdateCheck: number | null, snoozedVersion: string | null): void {
  const settings = getSettings()
  settings.lastUpdateCheck = lastUpdateCheck
  settings.snoozedVersion = snoozedVersion
  saveSettings(settings)
}
