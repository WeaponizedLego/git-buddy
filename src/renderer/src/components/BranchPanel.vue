<script setup lang="ts">
defineProps<{
  branches: string[]
  currentBranch: string
  isLoading: boolean
}>()

const emit = defineEmits<{
  switch: [branch: string]
  merge: []
  close: []
}>()
</script>

<template>
  <div class="branch-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-label">Advanced Mode — Branch Browser</span>
      </div>
      <button class="btn-close" @click="emit('close')">Close</button>
    </div>

    <div class="panel-body">
      <div class="branches-label">Branches</div>
      <ul class="branches-list">
        <li
          v-for="branch in branches"
          :key="branch"
          class="branch-item"
          :class="{ current: branch === currentBranch }"
          @click="!isLoading && branch !== currentBranch && emit('switch', branch)"
        >
          <span class="branch-indicator">{{ branch === currentBranch ? '▶' : ' ' }}</span>
          {{ branch }}
        </li>
      </ul>
    </div>

    <div v-if="currentBranch !== 'main'" class="panel-actions">
      <button
        class="btn-merge"
        :disabled="isLoading"
        @click="emit('merge')"
      >
        Merge <code>{{ currentBranch }}</code> into main →
      </button>
    </div>
  </div>
</template>

<style scoped>
.branch-panel {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.btn-close {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
}

.btn-close:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text);
}

.panel-body {
  margin-bottom: 10px;
}

.branches-label {
  font-size: 11px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.branches-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.branch-item {
  font-size: 12px;
  font-family: monospace;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.branch-item:not(.current):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.branch-item.current {
  border-color: #b8860b;
  color: #f0c040;
  background: #2a1f00;
  cursor: default;
}

.branch-indicator {
  font-size: 10px;
  width: 10px;
  display: inline-block;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-merge {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 4px;
  border: none;
  background: var(--color-primary);
  color: #000;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}

.btn-merge code {
  font-family: monospace;
  font-size: 11px;
}

.btn-merge:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn-merge:not(:disabled):hover {
  filter: brightness(1.1);
}
</style>
