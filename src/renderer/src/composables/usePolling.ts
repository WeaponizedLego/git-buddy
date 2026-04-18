import { onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '../stores/project'

export function usePolling(intervalMs = 3000, remoteIntervalMs = 30000): void {
  const store = useProjectStore()
  let timer: ReturnType<typeof setInterval> | null = null
  let remoteTimer: ReturnType<typeof setInterval> | null = null

  function start(): void {
    if (!timer) {
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && store.projectPath) {
          store.refresh()
        }
      }, intervalMs)
    }
    if (!remoteTimer) {
      remoteTimer = setInterval(() => {
        if (document.visibilityState === 'visible' && store.projectPath) {
          store.checkRemote()
        }
      }, remoteIntervalMs)
    }
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (remoteTimer) {
      clearInterval(remoteTimer)
      remoteTimer = null
    }
  }

  onMounted(() => {
    start()
    // Kick off an immediate remote check so users don't wait 30s on first load
    if (document.visibilityState === 'visible' && store.projectPath) {
      store.checkRemote()
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && store.projectPath) {
        store.refresh()
        store.checkRemote()
      }
    })
  })

  onUnmounted(() => {
    stop()
  })
}
