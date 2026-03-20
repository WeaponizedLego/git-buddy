<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { WorktreeInfo } from '../stores/project'

const props = defineProps<{
  worktrees: WorktreeInfo[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  save: [worktree: WorktreeInfo, message?: string]
  discard: [worktree: WorktreeInfo]
}>()

const currentIndex = ref(0)
const snapshotMessage = ref('')

// Clamp index if the list shrinks externally (e.g. background refresh)
watch(() => props.worktrees.length, (newLen) => {
  if (currentIndex.value >= newLen) {
    currentIndex.value = Math.max(0, newLen - 1)
    snapshotMessage.value = ''
  }
})

const currentWorktree = computed(() => props.worktrees[currentIndex.value])

const canSave = computed(() => {
  if (!currentWorktree.value || props.isLoading) return false
  if (currentWorktree.value.modifiedFiles.length > 0) {
    return snapshotMessage.value.trim().length > 0
  }
  return true
})

function prev(): void {
  if (currentIndex.value > 0) currentIndex.value--
  snapshotMessage.value = ''
}

function next(): void {
  if (currentIndex.value < props.worktrees.length - 1) currentIndex.value++
  snapshotMessage.value = ''
}

function handleSave(): void {
  if (!canSave.value) return
  const msg = currentWorktree.value.modifiedFiles.length > 0 ? snapshotMessage.value.trim() : undefined
  emit('save', currentWorktree.value, msg)
  snapshotMessage.value = ''
}

function handleDiscard(): void {
  if (props.isLoading) return
  emit('discard', currentWorktree.value)
  snapshotMessage.value = ''
}
</script>

<template>
  <div v-if="currentWorktree" class="worktree-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="panel-icon">🤖</span>
        <span class="panel-label">AI Workspace</span>
        <span v-if="worktrees.length > 1" class="panel-count">{{ currentIndex + 1 }} of {{ worktrees.length }}</span>
      </div>
      <div v-if="worktrees.length > 1" class="panel-nav">
        <button class="nav-btn" :disabled="currentIndex === 0" @click="prev">←</button>
        <button class="nav-btn" :disabled="currentIndex === worktrees.length - 1" @click="next">→</button>
      </div>
    </div>

    <div class="panel-branch">Branch: {{ currentWorktree.branch }}</div>

    <div class="panel-body">
      <div v-if="currentWorktree.modifiedFiles.length > 0" class="files-section">
        <div class="files-label">Changed files:</div>
        <ul class="files-list">
          <li v-for="file in currentWorktree.modifiedFiles" :key="file" class="file-item">
            {{ file }}
          </li>
        </ul>
      </div>

      <div v-if="currentWorktree.commitsAhead > 0" class="commits-ahead">
        {{ currentWorktree.commitsAhead }} saved {{ currentWorktree.commitsAhead === 1 ? 'change' : 'changes' }} not yet on main
      </div>

      <div v-if="currentWorktree.modifiedFiles.length > 0" class="snapshot-input">
        <input
          v-model="snapshotMessage"
          type="text"
          class="snapshot-field"
          placeholder="Describe these changes before saving..."
        />
      </div>
    </div>

    <div class="panel-actions">
      <button class="btn-discard" :disabled="isLoading" @click="handleDiscard">Discard</button>
      <button class="btn-save" :disabled="!canSave" @click="handleSave">Save to Main →</button>
    </div>
  </div>
</template>

<style scoped>
.worktree-panel {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 24px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-icon {
  font-size: 16px;
}

.panel-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.panel-count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.panel-nav {
  display: flex;
  gap: 4px;
}

.nav-btn {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-family: inherit;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.nav-btn:not(:disabled):hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.panel-branch {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
  font-family: monospace;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.files-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.files-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.file-item {
  font-size: 11px;
  font-family: monospace;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 1px 6px;
}

.file-item::before {
  content: '• ';
  color: var(--color-primary);
}

.commits-ahead {
  font-size: 12px;
  color: var(--color-text-muted);
}

.snapshot-input {
  margin-top: 4px;
}

.snapshot-field {
  width: 100%;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

.snapshot-field:focus {
  outline: none;
  border-color: var(--color-primary);
}

.panel-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.btn-discard {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
}

.btn-discard:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn-discard:not(:disabled):hover {
  border-color: #e55;
  color: #e55;
}

.btn-save {
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

.btn-save:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn-save:not(:disabled):hover {
  filter: brightness(1.1);
}
</style>
