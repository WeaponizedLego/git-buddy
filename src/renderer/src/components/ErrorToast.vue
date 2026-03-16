<script setup lang="ts">
import { watch } from 'vue'
import { useProjectStore } from '../stores/project'

const store = useProjectStore()

// Auto-dismiss after 6 seconds
watch(
  () => store.error,
  (newError) => {
    if (newError) {
      setTimeout(() => {
        store.clearError()
      }, 6000)
    }
  }
)
</script>

<template>
  <transition name="toast">
    <div v-if="store.error" class="error-toast" @click="store.clearError()">
      <div class="toast-icon">😅</div>
      <div class="toast-body">
        <div class="toast-message">{{ store.error.message }}</div>
        <div v-if="store.error.hint" class="toast-hint">{{ store.error.hint }}</div>
      </div>
      <button class="toast-close" @click.stop="store.clearError()">✕</button>
    </div>
  </transition>
</template>

<style scoped>
.error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-surface);
  border: 2px solid var(--color-danger);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-width: 480px;
  cursor: pointer;
  z-index: 1000;
}

.toast-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.toast-body {
  flex: 1;
}

.toast-message {
  font-weight: 600;
  font-size: 14px;
}

.toast-hint {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.toast-close {
  background: none;
  font-size: 16px;
  color: var(--color-text-muted);
  padding: 4px;
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--color-text);
}

.toast-enter-active {
  transition: all 0.3s ease;
}

.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
