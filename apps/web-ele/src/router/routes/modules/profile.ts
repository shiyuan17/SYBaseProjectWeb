import type { RouteRecordRaw } from 'vue-router';

import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      title: '个人中心',
    },
    name: 'Profile',
    path: '/profile',
    component: () => import('#/views/_core/profile/index.vue'),
  },
]);

export default routes;
