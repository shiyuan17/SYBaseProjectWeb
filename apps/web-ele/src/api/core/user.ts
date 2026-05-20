import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { getCurrentUserApi } from './auth';

export async function getUserInfoApi() {
  const currentUser = await getCurrentUserApi();
  return {
    avatar: currentUser.avatar ?? preferences.app.defaultAvatar,
    desc: '',
    homePath: currentUser.homePath || preferences.app.defaultHomePath,
    realName: currentUser.realName,
    roles: currentUser.roles ?? [],
    token: '',
    userId: currentUser.userId,
    username: currentUser.loginName,
  } satisfies UserInfo;
}
