import { ipcMain, dialog } from 'electron'
import { isGitInstalled } from './git/detector'
import {
  checkIsRepo,
  initRepo,
  getStatus,
  getLog,
  getRemoteUrl,
  saveSnapshot,
  goBackTo
} from './git/commands'
import { toFriendlyError, AppError } from './utils/errors'

function wrapHandler<T>(
  fn: (...args: unknown[]) => Promise<T>
): (...args: unknown[]) => Promise<T> {
  return async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (err) {
      const appErr = toFriendlyError(err)
      throw { friendlyMessage: appErr.friendlyMessage, recoveryHint: appErr.recoveryHint }
    }
  }
}

export function registerIpcHandlers(): void {
  ipcMain.handle('git:check-installed', wrapHandler(async () => {
    return await isGitInstalled()
  }))

  ipcMain.handle('git:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Pick Your Project Folder'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('git:check-repo', wrapHandler(async (_event, path: string) => {
    return await checkIsRepo(path)
  }))

  ipcMain.handle('git:init-repo', wrapHandler(async (_event, path: string) => {
    await initRepo(path)
  }))

  ipcMain.handle('git:status', wrapHandler(async (_event, path: string) => {
    return await getStatus(path)
  }))

  ipcMain.handle('git:log', wrapHandler(async (_event, path: string, limit?: number) => {
    return await getLog(path, limit)
  }))

  ipcMain.handle('git:remote-url', wrapHandler(async (_event, path: string) => {
    return await getRemoteUrl(path)
  }))

  ipcMain.handle('git:save-snapshot', wrapHandler(async (_event, path: string, message: string) => {
    if (!path || typeof path !== 'string') {
      throw new AppError('No project selected!', 'Invalid path argument')
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Write a short note about what you changed!', 'Empty commit message')
    }
    return await saveSnapshot(path, message.trim())
  }))

  ipcMain.handle('git:go-back', wrapHandler(async (_event, path: string, targetSha: string) => {
    if (!path || typeof path !== 'string') {
      throw new AppError('No project selected!', 'Invalid path argument')
    }
    if (!targetSha || typeof targetSha !== 'string') {
      throw new AppError('Pick a snapshot to go back to!', 'Invalid target SHA')
    }
    await goBackTo(path, targetSha)
  }))
}
