import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
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
];

export default routes;
