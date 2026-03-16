<script setup lang="ts">
import { useProjectStore } from '../stores/project'
import TimelineEntry from './TimelineEntry.vue'

const store = useProjectStore()
</script>

<template>
  <div class="timeline-panel">
    <h2 class="panel-title">⏪ Go Back in Time</h2>
    <p class="panel-desc">Click any snapshot to go back to that moment.</p>

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
