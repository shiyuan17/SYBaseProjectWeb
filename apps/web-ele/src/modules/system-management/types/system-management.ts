export interface PagedResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface SystemUserRoleAssignment {
  primary: boolean;
  roleCode: string;
  roleId: string;
  roleName: string;
}

export interface SystemUser {
  avatar: null | string;
  createdAt: string;
  departmentId: null | string;
  departmentName: null | string;
  email: null | string;
  enabled: boolean;
  id: string;
  jobNo: null | string;
  lastLoginAt: null | string;
  lastLoginDevice: null | string;
  lastLoginIp: null | string;
  loginName: string;
  loginTagCode: null | string;
  name: string;
  phone: null | string;
  roles: SystemUserRoleAssignment[];
  titleName: null | string;
  updatedAt: string;
  userCode: null | string;
}

export interface UserLoginLog {
  clientDevice: null | string;
  clientIp: null | string;
  failureReason: null | string;
  id: string;
  loginAt: string;
  loginName: string;
  loginResult: string;
  logoutAt: null | string;
  remarks: null | string;
  userId: null | string;
}

export interface LoginLogPageQuery {
  clientDevice?: null | string;
  endAt?: null | string;
  ip?: null | string;
  keyword?: null | string;
  loginName?: null | string;
  page: number;
  result?: null | string;
  size: number;
  startAt?: null | string;
  userId?: null | string;
}

export interface OperationLog {
  businessId: null | string;
  businessType: null | string;
  failureReason: null | string;
  id: string;
  moduleCode: null | string;
  operationAt: string;
  operationContent: null | string;
  operationName: string;
  operationResult: string;
  operatorIp: null | string;
  operatorName: null | string;
  operatorUserId: null | string;
}

export interface OperationLogPageQuery {
  businessId?: null | string;
  businessType?: null | string;
  contentKeyword?: null | string;
  endAt?: null | string;
  ip?: null | string;
  keyword?: null | string;
  moduleCode?: null | string;
  operationName?: null | string;
  operatorKeyword?: null | string;
  page: number;
  result?: null | string;
  size: number;
  startAt?: null | string;
}

export interface RoleView {
  createdAt: string;
  dataScope: null | string;
  enabled: boolean;
  id: string;
  remarks: null | string;
  roleCode: string;
  roleName: string;
  roleType: null | string;
  updatedAt: string;
}

export interface RoleAuthorizationView {
  menuIds: string[];
  permissionIds: string[];
  roleId: string;
  statScopes: Record<string, string>;
  topicIds: string[];
}

export interface MenuView {
  componentName: null | string;
  enabled: boolean;
  icon: null | string;
  id: string;
  menuCode: string;
  menuName: string;
  menuType: string;
  parentId: null | string;
  path: string;
  permissionPrefix: null | string;
  sortOrder: number;
  visible: boolean;
}

export interface PermissionView {
  actionKey: string;
  enabled: boolean;
  entryPermission: boolean;
  httpMethod: string;
  id: string;
  menuId: string;
  permissionCode: string;
  permissionGroup: string;
  permissionName: string;
  resourcePath: string;
  sortOrder: number;
}

export interface MessageTopicView {
  description: null | string;
  enabled: boolean;
  id: string;
  topicCategory: null | string;
  topicCode: string;
  topicName: string;
}

export interface StatCategoryView {
  description: null | string;
  enabled: boolean;
  id: string;
  statCode: string;
  statName: string;
  statScope: string;
}

export interface TreeNodeBase {
  children?: TreeNodeBase[];
  enabled: boolean;
  id: string;
  parentId: null | string;
  sortOrder: number;
}

export interface BodyPartNode extends TreeNodeBase {
  children: BodyPartNode[];
  partAlias: null | string;
  partCode: string;
  partLevel: number;
  partName: string;
}

export interface DepartmentNode extends TreeNodeBase {
  children: DepartmentNode[];
  departmentCode: string;
  departmentName: string;
}

export interface MedicalOrderItemView {
  categoryId: string;
  defaultContent: null | string;
  enabled: boolean;
  executionScope: null | string;
  id: string;
  orderItemCode: string;
  orderItemName: string;
  orderType: null | string;
  sortOrder: number;
}

export interface MedicalOrderCategoryNode extends TreeNodeBase {
  categoryCode: string;
  categoryName: string;
  children: MedicalOrderCategoryNode[];
  items: MedicalOrderItemView[];
}

export interface ChargeItemView {
  chargeItemCode: string;
  chargeItemName: string;
  enabled: boolean;
  id: string;
  orderDictItemId: string;
  orderItemName: null | string;
  price: number;
  sortOrder: number;
  specification: null | string;
  unit: null | string;
}

export interface PackageItemView {
  id: string;
  orderItemCode: string;
  orderItemId: string;
  orderItemName: string;
  packageId: string;
  remarks: null | string;
  sortOrder: number;
}

export interface PackageView {
  enabled: boolean;
  id: string;
  items: PackageItemView[];
  ownerUserId: null | string;
  packageCode: string;
  packageName: string;
  packageType: null | string;
  remarks: null | string;
}

export interface TemplateSiteView {
  bodyPartId: string;
  bodyPartName: string;
}

export interface TemplateSummaryView {
  applicableSpecimenType: null | string;
  bodyParts: TemplateSiteView[];
  categoryId: string;
  enabled: boolean;
  id: string;
  splitPartCount: number;
  templateCode: string;
  templateName: string;
}

export interface TemplateDetailView extends TemplateSummaryView {
  templateContent: null | string;
}

export interface TemplateCategoryNode extends TreeNodeBase {
  categoryCode: string;
  categoryName: string;
  children: TemplateCategoryNode[];
  templates: TemplateSummaryView[];
}

export interface GuidelineSummaryView {
  categoryId: string;
  enabled: boolean;
  guidelineCode: string;
  guidelineName: string;
  id: string;
  versionNo: null | string;
}

export interface GuidelineDetailView extends GuidelineSummaryView {
  guidelineContent: null | string;
}

export interface GuidelineCategoryNode extends TreeNodeBase {
  categoryCode: string;
  categoryName: string;
  children: GuidelineCategoryNode[];
  guidelines: GuidelineSummaryView[];
}

export interface ConfigItemView {
  categoryId: string;
  configKey: string;
  configName: string;
  configValue: null | string;
  enabled: boolean;
  id: string;
  remarks: null | string;
  sortOrder: number;
  valueType: null | string;
}

export interface ConfigCategoryNode extends TreeNodeBase {
  categoryCode: string;
  categoryName: string;
  categoryType: null | string;
  children: ConfigCategoryNode[];
  items: ConfigItemView[];
}

export interface NumberingRuleView {
  bizType: string;
  createdAt: string;
  datePattern: null | string;
  enabled: boolean;
  id: string;
  prefixPattern: null | string;
  remarks: null | string;
  resetPolicy: string;
  ruleCode: string;
  scopeType: string;
  seqLength: number;
  updatedAt: string;
}

export interface CreateSystemUserRequest {
  avatar?: null | string;
  departmentId?: null | string;
  departmentName?: null | string;
  email?: null | string;
  enabled: boolean;
  jobNo?: null | string;
  loginName: string;
  loginTagCode?: null | string;
  name: string;
  password?: null | string;
  phone?: null | string;
  titleName?: null | string;
  userCode?: null | string;
}

export interface UpdateSystemUserRequest {
  avatar?: null | string;
  departmentId?: null | string;
  departmentName?: null | string;
  email?: null | string;
  enabled: boolean;
  jobNo?: null | string;
  loginTagCode?: null | string;
  name: string;
  phone?: null | string;
  titleName?: null | string;
  userCode?: null | string;
}

export interface AssignUserRoleItem {
  primary: boolean;
  roleId: string;
}

export interface CreateRoleRequest {
  dataScope?: null | string;
  enabled: boolean;
  remarks?: null | string;
  roleCode?: null | string;
  roleName: string;
  roleType?: null | string;
}

export type UpdateRoleRequest = CreateRoleRequest;

export interface UpdateRoleAuthorizationRequest {
  menuIds: string[];
  permissionIds: string[];
  statScopes: Record<string, string>;
  topicIds: string[];
}

export interface CreateBodyPartRequest {
  enabled: boolean;
  parentId?: null | string;
  partAlias?: null | string;
  partCode?: null | string;
  partLevel: number;
  partName: string;
  sortOrder: number;
}

export type UpdateBodyPartRequest = CreateBodyPartRequest;

export interface CreateDepartmentRequest {
  departmentCode?: null | string;
  departmentName: string;
  enabled: boolean;
  parentId?: null | string;
  sortOrder: number;
}

export type UpdateDepartmentRequest = CreateDepartmentRequest;

export interface CreateMedicalOrderCategoryRequest {
  categoryCode?: null | string;
  categoryName: string;
  enabled: boolean;
  parentId?: null | string;
  sortOrder: number;
}

export type UpdateMedicalOrderCategoryRequest =
  CreateMedicalOrderCategoryRequest;

export interface CreateMedicalOrderItemRequest {
  categoryId: string;
  defaultContent?: null | string;
  enabled: boolean;
  executionScope?: null | string;
  orderItemCode?: null | string;
  orderItemName: string;
  orderType?: null | string;
  sortOrder: number;
}

export type UpdateMedicalOrderItemRequest = CreateMedicalOrderItemRequest;

export interface ChargeItemPageQuery {
  enabled?: boolean;
  keyword?: null | string;
  orderDictItemId?: null | string;
  page: number;
  size: number;
}

export interface CreateChargeItemRequest {
  chargeItemCode?: null | string;
  chargeItemName: string;
  enabled: boolean;
  orderDictItemId: string;
  price: number;
  sortOrder: number;
  specification?: null | string;
  unit?: null | string;
}

export type UpdateChargeItemRequest = CreateChargeItemRequest;

export interface PackagePageQuery {
  enabled?: boolean;
  keyword?: null | string;
  packageType?: null | string;
  page: number;
  size: number;
}

export interface CreatePackageRequest {
  enabled: boolean;
  itemIds: string[];
  ownerUserId?: null | string;
  packageCode?: null | string;
  packageName: string;
  packageType?: null | string;
  remarks?: null | string;
}

export type UpdatePackageRequest = CreatePackageRequest;

export interface CreateTemplateCategoryRequest {
  categoryCode?: null | string;
  categoryName: string;
  enabled: boolean;
  parentId?: null | string;
  sortOrder: number;
}

export type UpdateTemplateCategoryRequest = CreateTemplateCategoryRequest;

export interface CreateTemplateRequest {
  applicableSpecimenType?: null | string;
  bodyPartIds: string[];
  categoryId: string;
  enabled: boolean;
  splitPartCount: number;
  templateCode?: null | string;
  templateContent?: null | string;
  templateName: string;
}

export type UpdateTemplateRequest = CreateTemplateRequest;

export interface CreateGuidelineCategoryRequest {
  categoryCode?: null | string;
  categoryName: string;
  enabled: boolean;
  parentId?: null | string;
  sortOrder: number;
}

export type UpdateGuidelineCategoryRequest = CreateGuidelineCategoryRequest;

export interface CreateGuidelineRequest {
  categoryId: string;
  enabled: boolean;
  guidelineCode?: null | string;
  guidelineContent?: null | string;
  guidelineName: string;
  versionNo?: null | string;
}

export type UpdateGuidelineRequest = CreateGuidelineRequest;

export interface CreateConfigCategoryRequest {
  categoryCode?: null | string;
  categoryName: string;
  categoryType?: null | string;
  enabled: boolean;
  parentId?: null | string;
  sortOrder: number;
}

export type UpdateConfigCategoryRequest = CreateConfigCategoryRequest;

export interface CreateConfigItemRequest {
  categoryId: string;
  configKey: string;
  configName: string;
  configValue?: null | string;
  enabled: boolean;
  remarks?: null | string;
  sortOrder: number;
  valueType?: null | string;
}

export interface UpdateConfigItemRequest {
  configValue?: null | string;
  enabled: boolean;
  remarks?: null | string;
}

export interface UpdateNumberingRuleRequest {
  datePattern?: null | string;
  enabled: boolean;
  prefixPattern?: null | string;
  remarks?: null | string;
  resetPolicy: string;
  scopeType: string;
  seqLength: number;
}

export interface PrintLoginTagResponse {
  content: string;
  loginTagCode: string;
  title: string;
}
