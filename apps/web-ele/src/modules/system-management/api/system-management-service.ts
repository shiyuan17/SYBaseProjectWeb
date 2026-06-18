import type {
  AssignUserRoleItem,
  BodyPartNode,
  ChargeItemPageQuery,
  ChargeItemView,
  ConfigCategoryNode,
  CreateBodyPartRequest,
  CreateChargeItemRequest,
  CreateConfigCategoryRequest,
  CreateConfigItemRequest,
  CreateDepartmentRequest,
  CreateGuidelineCategoryRequest,
  CreateGuidelineRequest,
  CreateMedicalOrderCategoryRequest,
  CreateMedicalOrderItemRequest,
  CreatePackageRequest,
  CreateRoleRequest,
  CreateSpecimenDictionaryCategoryRequest,
  CreateSpecimenDictionaryItemRequest,
  CreateSystemUserRequest,
  CreateTemplateCategoryRequest,
  CreateTemplateRequest,
  DepartmentNode,
  GuidelineCategoryNode,
  GuidelineDetailView,
  LoginLogPageQuery,
  MedicalOrderCategoryNode,
  MenuView,
  MessageTopicView,
  NumberingRuleView,
  OperationLog,
  OperationLogPageQuery,
  PackagePageQuery,
  PackageView,
  PagedResult,
  PermissionView,
  PrintLoginTagResponse,
  RoleAuthorizationView,
  RoleView,
  SpecimenDictionaryItemView,
  SpecimenDictionaryTreeView,
  StatCategoryView,
  SystemUser,
  TemplateCategoryNode,
  TemplateDetailView,
  UpdateBodyPartRequest,
  UpdateChargeItemRequest,
  UpdateConfigCategoryRequest,
  UpdateConfigItemRequest,
  UpdateDepartmentRequest,
  UpdateGuidelineCategoryRequest,
  UpdateGuidelineRequest,
  UpdateMedicalOrderCategoryRequest,
  UpdateMedicalOrderItemRequest,
  UpdateNumberingRuleRequest,
  UpdatePackageRequest,
  UpdateRoleAuthorizationRequest,
  UpdateRoleRequest,
  UpdateSpecimenDictionaryCategoryRequest,
  UpdateSpecimenDictionaryItemRequest,
  UpdateSystemUserRequest,
  UpdateTemplateCategoryRequest,
  UpdateTemplateRequest,
  UserLoginLog,
} from '../types/system-management';

import { requestClient } from '#/api/request';

function requestPatch<T>(url: string, data?: unknown) {
  return requestClient.request<T>(url, {
    data,
    method: 'PATCH',
  });
}

export function normalizeArrayResult<T>(value: null | T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function normalizePagedResult<T>(
  value: null | PagedResult<T> | undefined,
  fallbackPage: number = 1,
  fallbackSize: number = 10,
): PagedResult<T> {
  return {
    items: normalizeArrayResult(value?.items),
    page: typeof value?.page === 'number' ? value.page : fallbackPage,
    size: typeof value?.size === 'number' ? value.size : fallbackSize,
    total: typeof value?.total === 'number' ? value.total : 0,
  };
}

export async function listSystemUsers(params: Record<string, unknown>) {
  const page = typeof params.page === 'number' ? params.page : 1;
  const size = typeof params.size === 'number' ? params.size : 10;
  const result = await requestClient.get<PagedResult<SystemUser>>(
    '/v1/system-users',
    {
      params,
    },
  );
  return normalizePagedResult(result, page, size);
}

export async function createSystemUser(data: CreateSystemUserRequest) {
  return requestClient.post<SystemUser>('/v1/system-users', data);
}

export async function updateSystemUser(
  id: string,
  data: UpdateSystemUserRequest,
) {
  return requestPatch<SystemUser>(`/v1/system-users/${id}`, data);
}

export async function updateSystemUserEnabled(id: string, enabled: boolean) {
  return requestPatch<SystemUser>(`/v1/system-users/${id}/enabled`, {
    enabled,
  });
}

export async function assignSystemUserRoles(
  id: string,
  assignments: AssignUserRoleItem[],
) {
  return requestClient.put<SystemUser>(`/v1/system-users/${id}/roles`, {
    assignments,
  });
}

export async function listUserLoginLogs(
  id: string,
  params: Record<string, unknown>,
) {
  const page = typeof params.page === 'number' ? params.page : 1;
  const size = typeof params.size === 'number' ? params.size : 10;
  const result = await requestClient.get<PagedResult<UserLoginLog>>(
    `/v1/system-users/${id}/login-logs`,
    {
      params,
    },
  );
  return normalizePagedResult(result, page, size);
}

export async function listLoginLogs(params: LoginLogPageQuery) {
  const result = await requestClient.get<PagedResult<UserLoginLog>>(
    '/v1/system/logs/login',
    { params },
  );
  return normalizePagedResult(result, params.page, params.size);
}

export async function getLoginLog(id: string) {
  return requestClient.get<UserLoginLog>(`/v1/system/logs/login/${id}`);
}

export async function listOperationLogs(params: OperationLogPageQuery) {
  const result = await requestClient.get<PagedResult<OperationLog>>(
    '/v1/system/logs/operations',
    { params },
  );
  return normalizePagedResult(result, params.page, params.size);
}

export async function getOperationLog(id: string) {
  return requestClient.get<OperationLog>(`/v1/system/logs/operations/${id}`);
}

export async function importSystemUsers(file: File) {
  return requestClient.upload('/v1/system-users/import', { file });
}

export async function exportSystemUsers(params: Record<string, unknown>) {
  return requestClient.download('/v1/system-users/export', {
    params,
    responseReturn: 'body',
  });
}

export async function printSystemUserLoginTag(id: string) {
  return requestClient.post<PrintLoginTagResponse>(
    `/v1/system-users/${id}/print-login-tag`,
  );
}

export async function listRoles() {
  return normalizeArrayResult(await requestClient.get<RoleView[]>('/v1/roles'));
}

export async function createRole(data: CreateRoleRequest) {
  return requestClient.post<RoleView>('/v1/roles', data);
}

export async function updateRole(id: string, data: UpdateRoleRequest) {
  return requestPatch<RoleView>(`/v1/roles/${id}`, data);
}

export async function deleteRole(id: string) {
  return requestClient.delete(`/v1/roles/${id}`);
}

export async function getRoleAuthorization(id: string) {
  return requestClient.get<RoleAuthorizationView>(
    `/v1/roles/${id}/authorizations`,
  );
}

export async function updateRoleAuthorization(
  id: string,
  data: UpdateRoleAuthorizationRequest,
) {
  return requestClient.put<RoleAuthorizationView>(
    `/v1/roles/${id}/authorizations`,
    data,
  );
}

export async function listMenus() {
  return normalizeArrayResult(await requestClient.get<MenuView[]>('/v1/menus'));
}

export async function listPermissions() {
  return normalizeArrayResult(
    await requestClient.get<PermissionView[]>('/v1/permissions'),
  );
}

export async function listMessageTopics() {
  return normalizeArrayResult(
    await requestClient.get<MessageTopicView[]>('/v1/message-topics'),
  );
}

export async function listStatCategories() {
  return normalizeArrayResult(
    await requestClient.get<StatCategoryView[]>('/v1/stat-categories'),
  );
}

export async function listBodyParts() {
  return normalizeArrayResult(
    await requestClient.get<BodyPartNode[]>('/v1/body-parts'),
  );
}

export async function listDepartments() {
  return normalizeArrayResult(
    await requestClient.get<DepartmentNode[]>('/v1/departments'),
  );
}

export async function createDepartment(data: CreateDepartmentRequest) {
  return requestClient.post<DepartmentNode>('/v1/departments', data);
}

export async function updateDepartment(
  id: string,
  data: UpdateDepartmentRequest,
) {
  return requestPatch<DepartmentNode>(`/v1/departments/${id}`, data);
}

export async function updateDepartmentEnabled(id: string, enabled: boolean) {
  return requestPatch<DepartmentNode>(`/v1/departments/${id}/enabled`, {
    enabled,
  });
}

export async function deleteDepartment(id: string) {
  return requestClient.delete(`/v1/departments/${id}`);
}

export async function createBodyPart(data: CreateBodyPartRequest) {
  return requestClient.post<BodyPartNode>('/v1/body-parts', data);
}

export async function updateBodyPart(id: string, data: UpdateBodyPartRequest) {
  return requestPatch<BodyPartNode>(`/v1/body-parts/${id}`, data);
}

export async function updateBodyPartEnabled(id: string, enabled: boolean) {
  return requestPatch<BodyPartNode>(`/v1/body-parts/${id}/enabled`, {
    enabled,
  });
}

export async function deleteBodyPart(id: string) {
  return requestClient.delete(`/v1/body-parts/${id}`);
}

export async function listMedicalOrderDicts() {
  return normalizeArrayResult(
    await requestClient.get<MedicalOrderCategoryNode[]>(
      '/v1/medical-order-dicts',
    ),
  );
}

export async function createMedicalOrderCategory(
  data: CreateMedicalOrderCategoryRequest,
) {
  return requestClient.post<MedicalOrderCategoryNode>(
    '/v1/medical-order-dicts/categories',
    data,
  );
}

export async function updateMedicalOrderCategory(
  id: string,
  data: UpdateMedicalOrderCategoryRequest,
) {
  return requestPatch<MedicalOrderCategoryNode>(
    `/v1/medical-order-dicts/categories/${id}`,
    data,
  );
}

export async function deleteMedicalOrderCategory(id: string) {
  return requestClient.delete(`/v1/medical-order-dicts/categories/${id}`);
}

export async function createMedicalOrderItem(
  data: CreateMedicalOrderItemRequest,
) {
  return requestClient.post('/v1/medical-order-dicts/items', data);
}

export async function updateMedicalOrderItem(
  id: string,
  data: UpdateMedicalOrderItemRequest,
) {
  return requestPatch(`/v1/medical-order-dicts/items/${id}`, data);
}

export async function updateMedicalOrderItemEnabled(
  id: string,
  enabled: boolean,
) {
  return requestPatch(`/v1/medical-order-dicts/items/${id}/enabled`, {
    enabled,
  });
}

export async function deleteMedicalOrderItem(id: string) {
  return requestClient.delete(`/v1/medical-order-dicts/items/${id}`);
}

export async function listChargeItemsPage(params: ChargeItemPageQuery) {
  const result = await requestClient.get<PagedResult<ChargeItemView>>(
    '/v1/medical-order-charge-items/page',
    { params },
  );
  return normalizePagedResult(result, params.page, params.size);
}

export async function createChargeItem(data: CreateChargeItemRequest) {
  return requestClient.post<ChargeItemView>(
    '/v1/medical-order-charge-items',
    data,
  );
}

export async function updateChargeItem(
  id: string,
  data: UpdateChargeItemRequest,
) {
  return requestPatch<ChargeItemView>(
    `/v1/medical-order-charge-items/${id}`,
    data,
  );
}

export async function updateChargeItemEnabled(id: string, enabled: boolean) {
  return requestPatch<ChargeItemView>(
    `/v1/medical-order-charge-items/${id}/enabled`,
    { enabled },
  );
}

export async function deleteChargeItem(id: string) {
  return requestClient.delete(`/v1/medical-order-charge-items/${id}`);
}

export async function exportChargeItems(params: Record<string, unknown>) {
  return requestClient.download('/v1/medical-order-charge-items/export', {
    params,
    responseReturn: 'body',
  });
}

export async function importChargeItems(file: File) {
  return requestClient.upload('/v1/medical-order-charge-items/import', {
    file,
  });
}

export async function listMedicalOrderPackagesPage(params: PackagePageQuery) {
  const result = await requestClient.get<PagedResult<PackageView>>(
    '/v1/medical-order-packages/page',
    { params },
  );
  return normalizePagedResult(result, params.page, params.size);
}

export async function createMedicalOrderPackage(data: CreatePackageRequest) {
  return requestClient.post<PackageView>('/v1/medical-order-packages', data);
}

export async function updateMedicalOrderPackage(
  id: string,
  data: UpdatePackageRequest,
) {
  return requestPatch<PackageView>(`/v1/medical-order-packages/${id}`, data);
}

export async function updateMedicalOrderPackageEnabled(
  id: string,
  enabled: boolean,
) {
  return requestPatch<PackageView>(`/v1/medical-order-packages/${id}/enabled`, {
    enabled,
  });
}

export async function deleteMedicalOrderPackage(id: string) {
  return requestClient.delete(`/v1/medical-order-packages/${id}`);
}

export async function listSamplingTemplates() {
  return normalizeArrayResult(
    await requestClient.get<TemplateCategoryNode[]>('/v1/sampling-templates'),
  );
}

export async function getSamplingTemplateDetail(id: string) {
  return requestClient.get<TemplateDetailView>(`/v1/sampling-templates/${id}`);
}

export async function createSamplingTemplateCategory(
  data: CreateTemplateCategoryRequest,
) {
  return requestClient.post<TemplateCategoryNode>(
    '/v1/sampling-templates/categories',
    data,
  );
}

export async function updateSamplingTemplateCategory(
  id: string,
  data: UpdateTemplateCategoryRequest,
) {
  return requestPatch<TemplateCategoryNode>(
    `/v1/sampling-templates/categories/${id}`,
    data,
  );
}

export async function deleteSamplingTemplateCategory(id: string) {
  return requestClient.delete(`/v1/sampling-templates/categories/${id}`);
}

export async function createSamplingTemplate(data: CreateTemplateRequest) {
  return requestClient.post<TemplateDetailView>('/v1/sampling-templates', data);
}

export async function updateSamplingTemplate(
  id: string,
  data: UpdateTemplateRequest,
) {
  return requestPatch<TemplateDetailView>(`/v1/sampling-templates/${id}`, data);
}

export async function updateSamplingTemplateEnabled(
  id: string,
  enabled: boolean,
) {
  return requestPatch<TemplateDetailView>(
    `/v1/sampling-templates/${id}/enabled`,
    { enabled },
  );
}

export async function deleteSamplingTemplate(id: string) {
  return requestClient.delete(`/v1/sampling-templates/${id}`);
}

export async function listSamplingGuidelines() {
  return normalizeArrayResult(
    await requestClient.get<GuidelineCategoryNode[]>('/v1/sampling-guidelines'),
  );
}

export async function getSamplingGuidelineDetail(id: string) {
  return requestClient.get<GuidelineDetailView>(
    `/v1/sampling-guidelines/${id}`,
  );
}

export async function createSamplingGuidelineCategory(
  data: CreateGuidelineCategoryRequest,
) {
  return requestClient.post<GuidelineCategoryNode>(
    '/v1/sampling-guidelines/categories',
    data,
  );
}

export async function updateSamplingGuidelineCategory(
  id: string,
  data: UpdateGuidelineCategoryRequest,
) {
  return requestPatch<GuidelineCategoryNode>(
    `/v1/sampling-guidelines/categories/${id}`,
    data,
  );
}

export async function deleteSamplingGuidelineCategory(id: string) {
  return requestClient.delete(`/v1/sampling-guidelines/categories/${id}`);
}

export async function createSamplingGuideline(data: CreateGuidelineRequest) {
  return requestClient.post<GuidelineDetailView>(
    '/v1/sampling-guidelines',
    data,
  );
}

export async function updateSamplingGuideline(
  id: string,
  data: UpdateGuidelineRequest,
) {
  return requestPatch<GuidelineDetailView>(
    `/v1/sampling-guidelines/${id}`,
    data,
  );
}

export async function updateSamplingGuidelineEnabled(
  id: string,
  enabled: boolean,
) {
  return requestPatch<GuidelineDetailView>(
    `/v1/sampling-guidelines/${id}/enabled`,
    { enabled },
  );
}

export async function deleteSamplingGuideline(id: string) {
  return requestClient.delete(`/v1/sampling-guidelines/${id}`);
}

export async function listSystemConfigs() {
  return normalizeArrayResult(
    await requestClient.get<ConfigCategoryNode[]>('/v1/system-configs'),
  );
}

export async function createSystemConfigCategory(
  data: CreateConfigCategoryRequest,
) {
  return requestClient.post<ConfigCategoryNode>(
    '/v1/system-configs/categories',
    data,
  );
}

export async function updateSystemConfigCategory(
  id: string,
  data: UpdateConfigCategoryRequest,
) {
  return requestPatch<ConfigCategoryNode>(
    `/v1/system-configs/categories/${id}`,
    data,
  );
}

export async function deleteSystemConfigCategory(id: string) {
  return requestClient.delete(`/v1/system-configs/categories/${id}`);
}

export async function createSystemConfigItem(data: CreateConfigItemRequest) {
  return requestClient.post('/v1/system-configs/items', data);
}

export async function updateSystemConfigItem(
  id: string,
  data: UpdateConfigItemRequest,
) {
  return requestPatch(`/v1/system-configs/items/${id}`, data);
}

export async function deleteSystemConfigItem(id: string) {
  return requestClient.delete(`/v1/system-configs/items/${id}`);
}

export async function getSpecimenDictionaryConfigTree() {
  return requestClient.get<SpecimenDictionaryTreeView>(
    '/v1/system-configs/specimen-dictionary',
  );
}

export async function createSpecimenDictionaryCategory(
  data: CreateSpecimenDictionaryCategoryRequest,
) {
  return requestClient.post<ConfigCategoryNode>(
    '/v1/system-configs/specimen-dictionary/categories',
    data,
  );
}

export async function updateSpecimenDictionaryCategory(
  id: string,
  data: UpdateSpecimenDictionaryCategoryRequest,
) {
  return requestPatch<ConfigCategoryNode>(
    `/v1/system-configs/specimen-dictionary/categories/${id}`,
    data,
  );
}

export async function deleteSpecimenDictionaryCategory(id: string) {
  return requestClient.delete(
    `/v1/system-configs/specimen-dictionary/categories/${id}`,
  );
}

export async function createSpecimenDictionaryItem(
  data: CreateSpecimenDictionaryItemRequest,
) {
  return requestClient.post<SpecimenDictionaryItemView>(
    '/v1/system-configs/specimen-dictionary/items',
    data,
  );
}

export async function updateSpecimenDictionaryItem(
  id: string,
  data: UpdateSpecimenDictionaryItemRequest,
) {
  return requestPatch<SpecimenDictionaryItemView>(
    `/v1/system-configs/specimen-dictionary/items/${id}`,
    data,
  );
}

export async function deleteSpecimenDictionaryItem(id: string) {
  return requestClient.delete(
    `/v1/system-configs/specimen-dictionary/items/${id}`,
  );
}

export async function listNumberingRules() {
  return normalizeArrayResult(
    await requestClient.get<NumberingRuleView[]>('/v1/numbering-rules'),
  );
}

export async function updateNumberingRule(
  id: string,
  data: UpdateNumberingRuleRequest,
) {
  return requestPatch<NumberingRuleView>(`/v1/numbering-rules/${id}`, data);
}
