<script setup lang="ts">
defineProps<{
  branch: string
  isAdvanced: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div class="branch-banner">
    <span class="branch-text">
      You're on branch <code class="branch-name">{{ branch }}</code> — not your main branch.
    </span>
    <button
      class="btn-advanced"
      :class="{ active: isAdvanced }"
      @click="emit('toggle')"
    >
      Advanced Mode
    </button>
  </div>
</template>

<style scoped>
.branch-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  background: #2a1f00;
  border-bottom: 1px solid #b8860b;
  gap: 12px;
}

.branch-text {
  font-size: 13px;
  color: #f0c040;
  font-weight: 500;
}

.branch-name {
  font-family: monospace;
  font-size: 12px;
  background: rgba(255, 200, 0, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
}

.btn-advanced {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid #b8860b;
  background: transparent;
  color: #f0c040;
  cursor: pointer;
  font-family: inherit;
  flex-shrink: 0;
}

.btn-advanced:hover {
  background: #b8860b;
  color: #000;
}

.btn-advanced.active {
  background: #b8860b;
  color: #000;
  font-weight: 600;
}
</style>
