import { ipcMain, dialog, shell } from 'electron'
import { isGitInstalled } from './git/detector'
import {
  checkIsRepo,
  initRepo,
  getStatus,
  getLog,
  getRemoteUrl,
  saveSnapshot,
  goBackTo,
  getLinkedWorktrees,
  saveWorktreeToMain,
  discardWorktree,
  getCurrentBranch,
  listBranches,
  switchBranch,
  mergeBranchToMain,
  WorktreeInfo
} from './git/commands'
import { toFriendlyError, AppError } from './utils/errors'
import { getLastProjectPath, saveLastProjectPath, saveUpdateSettings, getUpdateSettings } from './settings'
import { checkForUpdate } from './updater'

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

  ipcMain.handle('git:worktrees', wrapHandler(async (_event, path: string) => {
    return await getLinkedWorktrees(path)
  }))

  ipcMain.handle('git:worktree-save', wrapHandler(async (_event, path: string, worktree: WorktreeInfo, message?: string) => {
    return await saveWorktreeToMain(path, worktree, message)
  }))

  ipcMain.handle('git:worktree-discard', wrapHandler(async (_event, path: string, worktreePath: string) => {
    await discardWorktree(path, worktreePath)
  }))

  ipcMain.handle('git:current-branch', wrapHandler(async (_event, path: string) => {
    return await getCurrentBranch(path)
  }))

  ipcMain.handle('git:list-branches', wrapHandler(async (_event, path: string) => {
    return await listBranches(path)
  }))

  ipcMain.handle('git:switch-branch', wrapHandler(async (_event, path: string, branch: string) => {
    await switchBranch(path, branch)
  }))

  ipcMain.handle('git:merge-to-main', wrapHandler(async (_event, path: string, sourceBranch: string) => {
    return await mergeBranchToMain(path, sourceBranch)
  }))

  ipcMain.handle('settings:get-last-project', () => {
    return getLastProjectPath()
  })

  ipcMain.handle('settings:save-last-project', (_event, path: string | null) => {
    saveLastProjectPath(path)
  })

  ipcMain.handle('app:check-update', async () => {
    return await checkForUpdate()
  })

  ipcMain.handle('app:snooze-update', (_event, version: string) => {
    const { lastUpdateCheck } = getUpdateSettings()
    saveUpdateSettings(lastUpdateCheck, version)
  })

  ipcMain.handle('app:open-release', (_event, url: string) => {
    shell.openExternal(url)
  })
}
