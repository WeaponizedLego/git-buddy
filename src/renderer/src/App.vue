<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProjectStore } from './stores/project'
import ProjectSelector from './components/ProjectSelector.vue'
import SnapshotPanel from './components/SnapshotPanel.vue'
import Timeline from './components/Timeline.vue'
import StatusIndicator from './components/StatusIndicator.vue'
import ErrorToast from './components/ErrorToast.vue'

const store = useProjectStore()
const gitInstalled = ref(true)
const gitVersion = ref('')

onMounted(async () => {
  const result = await window.gitBuddy.checkGitInstalled()
  gitInstalled.value = result.installed
  gitVersion.value = result.version ?? ''

  if (result.installed) {
    await store.loadLastProject()
  }
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="logo">
        <span class="logo-icon">🐣</span>
        <h1>Git Buddy</h1>
      </div>
      <StatusIndicator v-if="store.projectPath" />
    </header>

    <main class="app-main">
      <!-- Git not installed -->
      <div v-if="!gitInstalled" class="no-git">
        <div class="no-git-icon">😢</div>
        <h2>Git isn't installed yet!</h2>
        <p>Git Buddy needs Git to work. Don't worry, it's easy to install!</p>
        <a
          href="https://git-scm.com/downloads"
          target="_blank"
          class="btn btn-primary"
        >
          Download Git ↗
        </a>
      </div>

      <!-- No project selected, or folder not yet set up -->
      <ProjectSelector v-else-if="!store.projectPath || !store.isRepo" />

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
  font-size: 28px;
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

.no-git {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  text-align: center;
}

.no-git-icon {
  font-size: 64px;
}

.no-git h2 {
  color: var(--color-text);
  margin: 0;
}

.no-git p {
  color: var(--color-text-muted);
  max-width: 360px;
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
