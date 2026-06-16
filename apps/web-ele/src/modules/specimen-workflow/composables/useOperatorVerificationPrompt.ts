import { computed } from 'vue';

import { useUserStore } from '@vben/stores';

import { ElMessage, ElMessageBox } from 'element-plus';

import { verifyOperatorCredential } from '../api/specimen-workflow-service';
import { getWorkflowPageErrorMessage } from '../utils/error';

export type OperatorSelection = {
  id: string;
  loginName: string;
  name: string;
};

export function useOperatorVerificationPrompt() {
  const userStore = useUserStore();
  const currentUserId = computed(
    () => userStore.userInfo?.userId?.trim() ?? '',
  );
  const currentLoginName = computed(() => {
    const userInfo = userStore.userInfo as undefined | { loginName?: string };
    return userInfo?.loginName?.trim() ?? '';
  });

  function isCurrentUser(operator: OperatorSelection) {
    return (
      operator.id.trim() === currentUserId.value ||
      (Boolean(operator.loginName.trim()) &&
        operator.loginName.trim() === currentLoginName.value)
    );
  }

  async function verifyOperator(operator: OperatorSelection) {
    if (!operator.id.trim() || !operator.name.trim()) {
      ElMessage.warning('请选择核对操作人');
      return null;
    }
    if (!operator.loginName.trim()) {
      ElMessage.warning('核对操作人缺少登录账号');
      return null;
    }
    if (isCurrentUser(operator)) {
      await ElMessageBox.alert('登录人跟核对人不能是同一个人！', '提示', {
        confirmButtonText: '确定',
        type: 'warning',
      });
      return null;
    }

    try {
      const { value } = await ElMessageBox.prompt(
        `账号：${operator.loginName}`,
        '用户验证',
        {
          cancelButtonText: '取消',
          confirmButtonText: '确认',
          inputPattern: /\S+/,
          inputPlaceholder: '请输入密码',
          inputType: 'password',
          inputErrorMessage: '请输入密码',
        },
      );
      const result = await verifyOperatorCredential({
        loginName: operator.loginName.trim(),
        operatorName: operator.name.trim(),
        operatorUserId: operator.id.trim(),
        password: value.trim(),
      });
      return result.operatorVerificationToken;
    } catch (error) {
      if (error !== 'cancel' && error !== 'close') {
        ElMessage.error(getWorkflowPageErrorMessage(error));
      }
      return null;
    }
  }

  return {
    verifyOperator,
  };
}
