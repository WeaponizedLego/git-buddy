<script setup lang="ts">
import { useProjectStore } from '../stores/project'
import TimelineEntry from './TimelineEntry.vue'

const store = useProjectStore()
</script>

<template>
  <div class="timeline-panel">
    <h2 class="panel-title">⏪ Go Back in Time</h2>
    <p class="panel-desc">Click any snapshot to go back to that moment.</p>

    <div v-if="store.remoteAhead > 0" class="remote-banner">
      <div class="remote-banner-icon">🔔</div>
      <div class="remote-banner-body">
        <div class="remote-banner-message">
          {{ store.remoteAhead === 1 ? '1 new change online' : `${store.remoteAhead} new changes online` }}
        </div>
        <div class="remote-banner-hint">Someone pushed to main.</div>
      </div>
      <button
        class="remote-banner-action"
        :disabled="store.isPulling"
        @click="store.pullFromRemote()"
      >
        {{ store.isPulling ? 'Pulling…' : 'Pull now' }}
      </button>
    </div>

    <div v-if="store.commits.length === 0" class="empty-state">
      <div class="empty-icon">📷</div>
      <p>No snapshots yet! Save your first one.</p>
    </div>

    <div v-else class="timeline">
      <div class="timeline-line"></div>
      <TimelineEntry
        v-for="(commit, index) in store.commits"
        :key="commit.sha"
        :commit="commit"
        :is-latest="index === 0"
        :is-loading="store.isLoading"
        @go-back="store.goBackTo(commit.sha)"
      />
    </div>
  </div>
</template>

<style scoped>
.timeline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  min-height: 0;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.timeline {
  position: relative;
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.remote-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--color-surface);
  border: 2px solid var(--color-accent, #3b82f6);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.remote-banner-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.remote-banner-body {
  flex: 1;
  min-width: 0;
}

.remote-banner-message {
  font-weight: 600;
  font-size: 14px;
}

.remote-banner-hint {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.remote-banner-action {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-surface);
  background: var(--color-accent, #3b82f6);
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}

.remote-banner-action:disabled {
  opacity: 0.6;
  cursor: default;
}

.timeline-line {
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-border);
  border-radius: 2px;
}
</style>
