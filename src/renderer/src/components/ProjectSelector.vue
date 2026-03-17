<script setup lang="ts">
import { useProjectStore } from '../stores/project'

const store = useProjectStore()

async function pickFolder(): Promise<void> {
  await store.selectFolder()
}
</script>

<template>
  <div class="project-selector">
    <div class="hero">
      <div class="hero-icon">🐣</div>
      <h2>Welcome to Git Buddy!</h2>
      <p>Pick a project folder to get started. I'll help you save and manage your work!</p>

      <button class="btn btn-primary btn-large" @click="pickFolder">
        📁 Pick Your Project Folder
      </button>
    </div>

    <!-- Setup prompt if folder selected but not tracking yet -->
    <div v-if="store.projectPath && !store.isRepo" class="init-prompt card">
      <div class="init-icon">🌱</div>
      <h3>Ready to start tracking?</h3>
      <p>
        <strong>{{ store.projectPath }}</strong> isn't set up for saving snapshots yet.
        I'll get everything ready so you can start saving your work!
      </p>
      <div class="init-actions">
        <button class="btn btn-primary" @click="store.initializeRepo()">
          Let's go!
        </button>
        <button class="btn btn-secondary" @click="store.closeProject()">
          Pick a different folder
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px 20px;
  min-height: 400px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.hero-icon {
  font-size: 72px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.hero h2 {
  font-size: 24px;
  color: var(--color-text);
}

.hero p {
  color: var(--color-text-muted);
  max-width: 380px;
  font-size: 15px;
}

.btn-large {
  padding: 16px 32px;
  font-size: 17px;
  border-radius: var(--radius-lg);
  margin-top: 8px;
}

.init-prompt {
  text-align: center;
  max-width: 480px;
}

.init-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.init-prompt h3 {
  margin-bottom: 8px;
}

.init-prompt p {
  color: var(--color-text-muted);
  font-size: 14px;
  margin-bottom: 16px;
  word-break: break-all;
}

.init-prompt strong {
  color: var(--color-text);
}

.init-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
