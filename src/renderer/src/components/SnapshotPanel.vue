<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/project'
import { usePolling } from '../composables/usePolling'

const store = useProjectStore()
const message = ref('')
const justSaved = ref(false)

usePolling()

async function save(): Promise<void> {
  if (!message.value.trim() || store.isLoading) return

  try {
    await store.saveSnapshot(message.value.trim())
    message.value = ''
    justSaved.value = true
    setTimeout(() => { justSaved.value = false }, 2500)
  } catch {
    // Error is handled by the store
  }
}
</script>

<template>
  <div class="snapshot-panel">
    <div class="card snapshot-card">
      <h2 class="panel-title">💾 Save a Snapshot</h2>
      <p class="panel-desc">Write a short note about what you changed, then click save!</p>

      <div class="input-group">
        <input
          v-model="message"
          type="text"
          class="message-input"
          placeholder="e.g., Added the login button"
          maxlength="100"
          @keyup.enter="save"
          :disabled="store.isLoading"
        />
        <span class="char-count">{{ message.length }}/100</span>
      </div>

      <button
        class="btn btn-primary btn-save"
        :disabled="!message.trim() || store.isLoading"
        @click="save"
      >
        <span v-if="store.isLoading" class="spinner"></span>
        <span v-else-if="justSaved">✅ Saved!</span>
        <span v-else>💾 Save Snapshot</span>
      </button>

      <!-- Success feedback -->
      <transition name="fade">
        <div v-if="justSaved" class="success-msg">
          Snapshot saved! Your work is safe. <img src="../assets/logo.png" class="logo-inline" alt="" />
        </div>
      </transition>
    </div>

    <!-- Change status card -->
    <div class="card status-card" v-if="store.hasChanges">
      <div class="status-header">
        <span class="status-dot dot-changed"></span>
        <span>{{ store.status.modifiedCount }} unsaved change{{ store.status.modifiedCount !== 1 ? 's' : '' }}</span>
      </div>
      <ul class="file-list">
        <li v-for="file in store.status.files.slice(0, 8)" :key="file">
          {{ file }}
        </li>
        <li v-if="store.status.files.length > 8" class="more-files">
          ...and {{ store.status.files.length - 8 }} more
        </li>
      </ul>
    </div>

    <!-- Project info -->
    <div class="card project-card">
      <div class="project-path" :title="store.projectPath ?? ''">
        📁 {{ store.projectPath }}
      </div>
      <div class="project-meta">
        <span v-if="store.hasRemote" class="badge badge-online">☁️ Online backup</span>
        <span v-else class="badge badge-local">💻 Local only</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="store.closeProject()">
        Switch Project
      </button>
    </div>
  </div>
</template>

<style scoped>
.snapshot-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title {
  font-size: 20px;
  margin-bottom: 4px;
}

.panel-desc {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.input-group {
  position: relative;
  margin-bottom: 16px;
}

.message-input {
  width: 100%;
  padding: 14px 16px;
  padding-right: 60px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: var(--color-primary);
}

.message-input::placeholder {
  color: var(--color-text-muted);
}

.char-count {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted);
}

.btn-save {
  width: 100%;
  padding: 16px;
  font-size: 17px;
  border-radius: var(--radius-lg);
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-msg {
  text-align: center;
  color: var(--color-success);
  font-weight: 600;
  padding: 12px;
  background: var(--color-success-bg);
  border-radius: var(--radius-sm);
  margin-top: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.status-card {
  padding: 16px;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot-changed {
  background: var(--color-primary);
}

.file-list {
  list-style: none;
  font-size: 13px;
  color: var(--color-text-muted);
}

.file-list li {
  padding: 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-files {
  font-style: italic;
}

.project-card {
  padding: 16px;
}

.project-path {
  font-size: 13px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.project-meta {
  margin-bottom: 12px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
}

.badge-online {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.badge-local {
  background: var(--color-surface-highlight);
  color: var(--color-primary);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.logo-inline {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  vertical-align: middle;
  margin-left: 2px;
}
</style>
