import type {
  CreateBodyPartRequest,
  CreateChargeItemRequest,
  CreateConfigCategoryRequest,
  CreateDepartmentRequest,
  CreateGuidelineCategoryRequest,
  CreateGuidelineRequest,
  CreateMedicalOrderCategoryRequest,
  CreateMedicalOrderItemRequest,
  CreatePackageRequest,
  CreateRoleRequest,
  CreateSystemUserRequest,
  CreateTemplateCategoryRequest,
  CreateTemplateRequest,
  UpdateBodyPartRequest,
  UpdateChargeItemRequest,
  UpdateConfigCategoryRequest,
  UpdateDepartmentRequest,
  UpdateGuidelineCategoryRequest,
  UpdateGuidelineRequest,
  UpdateMedicalOrderCategoryRequest,
  UpdateMedicalOrderItemRequest,
  UpdatePackageRequest,
  UpdateRoleRequest,
  UpdateSystemUserRequest,
  UpdateTemplateCategoryRequest,
  UpdateTemplateRequest,
} from '../types/system-management';

type StringLike = null | string | undefined;
type ReadonlyCodeMode = 'create' | 'edit';

function toNullableString(value: StringLike) {
  return value ? value : null;
}

function withReadonlyCodeField<T extends object, K extends string>(
  payload: T,
  codeField: K,
  mode: ReadonlyCodeMode,
): T | (T & Record<K, null>) {
  if (mode === 'create') {
    return payload;
  }

  return {
    ...payload,
    [codeField]: null,
  } as T & Record<K, null>;
}

export function buildDepartmentSubmitPayload(form: {
  departmentName: string;
  enabled: boolean;
  parentId?: StringLike;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateDepartmentRequest | UpdateDepartmentRequest {
  return withReadonlyCodeField(
    {
      departmentName: form.departmentName,
      enabled: form.enabled,
      parentId: toNullableString(form.parentId),
      sortOrder: form.sortOrder,
    },
    'departmentCode',
    mode,
  );
}

export function buildBodyPartSubmitPayload(form: {
  enabled: boolean;
  parentId?: StringLike;
  partAlias?: StringLike;
  partLevel: number;
  partName: string;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateBodyPartRequest | UpdateBodyPartRequest {
  return withReadonlyCodeField(
    {
      enabled: form.enabled,
      parentId: toNullableString(form.parentId),
      partAlias: toNullableString(form.partAlias),
      partLevel: form.partLevel,
      partName: form.partName,
      sortOrder: form.sortOrder,
    },
    'partCode',
    mode,
  );
}

export function buildRoleSubmitPayload(form: {
  dataScope?: StringLike;
  enabled: boolean;
  remarks?: StringLike;
  roleName: string;
  roleType?: StringLike;
}, mode: ReadonlyCodeMode): CreateRoleRequest | UpdateRoleRequest {
  return withReadonlyCodeField(
    {
      dataScope: toNullableString(form.dataScope),
      enabled: form.enabled,
      remarks: toNullableString(form.remarks),
      roleName: form.roleName,
      roleType: toNullableString(form.roleType),
    },
    'roleCode',
    mode,
  );
}

export function buildSystemUserCreatePayload(form: {
  avatar?: StringLike;
  departmentId?: StringLike;
  departmentName?: StringLike;
  email?: StringLike;
  enabled: boolean;
  jobNo?: StringLike;
  loginName: string;
  name: string;
  password?: StringLike;
  phone?: StringLike;
  titleName?: StringLike;
}): CreateSystemUserRequest {
  return {
    avatar: toNullableString(form.avatar),
    departmentId: toNullableString(form.departmentId),
    departmentName: toNullableString(form.departmentName),
    email: toNullableString(form.email),
    enabled: form.enabled,
    jobNo: toNullableString(form.jobNo),
    loginName: form.loginName,
    name: form.name,
    password: toNullableString(form.password),
    phone: toNullableString(form.phone),
    titleName: toNullableString(form.titleName),
  };
}

export function buildSystemUserUpdatePayload(form: {
  avatar?: StringLike;
  departmentId?: StringLike;
  departmentName?: StringLike;
  email?: StringLike;
  enabled: boolean;
  jobNo?: StringLike;
  name: string;
  phone?: StringLike;
  titleName?: StringLike;
}): UpdateSystemUserRequest {
  return {
    avatar: toNullableString(form.avatar),
    departmentId: toNullableString(form.departmentId),
    departmentName: toNullableString(form.departmentName),
    email: toNullableString(form.email),
    enabled: form.enabled,
    jobNo: toNullableString(form.jobNo),
    loginTagCode: null,
    name: form.name,
    phone: toNullableString(form.phone),
    titleName: toNullableString(form.titleName),
    userCode: null,
  };
}

export function buildMedicalOrderCategorySubmitPayload(form: {
  categoryName: string;
  enabled: boolean;
  parentId?: StringLike;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateMedicalOrderCategoryRequest | UpdateMedicalOrderCategoryRequest {
  return withReadonlyCodeField(
    {
      categoryName: form.categoryName,
      enabled: form.enabled,
      parentId: toNullableString(form.parentId),
      sortOrder: form.sortOrder,
    },
    'categoryCode',
    mode,
  );
}

export function buildMedicalOrderItemSubmitPayload(form: {
  categoryId: string;
  defaultContent?: StringLike;
  enabled: boolean;
  executionScope?: StringLike;
  orderItemName: string;
  orderType?: StringLike;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateMedicalOrderItemRequest | UpdateMedicalOrderItemRequest {
  return withReadonlyCodeField(
    {
      categoryId: form.categoryId,
      defaultContent: toNullableString(form.defaultContent),
      enabled: form.enabled,
      executionScope: toNullableString(form.executionScope),
      orderItemName: form.orderItemName,
      orderType: toNullableString(form.orderType),
      sortOrder: form.sortOrder,
    },
    'orderItemCode',
    mode,
  );
}

export function buildChargeItemSubmitPayload(form: {
  chargeItemName: string;
  enabled: boolean;
  orderDictItemId: string;
  price: number;
  sortOrder: number;
  specification?: StringLike;
  unit?: StringLike;
}, mode: ReadonlyCodeMode): CreateChargeItemRequest | UpdateChargeItemRequest {
  return withReadonlyCodeField(
    {
      chargeItemName: form.chargeItemName,
      enabled: form.enabled,
      orderDictItemId: form.orderDictItemId,
      price: form.price,
      sortOrder: form.sortOrder,
      specification: toNullableString(form.specification),
      unit: toNullableString(form.unit),
    },
    'chargeItemCode',
    mode,
  );
}

export function buildPackageSubmitPayload(form: {
  enabled: boolean;
  itemIds: string[];
  ownerUserId?: StringLike;
  packageName: string;
  packageType?: StringLike;
  remarks?: StringLike;
}, mode: ReadonlyCodeMode): CreatePackageRequest | UpdatePackageRequest {
  return withReadonlyCodeField(
    {
      enabled: form.enabled,
      itemIds: form.itemIds,
      ownerUserId: toNullableString(form.ownerUserId),
      packageName: form.packageName,
      packageType: toNullableString(form.packageType),
      remarks: toNullableString(form.remarks),
    },
    'packageCode',
    mode,
  );
}

export function buildTemplateCategorySubmitPayload(form: {
  categoryName: string;
  enabled: boolean;
  parentId?: StringLike;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateTemplateCategoryRequest | UpdateTemplateCategoryRequest {
  return withReadonlyCodeField(
    {
      categoryName: form.categoryName,
      enabled: form.enabled,
      parentId: toNullableString(form.parentId),
      sortOrder: form.sortOrder,
    },
    'categoryCode',
    mode,
  );
}

export function buildTemplateSubmitPayload(form: {
  applicableSpecimenType?: StringLike;
  bodyPartIds: string[];
  categoryId: string;
  enabled: boolean;
  splitPartCount: number;
  templateContent?: StringLike;
  templateName: string;
}, mode: ReadonlyCodeMode): CreateTemplateRequest | UpdateTemplateRequest {
  return withReadonlyCodeField(
    {
      applicableSpecimenType: toNullableString(form.applicableSpecimenType),
      bodyPartIds: form.bodyPartIds,
      categoryId: form.categoryId,
      enabled: form.enabled,
      splitPartCount: form.splitPartCount,
      templateContent: toNullableString(form.templateContent),
      templateName: form.templateName,
    },
    'templateCode',
    mode,
  );
}

export function buildGuidelineCategorySubmitPayload(form: {
  categoryName: string;
  enabled: boolean;
  parentId?: StringLike;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateGuidelineCategoryRequest | UpdateGuidelineCategoryRequest {
  return withReadonlyCodeField(
    {
      categoryName: form.categoryName,
      enabled: form.enabled,
      parentId: toNullableString(form.parentId),
      sortOrder: form.sortOrder,
    },
    'categoryCode',
    mode,
  );
}

export function buildGuidelineSubmitPayload(form: {
  categoryId: string;
  enabled: boolean;
  guidelineContent?: StringLike;
  guidelineName: string;
  versionNo?: StringLike;
}, mode: ReadonlyCodeMode): CreateGuidelineRequest | UpdateGuidelineRequest {
  return withReadonlyCodeField(
    {
      categoryId: form.categoryId,
      enabled: form.enabled,
      guidelineContent: toNullableString(form.guidelineContent),
      guidelineName: form.guidelineName,
      versionNo: toNullableString(form.versionNo),
    },
    'guidelineCode',
    mode,
  );
}

export function buildConfigCategorySubmitPayload(form: {
  categoryName: string;
  categoryType?: StringLike;
  enabled: boolean;
  parentId?: StringLike;
  sortOrder: number;
}, mode: ReadonlyCodeMode): CreateConfigCategoryRequest | UpdateConfigCategoryRequest {
  return withReadonlyCodeField(
    {
      categoryName: form.categoryName,
      categoryType: toNullableString(form.categoryType),
      enabled: form.enabled,
      parentId: toNullableString(form.parentId),
      sortOrder: form.sortOrder,
    },
    'categoryCode',
    mode,
  );
}
