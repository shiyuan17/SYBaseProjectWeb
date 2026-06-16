import type {
  LoginLogPageQuery,
  OperationLog,
  OperationLogPageQuery,
  UserLoginLog,
} from '../types/system-management';

import { onMounted, reactive, ref } from 'vue';

import {
  getLoginLog,
  getOperationLog,
  listLoginLogs,
  listOperationLogs,
} from '../api/system-management-service';

type DateRangeValue = [] | [string, string];
type LogTabName = 'login' | 'operation';

interface PaginationState {
  page: number;
  size: number;
  total: number;
}

interface LoginLogFilters {
  clientDevice: string;
  ip: string;
  keyword: string;
  loginName: string;
  result: string;
  userId: string;
}

interface OperationLogFilters {
  businessId: string;
  businessType: string;
  contentKeyword: string;
  ip: string;
  keyword: string;
  moduleCode: string;
  operationName: string;
  operatorKeyword: string;
  result: string;
}

export const LOG_RESULT_OPTIONS = [
  { label: '成功', value: 'SUCCESS' },
  { label: '失败', value: 'FAILED' },
] as const;

export const OPERATION_MODULE_OPTIONS = [
  { label: '系统管理', value: 'SYSTEM' },
  { label: '临床送检', value: 'M2' },
  { label: '制片管理', value: 'M3' },
  { label: '诊断管理', value: 'M4' },
  { label: '运营支持', value: 'M5' },
  { label: '统计分析', value: 'M6' },
] as const;

const DEFAULT_PAGE_SIZE = 20;

export function useLogManagementPage() {
  const activeTab = ref<LogTabName>('login');

  const loginFilters = reactive<LoginLogFilters>({
    clientDevice: '',
    ip: '',
    keyword: '',
    loginName: '',
    result: '',
    userId: '',
  });
  const operationFilters = reactive<OperationLogFilters>({
    businessId: '',
    businessType: '',
    contentKeyword: '',
    ip: '',
    keyword: '',
    moduleCode: '',
    operationName: '',
    operatorKeyword: '',
    result: '',
  });

  const loginTimeRange = ref<DateRangeValue>([]);
  const operationTimeRange = ref<DateRangeValue>([]);
  const loginPagination = reactive<PaginationState>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const operationPagination = reactive<PaginationState>({
    page: 1,
    size: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  const loginLogs = ref<UserLoginLog[]>([]);
  const operationLogs = ref<OperationLog[]>([]);
  const loginLoading = ref(false);
  const operationLoading = ref(false);
  const loginError = ref('');
  const operationError = ref('');

  const loginDetail = ref<null | UserLoginLog>(null);
  const operationDetail = ref<null | OperationLog>(null);
  const detailLoading = ref(false);
  const detailError = ref('');
  const detailDrawerVisible = ref(false);
  const detailDrawerType = ref<LogTabName>('login');

  async function loadLoginLogs() {
    loginLoading.value = true;
    loginError.value = '';
    try {
      const result = await listLoginLogs(buildLoginQuery());
      loginLogs.value = result.items;
      loginPagination.page = result.page;
      loginPagination.size = result.size;
      loginPagination.total = result.total;
    } catch (error) {
      loginError.value = getErrorMessage(error);
      loginLogs.value = [];
      loginPagination.total = 0;
    } finally {
      loginLoading.value = false;
    }
  }

  async function loadOperationLogs() {
    operationLoading.value = true;
    operationError.value = '';
    try {
      const result = await listOperationLogs(buildOperationQuery());
      operationLogs.value = result.items;
      operationPagination.page = result.page;
      operationPagination.size = result.size;
      operationPagination.total = result.total;
    } catch (error) {
      operationError.value = getErrorMessage(error);
      operationLogs.value = [];
      operationPagination.total = 0;
    } finally {
      operationLoading.value = false;
    }
  }

  function searchLoginLogs() {
    loginPagination.page = 1;
    void loadLoginLogs();
  }

  function searchOperationLogs() {
    operationPagination.page = 1;
    void loadOperationLogs();
  }

  function resetLoginFilters() {
    Object.assign(loginFilters, {
      clientDevice: '',
      ip: '',
      keyword: '',
      loginName: '',
      result: '',
      userId: '',
    });
    loginTimeRange.value = [];
    searchLoginLogs();
  }

  function resetOperationFilters() {
    Object.assign(operationFilters, {
      businessId: '',
      businessType: '',
      contentKeyword: '',
      ip: '',
      keyword: '',
      moduleCode: '',
      operationName: '',
      operatorKeyword: '',
      result: '',
    });
    operationTimeRange.value = [];
    searchOperationLogs();
  }

  function handleLoginPageChange(page: number) {
    loginPagination.page = page;
    void loadLoginLogs();
  }

  function handleLoginSizeChange(size: number) {
    loginPagination.page = 1;
    loginPagination.size = size;
    void loadLoginLogs();
  }

  function handleOperationPageChange(page: number) {
    operationPagination.page = page;
    void loadOperationLogs();
  }

  function handleOperationSizeChange(size: number) {
    operationPagination.page = 1;
    operationPagination.size = size;
    void loadOperationLogs();
  }

  async function openLoginDetail(row: UserLoginLog) {
    detailDrawerVisible.value = true;
    detailDrawerType.value = 'login';
    loginDetail.value = null;
    operationDetail.value = null;
    detailError.value = '';
    detailLoading.value = true;
    try {
      loginDetail.value = await getLoginLog(row.id);
    } catch (error) {
      detailError.value = getErrorMessage(error);
    } finally {
      detailLoading.value = false;
    }
  }

  async function openOperationDetail(row: OperationLog) {
    detailDrawerVisible.value = true;
    detailDrawerType.value = 'operation';
    loginDetail.value = null;
    operationDetail.value = null;
    detailError.value = '';
    detailLoading.value = true;
    try {
      operationDetail.value = await getOperationLog(row.id);
    } catch (error) {
      detailError.value = getErrorMessage(error);
    } finally {
      detailLoading.value = false;
    }
  }

  function loadActiveTab() {
    if (activeTab.value === 'login') {
      void loadLoginLogs();
      return;
    }
    void loadOperationLogs();
  }

  function handleTabChange() {
    loadActiveTab();
  }

  function buildLoginQuery(): LoginLogPageQuery {
    return stripEmpty({
      clientDevice: loginFilters.clientDevice,
      endAt: loginTimeRange.value[1],
      ip: loginFilters.ip,
      keyword: loginFilters.keyword,
      loginName: loginFilters.loginName,
      page: loginPagination.page,
      result: loginFilters.result,
      size: loginPagination.size,
      startAt: loginTimeRange.value[0],
      userId: loginFilters.userId,
    });
  }

  function buildOperationQuery(): OperationLogPageQuery {
    return stripEmpty({
      businessId: operationFilters.businessId,
      businessType: operationFilters.businessType,
      contentKeyword: operationFilters.contentKeyword,
      endAt: operationTimeRange.value[1],
      ip: operationFilters.ip,
      keyword: operationFilters.keyword,
      moduleCode: operationFilters.moduleCode,
      operationName: operationFilters.operationName,
      operatorKeyword: operationFilters.operatorKeyword,
      page: operationPagination.page,
      result: operationFilters.result,
      size: operationPagination.size,
      startAt: operationTimeRange.value[0],
    });
  }

  onMounted(() => {
    void loadLoginLogs();
  });

  return {
    LOG_RESULT_OPTIONS,
    OPERATION_MODULE_OPTIONS,
    activeTab,
    detailDrawerType,
    detailDrawerVisible,
    detailError,
    detailLoading,
    handleLoginPageChange,
    handleLoginSizeChange,
    handleOperationPageChange,
    handleOperationSizeChange,
    handleTabChange,
    loadActiveTab,
    loadLoginLogs,
    loadOperationLogs,
    loginDetail,
    loginError,
    loginFilters,
    loginLoading,
    loginLogs,
    loginPagination,
    loginTimeRange,
    openLoginDetail,
    openOperationDetail,
    operationDetail,
    operationError,
    operationFilters,
    operationLoading,
    operationLogs,
    operationPagination,
    operationTimeRange,
    resetLoginFilters,
    resetOperationFilters,
    searchLoginLogs,
    searchOperationLogs,
  };
}

function stripEmpty<
  T extends Record<string, null | number | string | undefined>,
>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => {
      if (typeof fieldValue === 'string') {
        return fieldValue.trim().length > 0;
      }
      return fieldValue !== null && fieldValue !== undefined;
    }),
  ) as T;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '日志数据加载失败，请稍后重试。';
}
