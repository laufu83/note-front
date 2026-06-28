<template>
  <el-dialog v-model="visible" title="笔记模板" width="700px">
    <div class="template-grid">
      <div 
        v-for="template in templates" 
        :key="template.id"
        class="template-card"
        @click="applyTemplate(template)"
      >
        <div class="template-icon">{{ template.icon }}</div>
        <h4>{{ template.name }}</h4>
        <p>{{ template.description }}</p>
        <el-tag size="small">{{ template.category }}</el-tag>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { templates } from '@/utils/template'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'apply'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function applyTemplate(template: any) {
  emit('apply', template)
  visible.value = false
}
</script>

<style scoped>
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.template-card {
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.template-card:hover {
  border-color: #409eff;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.template-card h4 {
  margin: 8px 0;
  font-size: 16px;
}

.template-card p {
  font-size: 13px;
  color: #909399;
  margin: 4px 0 12px;
}
</style>