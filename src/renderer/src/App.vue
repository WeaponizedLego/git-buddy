<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProjectStore } from './stores/project'
import ProjectSelector from './components/ProjectSelector.vue'
import SnapshotPanel from './components/SnapshotPanel.vue'
import Timeline from './components/Timeline.vue'
import StatusIndicator from './components/StatusIndicator.vue'
import ErrorToast from './components/ErrorToast.vue'
import UpdateBanner from './components/UpdateBanner.vue'
import WorktreePanel from './components/WorktreePanel.vue'
import BranchBanner from './components/BranchBanner.vue'
import BranchPanel from './components/BranchPanel.vue'

const store = useProjectStore()
const updateInfo = ref<UpdateInfo | null>(null)

onMounted(async () => {
  await store.loadLastProject()
  updateInfo.value = await window.gitBuddy.checkForUpdate()
})

async function handleSnooze(): Promise<void> {
  if (updateInfo.value) {
    await window.gitBuddy.snoozeUpdate(updateInfo.value.version)
    updateInfo.value = null
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="logo">
        <img src="./assets/logo.png" class="logo-icon" alt="Git Buddy" />
        <h1>Git Buddy</h1>
      </div>
      <StatusIndicator v-if="store.projectPath" />
    </header>

    <UpdateBanner
      v-if="updateInfo"
      :version="updateInfo.version"
      :release-url="updateInfo.releaseUrl"
      @snooze="handleSnooze"
    />

    <BranchBanner
      v-if="store.isRepo && !store.isOnMainBranch"
      :branch="store.currentBranch"
      :is-advanced="store.isAdvancedMode"
      @toggle="store.toggleAdvancedMode()"
    />

    <BranchPanel
      v-if="store.isAdvancedMode"
      :branches="store.branches"
      :current-branch="store.currentBranch"
      :is-loading="store.isLoading"
      @switch="(b) => store.switchBranch(b)"
      @merge="store.mergeBranchToMain()"
      @close="store.toggleAdvancedMode()"
    />

    <WorktreePanel
      v-if="store.linkedWorktrees.length > 0 && store.isRepo"
      :worktrees="store.linkedWorktrees"
      :is-loading="store.isLoading"
      @save="(wt, msg) => store.saveWorktreeToMain(wt, msg)"
      @discard="(wt) => store.discardWorktree(wt.path)"
    />

    <main class="app-main">
      <!-- No project selected, or folder not yet set up -->
      <ProjectSelector v-if="!store.projectPath || !store.isRepo" />

      <!-- Main workspace -->
      <div v-else class="workspace">
        <div class="workspace-left">
          <SnapshotPanel />
        </div>
        <div class="workspace-right">
          <Timeline />
        </div>
      </div>
    </main>

    <ErrorToast />
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--color-surface);
  box-shadow: var(--shadow);
  -webkit-app-region: drag;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.logo h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.app-main {
  flex: 1;
  padding: 24px;
  overflow: hidden;
  min-height: 0;
}

.workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.workspace-left {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.workspace-right {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
</style>
