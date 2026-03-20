/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  relativeDate: string
}

interface GitStatus {
  modifiedCount: number
  files: string[]
}

interface UpdateInfo {
  version: string
  releaseUrl: string
}

interface WorktreeInfo {
  path: string
  branch: string
  modifiedFiles: string[]
  commitsAhead: number
}

interface GitBuddyApi {
  selectFolder(): Promise<string | null>
  checkRepo(path: string): Promise<boolean>
  initRepo(path: string): Promise<void>
  getStatus(path: string): Promise<GitStatus>
  getLog(path: string, limit?: number): Promise<CommitInfo[]>
  saveSnapshot(path: string, message: string): Promise<{ pushed: boolean }>
  goBackTo(path: string, targetSha: string): Promise<void>
  checkGitInstalled(): Promise<{ installed: boolean; version?: string }>
  getRemoteUrl(path: string): Promise<string | null>
  getLastProject(): Promise<string | null>
  saveLastProject(path: string | null): Promise<void>
  checkForUpdate(): Promise<UpdateInfo | null>
  snoozeUpdate(version: string): Promise<void>
  openRelease(url: string): Promise<void>
  getWorktrees(path: string): Promise<WorktreeInfo[]>
  saveWorktreeToMain(path: string, worktree: WorktreeInfo, message?: string): Promise<{ pushed: boolean }>
  discardWorktree(path: string, worktreePath: string): Promise<void>
}

interface Window {
  gitBuddy: GitBuddyApi
}
