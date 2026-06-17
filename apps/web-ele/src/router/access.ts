import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';

import { BasicLayout, IFrameView } from '#/layouts';
import { wrapGlobRouteComponentLoaders } from '#/router/routes/lazy-load';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = {
    ...wrapGlobRouteComponentLoaders(import.meta.glob('../modules/**/*.vue')),
    ...wrapGlobRouteComponentLoaders(import.meta.glob('../views/**/*.vue')),
  };

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible('frontend', {
    ...options,
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
