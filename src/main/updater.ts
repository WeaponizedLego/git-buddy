import { app } from 'electron'
import { getUpdateSettings, saveUpdateSettings } from './settings'

export interface UpdateInfo {
  version: string
  releaseUrl: string
}

function semverIsNewer(fetched: string, current: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10))
  const [fMaj, fMin, fPat] = parse(fetched)
  const [cMaj, cMin, cPat] = parse(current)
  if (fMaj !== cMaj) return fMaj > cMaj
  if (fMin !== cMin) return fMin > cMin
  return fPat > cPat
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const { lastUpdateCheck, snoozedVersion } = getUpdateSettings()

    const ONE_DAY = 24 * 60 * 60 * 1000
    if (lastUpdateCheck !== null && Date.now() - lastUpdateCheck < ONE_DAY) {
      return null
    }

    const response = await fetch(
      'https://api.github.com/repos/WeaponizedLego/git-buddy/releases/latest',
      { headers: { 'User-Agent': 'git-buddy-app' } }
    )

    if (!response.ok) return null

    const data = (await response.json()) as { tag_name: string; html_url: string }
    const version = data.tag_name.replace(/^v/, '')
    const releaseUrl = data.html_url

    saveUpdateSettings(Date.now(), snoozedVersion)

    const currentVersion = app.getVersion()

    if (!semverIsNewer(version, currentVersion)) return null
    if (version === snoozedVersion) return null

    return { version, releaseUrl }
  } catch {
    return null
  }
}
