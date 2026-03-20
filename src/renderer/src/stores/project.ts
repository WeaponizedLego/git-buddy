import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

export const useProjectStore = defineStore('project', () => {
  const projectPath = ref<string | null>(null)
  const isRepo = ref(false)
  const hasRemote = ref(false)
  const status = ref<GitStatus>({ modifiedCount: 0, files: [] })
  const commits = ref<CommitInfo[]>([])
  const isLoading = ref(false)
  const error = ref<{ message: string; hint?: string } | null>(null)
  const linkedWorktrees = ref<WorktreeInfo[]>([])

  const currentBranch = ref<string>('main')
  const branches = ref<string[]>([])
  const isAdvancedMode = ref(false)

  const hasChanges = computed(() => status.value.modifiedCount > 0)
  const isOnMainBranch = computed(() => currentBranch.value === 'main')

  async function selectFolder(): Promise<void> {
    const path = await window.gitBuddy.selectFolder()
    if (!path) return

    projectPath.value = path
    await window.gitBuddy.saveLastProject(path)
    const repoCheck = await window.gitBuddy.checkRepo(path)
    isRepo.value = repoCheck

    if (repoCheck) {
      await refresh()
    }
  }

  async function initializeRepo(): Promise<void> {
    if (!projectPath.value) return
    await window.gitBuddy.initRepo(projectPath.value)
    isRepo.value = true
    await refresh()
  }

  async function refresh(): Promise<void> {
    if (!projectPath.value) return

    try {
      const [statusResult, logResult, remoteResult, worktrees, branch] = await Promise.all([
        window.gitBuddy.getStatus(projectPath.value),
        window.gitBuddy.getLog(projectPath.value),
        window.gitBuddy.getRemoteUrl(projectPath.value),
        window.gitBuddy.getWorktrees(projectPath.value),
        window.gitBuddy.getCurrentBranch(projectPath.value)
      ])
      status.value = statusResult
      commits.value = logResult
      hasRemote.value = remoteResult !== null
      linkedWorktrees.value = worktrees
      currentBranch.value = branch
      if (isAdvancedMode.value) {
        branches.value = await window.gitBuddy.listBranches(projectPath.value)
      }
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(
        e.friendlyMessage ?? 'Something went wrong refreshing.',
        e.recoveryHint
      )
    }
  }

  async function saveSnapshot(message: string): Promise<void> {
    if (!projectPath.value) return
    isLoading.value = true
    error.value = null

    try {
      const result = await window.gitBuddy.saveSnapshot(projectPath.value, message)
      await refresh()
      if (!result.pushed && hasRemote.value) {
        showError('Saved locally, but couldn\'t push online.', 'Check your internet connection.')
      }
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(
        e.friendlyMessage ?? 'Couldn\'t save the snapshot.',
        e.recoveryHint
      )
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function goBackTo(targetSha: string): Promise<void> {
    if (!projectPath.value) return
    isLoading.value = true
    error.value = null

    try {
      await window.gitBuddy.goBackTo(projectPath.value, targetSha)
      await refresh()
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(
        e.friendlyMessage ?? 'Couldn\'t go back in time.',
        e.recoveryHint
      )
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function saveWorktreeToMain(worktree: WorktreeInfo, message?: string): Promise<void> {
    if (!projectPath.value) return
    isLoading.value = true
    try {
      const result = await window.gitBuddy.saveWorktreeToMain(projectPath.value, worktree, message)
      await refresh()
      if (!result.pushed && hasRemote.value) {
        showError("Saved locally, but couldn't push online.", 'Check your internet connection.')
      }
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(e.friendlyMessage ?? "Couldn't save the AI workspace.", e.recoveryHint)
    } finally {
      isLoading.value = false
    }
  }

  async function discardWorktree(worktreePath: string): Promise<void> {
    if (!projectPath.value) return
    isLoading.value = true
    try {
      await window.gitBuddy.discardWorktree(projectPath.value, worktreePath)
      await refresh()
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(e.friendlyMessage ?? "Couldn't discard the AI workspace.", e.recoveryHint)
    } finally {
      isLoading.value = false
    }
  }

  async function toggleAdvancedMode(): Promise<void> {
    isAdvancedMode.value = !isAdvancedMode.value
    if (isAdvancedMode.value && projectPath.value) {
      branches.value = await window.gitBuddy.listBranches(projectPath.value)
    }
  }

  async function switchBranch(branch: string): Promise<void> {
    if (!projectPath.value) return
    isLoading.value = true
    try {
      await window.gitBuddy.switchBranch(projectPath.value, branch)
      await refresh()
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(e.friendlyMessage ?? "Couldn't switch branch.", e.recoveryHint)
    } finally {
      isLoading.value = false
    }
  }

  async function mergeBranchToMain(): Promise<void> {
    if (!projectPath.value) return
    isLoading.value = true
    try {
      const result = await window.gitBuddy.mergeBranchToMain(projectPath.value, currentBranch.value)
      isAdvancedMode.value = false
      await refresh()
      if (!result.pushed && hasRemote.value) {
        showError("Merged locally, but couldn't push online.", 'Check your internet connection.')
      }
    } catch (err: unknown) {
      const e = err as { friendlyMessage?: string; recoveryHint?: string }
      showError(e.friendlyMessage ?? "Couldn't merge branch.", e.recoveryHint)
    } finally {
      isLoading.value = false
    }
  }

  function showError(message: string, hint?: string): void {
    error.value = { message, hint }
  }

  function clearError(): void {
    error.value = null
  }

  async function loadLastProject(): Promise<void> {
    try {
      const lastPath = await window.gitBuddy.getLastProject()
      if (!lastPath) return

      projectPath.value = lastPath
      const repoCheck = await window.gitBuddy.checkRepo(lastPath)
      isRepo.value = repoCheck

      if (repoCheck) {
        await refresh()
      }
    } catch {
      // Silently fail — the folder may have been deleted or moved
    }
  }

  function closeProject(): void {
    projectPath.value = null
    isRepo.value = false
    hasRemote.value = false
    status.value = { modifiedCount: 0, files: [] }
    commits.value = []
    error.value = null
    linkedWorktrees.value = []
    currentBranch.value = 'main'
    branches.value = []
    isAdvancedMode.value = false
    window.gitBuddy.saveLastProject(null)
  }

  return {
    projectPath,
    isRepo,
    hasRemote,
    status,
    commits,
    isLoading,
    error,
    hasChanges,
    linkedWorktrees,
    currentBranch,
    branches,
    isAdvancedMode,
    isOnMainBranch,
    selectFolder,
    initializeRepo,
    loadLastProject,
    refresh,
    saveSnapshot,
    goBackTo,
    saveWorktreeToMain,
    discardWorktree,
    toggleAdvancedMode,
    switchBranch,
    mergeBranchToMain,
    showError,
    clearError,
    closeProject
  }
})
