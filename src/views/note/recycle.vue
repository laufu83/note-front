<template>
  <div>
    <el-table :data="tableData" border>
      <el-table-column label="标题" prop="title" />
      <el-table-column label="删除时间" prop="delete_expire" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button text @click="restore(scope.row.id)">恢复</el-button>
          <el-button text type="danger" @click="destroy(scope.row.id)">永久删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const tableData = ref([])

async function load() {
  const res = await request.get('/api/note', { params: { trash: 1, page: 1, size: 999 } })
  tableData.value = res.data.list
}

async function restore(id: number) {
  await request.put(`/api/note/${id}/restore`)
  ElMessage.success('恢复成功')
  load()
}

async function destroy(id: number) {
  await request.delete(`/api/note/${id}/destroy`)
  ElMessage.success('永久删除成功')
  load()
}

onMounted(load)
</script>