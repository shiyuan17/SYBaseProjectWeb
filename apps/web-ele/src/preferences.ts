import { defineOverridesPreferences } from '@vben/preferences';

import { BRAND_LOGO_SOURCE, BRAND_NAME } from './preferences-branding';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: BRAND_NAME,
  },
  copyright: {
    companyName: BRAND_NAME,
    companySiteLink: '',
  },
  logo: {
    source: BRAND_LOGO_SOURCE,
    sourceDark: BRAND_LOGO_SOURCE,
  },
});
