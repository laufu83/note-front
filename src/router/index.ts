import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/user";
import ResetPassword from "@/views/user/ResetPassword.vue";
const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "用户登录" },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/register/index.vue"),
    meta: { title: "用户注册" },
  },
  {
    path: "/share/:code",
    name: "ShareView",
    component: () => import("@/views/share/index.vue"),
    meta: { title: "分享" },
  },
  {
    path: "/reset-password",
    name: "ResetPassword",
    component: ResetPassword,
    meta: { title: "密码重置" },
  },
  {
    path: "/activate-success",
    name: "ActivateSuccess",
    component: () => import("@/views/user/ActivateSuccess.vue"),
    meta: { title: "激活成功" },
  },
  {
    path: "/activate-fail",
    name: "ActivateFail",
    component: () => import("@/views/user/ActivateFail.vue"),
    meta: { title: "激活失败" },
  },
  {
    path: "/activate",
    name: "Activate",
    component: () => import("@/views/user/Activate.vue"),
    meta: { title: "账号激活" },
  },
  {
    path: "/change-email",
    name: "Activate",
    component: () => import("@/views/user/ChangeEmail.vue"),
    meta: { title: "账号激活" },
  },
  {
    path: "/",
    redirect: "/dashboard",
    component: () => import("@/layout/index.vue"),
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        meta: { title: "个人中心" },
      },
      {
        path: "note/list",
        name: "NoteList",
        component: () => import("@/views/note/list.vue"),
        meta: { title: "笔记列表" },
      },
      {
        path: "note/edit",
        name: "NoteEdit",
        component: () => import("@/views/note/edit.vue"),
        meta: { title: "笔记编辑" },
      },
      {
        path: "note/recycle",
        name: "NoteRecycle",
        component: () => import("@/views/note/recycle.vue"),
        meta: { title: "回收站" },
      },
      {
        path: "note/history/:id",
        name: "NoteHistory",
        component: () => import("@/views/note/history.vue"),
        meta: { title: "历史记录" },
      },
      {
        path: "manage/category",
        name: "CategoryManage",
        component: () => import("@/views/manage/category.vue"),
        meta: { title: "分类管理" },
      },
      {
        path: "manage/tag",
        name: "TagManage",
        component: () => import("@/views/manage/tag.vue"),
        meta: { title: "标签管理" },
      },
      {
        path: "file",
        name: "FileManage",
        component: () => import("@/views/file/index.vue"),
        meta: { title: "附件管理" },
      },
      {
        path: "manage/share",
        name: "ShareManage",
        component: () => import("@/views/manage/share.vue"),
        meta: { title: "分享管理" },
      },
      {
        path: "setting",
        name: "Setting",
        component: () => import("@/views/setting/index.vue"),
        meta: { title: "个人设置" },
      },
      {
        path: "manage/user",
        name: "UserManage",
        component: () => import("@/views/manage/user.vue"),
        meta: {
          title: "用户管理",
          requireAdmin: true,
        },
      },
      {
        path: "user/profile",
        name: "Profile",
        component: () => import("@/views/user/Profile.vue"),
        meta: { title: "用户信息", requiresAuth: true },
      },
      {
        path: "/system/config",
        name: "ConfigDict",
        component: () => import("@/views/system/ConfigDict.vue"),
        meta: {
          title: "系统配置字典",
          requireAdmin: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  const token = userStore.accessToken;
  // 免登录白名单路由名称
  const publicRouteNames = [
    "Login",
    "ShareView",
    "Register",
    "ResetPassword",
    "Activate",
    "ActivateSuccess",
    "ActivateFail",
  ];
  if (publicRouteNames.includes(to.name as string)) {
    next();
  } else {
    token ? next() : next("/login");
  }
});
export default router;
