<script setup lang="ts">
defineProps<{
  version: string
  releaseUrl: string
}>()

const emit = defineEmits<{
  snooze: []
}>()
</script>

<template>
  <div class="update-banner">
    <span class="update-text">✨ Git Buddy {{ version }} is available!</span>
    <div class="update-actions">
      <button class="btn-view" @click="window.gitBuddy.openRelease(releaseUrl)">View Release</button>
      <button class="btn-snooze" @click="emit('snooze')">Skip This Version</button>
    </div>
  </div>
</template>

<style scoped>
.update-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: var(--color-surface-highlight);
  border-bottom: 1px solid var(--color-primary);
  gap: 12px;
}

.update-text {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

.update-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-view {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font-family: inherit;
}

.btn-view:hover {
  background: var(--color-primary);
  color: #000;
}

.btn-snooze {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
}

.btn-snooze:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}
</style>
