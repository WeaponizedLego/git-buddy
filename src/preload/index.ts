import { contextBridge, ipcRenderer } from 'electron'

export interface UpdateInfo {
  version: string
  releaseUrl: string
}

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  relativeDate: string
}

export interface GitStatus {
  modifiedCount: number
  files: string[]
}

export interface WorktreeInfo {
  path: string
  branch: string
  modifiedFiles: string[]
  commitsAhead: number
}

const api = {
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('git:select-folder'),

  checkRepo: (path: string): Promise<boolean> =>
    ipcRenderer.invoke('git:check-repo', path),

  initRepo: (path: string): Promise<void> =>
    ipcRenderer.invoke('git:init-repo', path),

  getStatus: (path: string): Promise<GitStatus> =>
    ipcRenderer.invoke('git:status', path),

  getLog: (path: string, limit?: number): Promise<CommitInfo[]> =>
    ipcRenderer.invoke('git:log', path, limit),

  saveSnapshot: (path: string, message: string): Promise<{ pushed: boolean }> =>
    ipcRenderer.invoke('git:save-snapshot', path, message),

  goBackTo: (path: string, targetSha: string): Promise<void> =>
    ipcRenderer.invoke('git:go-back', path, targetSha),

  checkGitInstalled: (): Promise<{ installed: boolean; version?: string }> =>
    ipcRenderer.invoke('git:check-installed'),

  getRemoteUrl: (path: string): Promise<string | null> =>
    ipcRenderer.invoke('git:remote-url', path),

  getLastProject: (): Promise<string | null> =>
    ipcRenderer.invoke('settings:get-last-project'),

  saveLastProject: (path: string | null): Promise<void> =>
    ipcRenderer.invoke('settings:save-last-project', path),

  checkForUpdate: (): Promise<UpdateInfo | null> =>
    ipcRenderer.invoke('app:check-update'),

  snoozeUpdate: (version: string): Promise<void> =>
    ipcRenderer.invoke('app:snooze-update', version),

  openRelease: (url: string): Promise<void> =>
    ipcRenderer.invoke('app:open-release', url),

  getWorktrees: (path: string): Promise<WorktreeInfo[]> =>
    ipcRenderer.invoke('git:worktrees', path),

  saveWorktreeToMain: (path: string, worktree: WorktreeInfo, message?: string): Promise<{ pushed: boolean }> =>
    ipcRenderer.invoke('git:worktree-save', path, worktree, message),

  discardWorktree: (path: string, worktreePath: string): Promise<void> =>
    ipcRenderer.invoke('git:worktree-discard', path, worktreePath),

  getCurrentBranch: (path: string): Promise<string> =>
    ipcRenderer.invoke('git:current-branch', path),

  listBranches: (path: string): Promise<string[]> =>
    ipcRenderer.invoke('git:list-branches', path),

  switchBranch: (path: string, branch: string): Promise<void> =>
    ipcRenderer.invoke('git:switch-branch', path, branch),

  mergeBranchToMain: (path: string, sourceBranch: string): Promise<{ pushed: boolean }> =>
    ipcRenderer.invoke('git:merge-to-main', path, sourceBranch)
}

contextBridge.exposeInMainWorld('gitBuddy', api)
