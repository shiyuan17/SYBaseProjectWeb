import type { RouteRecordRaw } from 'vue-router';

import { applyKeepAliveToTabRoutes } from '#/router/routes/keep-alive';

const routes: RouteRecordRaw[] = applyKeepAliveToTabRoutes([
  {
    meta: {
      hideInMenu: true,
      title: '通知中心',
    },
    name: 'NotificationCenter',
    path: '/notifications',
    component: () =>
      import('#/modules/notification-center/views/NotificationCenterView.vue'),
  },
]);

export default routes;
