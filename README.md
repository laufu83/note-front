智慧笔记前端项目 README.md
markdown
# 智慧笔记 · 前端系统
基于 Vue3 + TypeScript + Element Plus + Pinia 开发的个人云笔记管理平台，支持账号邮箱注册登录、笔记增删改查、分类标签管理、文件上传、笔记公开分享、密码重置、邮箱账号激活等完整功能。

## 📦 技术栈
- 框架：Vue 3 + Composition API + TypeScript
- UI组件库：Element Plus
- 状态管理：Pinia
- 路由：Vue Router 4
- HTTP请求：Axios
- 构建工具：Vite
- 部署：Cloudflare Pages

## ✨ 核心功能
### 1. 账号权限模块
- 用户名 / 注册邮箱 两种方式登录
- 邮箱注册 + 账号邮箱激活（Resend 邮件发送）
- 未激活账号弹窗支持重新发送激活邮件
- 忘记密码：邮箱接收重置链接，15分钟有效期重置密码
- Token 持久化存储、自动登录、登录鉴权路由守卫
- 退出登录、强制下线（修改密码后清空所有客户端登录）

### 2. 笔记核心模块
- 笔记新增、编辑、删除、回收站恢复/永久删除
- 历史版本记录，支持查看过往笔记内容
- 笔记分类、标签批量管理筛选
- 笔记列表分页、条件搜索

### 3. 文件管理模块
- 附件文件上传、在线预览、删除管理
- 文件大小、上传时间展示

### 4. 笔记分享模块
- 生成公开分享链接，可设置访问密码
- 公开分享页面免登录查看笔记
- 我的分享列表管理、取消分享

### 5. 系统设置
- 用户基础信息查看
- 密码修改

## 📁 项目目录结构
src
├── api # 接口请求封装
├── assets # 静态资源、样式
├── layout # 后台布局框架
├── router # 路由配置 + 登录鉴权守卫
├── stores # Pinia 全局状态管理
├── utils # 请求拦截器、工具函数
├── views
│ ├── dashboard # 首页仪表盘
│ ├── login # 登录注册页面
│ ├── user # 用户相关页面
│ │ ├── Activate.vue # 邮箱激活中转页
│ │ ├── ActivateSuccess.vue # 激活成功页
│ │ ├── ActivateFail.vue # 激活失败页
│ │ └── ResetPassword.vue # 密码重置页
│ ├── note # 笔记列表、编辑、回收站、历史版本
│ ├── manage # 分类、标签管理
│ ├── file # 文件管理
│ ├── share # 分享管理、公开分享查看页
│ └── setting # 个人设置
├── App.vue
└── main.ts
plaintext

## 🚀 本地运行
### 1. 安装依赖
```bash
npm install
2. 环境变量配置
新建 .env.development
env
# 后端接口地址
VITE_API_BASE_URL=http://127.0.0.1:8787
3. 启动开发服务
bash
运行
npm run dev
4. 打包构建
bash
运行
npm run build
打包产物：dist 文件夹，用于部署至 Cloudflare Pages。
🌐 部署方式（Cloudflare Pages）
方式 1：GitHub 自动部署（推荐）
将前端代码推送至 GitHub 仓库
进入 Cloudflare Pages → Create application → Connect to Git
选择当前前端仓库，配置打包参数：
Framework preset：Vue
Build command：npm run build
Build output directory：dist
配置环境变量：
env
VITE_API_BASE_URL=https://api.你的域名.workers.dev
部署完成，配置自定义域名，开启 SPA 路由重写规则：
规则：/* → 目标：/index.html，解决刷新页面 404 问题。
方式 2：本地手动部署
bash
运行
npm run build
npx wrangler pages deploy dist
🛡️ 路由白名单（免登录访问页面）
/login 登录注册页
/activate 邮箱激活中转页
/activate-success 激活成功页
/activate-fail 激活失败页
/reset-password 密码重置页
/share/:code 公开笔记分享页
⚙️ 后端配套项目
后端基于 Cloudflare Workers + TypeScript + Neon PostgreSQL + Upstash Redis + Resend 开发
仓库地址：[填写后端仓库地址]
后端核心能力
JWT 签发 AccessToken / RefreshToken
邮箱激活、密码重置邮件发送
用户账号状态校验、密码 bcrypt 加密校验
笔记、分类、标签、文件、分享数据 CRUD
跨域 CORS 配置、接口请求权限校验