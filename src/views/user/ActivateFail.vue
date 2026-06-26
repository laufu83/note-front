<template>
  <div class="activate-page">
    <div class="card fail">
      <div class="icon">❌</div>
      <h2>激活失败</h2>
      <p>{{ $route.query.msg }}</p>
      <button @click="$router.push('/register')">重新注册</button>
    </div>
  </div>
</template>

<style scoped>
.activate-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}
.card {
  width: 420px;
  padding: 40px 30px;
  background: #fff;
  border-radius: 12px;
  text-align: center;
}
.icon {
  font-size: 48px;
  margin-bottom: 16px;
}
h2 {
  color: #333;
  margin-bottom: 12px;
}
p {
  color: #666;
  margin-bottom: 24px;
}
button {
  padding: 10px 28px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>