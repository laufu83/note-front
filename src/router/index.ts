import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/user";
import ResetPassword from "@/views/user/ResetPassword.vue";
const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
  },
  {
    path: "/share/:code",
    name: "ShareView",
    component: () => import("@/views/share/index.vue"),
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
  },
  {
    path: "/activate-fail",
    name: "ActivateFail",
    component: () => import("@/views/user/ActivateFail.vue"),
  },
  {
    path: "/activate",
    name: "Activate",
    component: () => import("@/views/user/Activate.vue"),
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
      },
      {
        path: "note/list",
        name: "NoteList",
        component: () => import("@/views/note/list.vue"),
      },
      {
        path: "note/edit",
        name: "NoteEdit",
        component: () => import("@/views/note/edit.vue"),
      },
      {
        path: "note/recycle",
        name: "NoteRecycle",
        component: () => import("@/views/note/recycle.vue"),
      },
      {
        path: "note/history/:id",
        name: "NoteHistory",
        component: () => import("@/views/note/history.vue"),
      },
      {
        path: "manage/category",
        name: "CategoryManage",
        component: () => import("@/views/manage/category.vue"),
      },
      {
        path: "manage/tag",
        name: "TagManage",
        component: () => import("@/views/manage/tag.vue"),
      },
      {
        path: "file",
        name: "FileManage",
        component: () => import("@/views/file/index.vue"),
      },
      {
        path: "share/manage",
        name: "ShareManage",
        component: () => import("@/views/share/manage.vue"),
      },
      {
        path: "setting",
        name: "Setting",
        component: () => import("@/views/setting/index.vue"),
      },
      {
  path: 'manage/user',
  name: 'UserManage',
  component: () => import('@/views/manage/user.vue'),
  meta: {
    title: '用户管理',
    requireAdmin: true
  }
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
