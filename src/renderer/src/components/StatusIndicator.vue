<script setup lang="ts">
import { useProjectStore } from '../stores/project'

const store = useProjectStore()
</script>

<template>
  <div class="status-indicator" :class="{ 'has-changes': store.hasChanges }">
    <template v-if="store.hasChanges">
      <span class="status-dot dot-unsaved"></span>
      {{ store.status.modifiedCount }} unsaved change{{ store.status.modifiedCount !== 1 ? 's' : '' }} 👀
    </template>
    <template v-else>
      <span class="status-dot dot-saved"></span>
      All saved! <img src="../assets/logo.png" class="logo-inline" alt="" />
    </template>
  </div>
</template>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  font-size: 13px;
  font-weight: 600;
  background: var(--color-success-bg);
  color: var(--color-success);
  -webkit-app-region: no-drag;
}

.has-changes {
  background: var(--color-surface-highlight);
  color: var(--color-primary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-saved {
  background: var(--color-success);
}

.logo-inline {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  vertical-align: middle;
  margin-left: 2px;
}

.dot-unsaved {
  background: var(--color-primary);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
