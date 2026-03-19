<script setup lang="ts">
import { ref } from 'vue'

interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  relativeDate: string
}

defineProps<{
  commit: CommitInfo
  isLatest: boolean
  isLoading: boolean
}>()

const emit = defineEmits<{
  goBack: []
}>()

const showConfirm = ref(false)

function handleGoBack(): void {
  showConfirm.value = false
  emit('goBack')
}
</script>

<template>
  <div class="entry" :class="{ 'entry-latest': isLatest }">
    <div class="entry-dot" :class="{ 'dot-latest': isLatest }">
      <img v-if="isLatest" src="../assets/logo.png" class="dot-logo" alt="" />
      <span v-else>📸</span>
    </div>

    <div class="entry-content card">
      <div class="entry-header">
        <span class="entry-message">{{ commit.message }}</span>
        <span class="entry-time" :title="commit.date">{{ commit.relativeDate }}</span>
      </div>

      <div class="entry-footer">
        <span class="entry-sha">{{ commit.shortSha }}</span>

        <div v-if="isLatest" class="current-badge">
          You are here ✨
        </div>

        <template v-else>
          <button
            v-if="!showConfirm"
            class="btn btn-secondary btn-xs"
            @click="showConfirm = true"
            :disabled="isLoading"
          >
            ⏪ Go back to here
          </button>

          <div v-else class="confirm-group">
            <span class="confirm-text">Are you sure?</span>
            <button
              class="btn btn-primary btn-xs"
              @click="handleGoBack"
              :disabled="isLoading"
            >
              Yes, go back!
            </button>
            <button
              class="btn btn-secondary btn-xs"
              @click="showConfirm = false"
            >
              Cancel
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entry {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 8px 0;
  padding-left: 0;
}

.entry-dot {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: var(--color-surface);
  border-radius: 50%;
  z-index: 1;
  border: 3px solid var(--color-border);
}

.dot-latest {
  border-color: var(--color-primary);
  font-size: 18px;
}

.dot-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.entry-content {
  flex: 1;
  padding: 14px 16px;
}

.entry-latest .entry-content {
  border: 2px solid var(--color-primary);
  background: var(--color-surface-highlight);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.entry-message {
  font-weight: 600;
  font-size: 14px;
  word-break: break-word;
}

.entry-time {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.entry-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.entry-sha {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: monospace;
  background: var(--color-bg);
  padding: 2px 6px;
  border-radius: 4px;
}

.current-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-hover);
}

.btn-xs {
  padding: 6px 12px;
  font-size: 12px;
}

.confirm-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirm-text {
  font-size: 12px;
  color: var(--color-text-muted);
}
</style>
