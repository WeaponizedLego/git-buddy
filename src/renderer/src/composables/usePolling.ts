import { onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '../stores/project'

export function usePolling(intervalMs = 3000): void {
  const store = useProjectStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function start(): void {
    if (timer) return
    timer = setInterval(() => {
      if (document.visibilityState === 'visible' && store.projectPath) {
        store.refresh()
      }
    }, intervalMs)
  }

  function stop(): void {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    start()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && store.projectPath) {
        store.refresh()
      }
    })
  })

  onUnmounted(() => {
    stop()
  })
}
