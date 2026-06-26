<template>
  <el-card>
    <div v-html="html"></div>
    <el-button type="primary" @click="rollback">回滚到此版本</el-button>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { marked } from 'marked'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const noteId = ref(Number(route.params.id))
const historyId = ref(Number(route.query.hid))
const html = ref('')

async function load() {
  const res = await request.get(`/api/note/${noteId.value}/history`)
  const item = res.data.find((i: any) => i.id === historyId.value)
  html.value = marked.parse(item.content || '') as string
}

async function rollback() {
  await request.post('/api/note/rollback', { noteId: noteId.value, historyId: historyId.value })
  ElMessage.success('回滚成功')
  router.push('/note/list')
}

onMounted(load)
</script>