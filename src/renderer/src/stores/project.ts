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

export const useProjectStore = defineStore('project', () => {
  const projectPath = ref<string | null>(null)
  const isRepo = ref(false)
  const hasRemote = ref(false)
  const status = ref<GitStatus>({ modifiedCount: 0, files: [] })
  const commits = ref<CommitInfo[]>([])
  const isLoading = ref(false)
  const error = ref<{ message: string; hint?: string } | null>(null)

  const hasChanges = computed(() => status.value.modifiedCount > 0)

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
      const [statusResult, logResult, remoteResult] = await Promise.all([
        window.gitBuddy.getStatus(projectPath.value),
        window.gitBuddy.getLog(projectPath.value),
        window.gitBuddy.getRemoteUrl(projectPath.value)
      ])
      status.value = statusResult
      commits.value = logResult
      hasRemote.value = remoteResult !== null
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
    selectFolder,
    initializeRepo,
    loadLastProject,
    refresh,
    saveSnapshot,
    goBackTo,
    showError,
    clearError,
    closeProject
  }
})
