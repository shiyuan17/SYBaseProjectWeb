import { describe, expect, it } from 'vitest';

import {
  buildBodyPartSubmitPayload,
  buildChargeItemSubmitPayload,
  buildConfigCategorySubmitPayload,
  buildDepartmentSubmitPayload,
  buildGuidelineCategorySubmitPayload,
  buildGuidelineSubmitPayload,
  buildMedicalOrderCategorySubmitPayload,
  buildMedicalOrderItemSubmitPayload,
  buildPackageSubmitPayload,
  buildRoleSubmitPayload,
  buildSystemUserCreatePayload,
  buildSystemUserUpdatePayload,
  buildTemplateCategorySubmitPayload,
  buildTemplateSubmitPayload,
} from './submit-payloads';

describe('submit payload builders', () => {
  it('omits readonly code fields on create', () => {
    expect(
      buildDepartmentSubmitPayload(
        {
          departmentName: 'Pathology',
          enabled: true,
          parentId: '',
          sortOrder: 1,
        },
        'create',
      ),
    ).toEqual({
      departmentName: 'Pathology',
      enabled: true,
      parentId: null,
      sortOrder: 1,
    });

    expect(
      buildBodyPartSubmitPayload(
        {
          enabled: true,
          parentId: 'BP_ROOT',
          partAlias: '',
          partLevel: 2,
          partName: 'Stomach',
          sortOrder: 10,
        },
        'create',
      ),
    ).toEqual({
      enabled: true,
      parentId: 'BP_ROOT',
      partAlias: null,
      partLevel: 2,
      partName: 'Stomach',
      sortOrder: 10,
    });

    expect(
      buildRoleSubmitPayload(
        {
          dataScope: '',
          enabled: true,
          remarks: 'system role',
          roleName: 'Pathology Manager',
          roleType: '',
        },
        'create',
      ),
    ).toEqual({
      dataScope: null,
      enabled: true,
      remarks: 'system role',
      roleName: 'Pathology Manager',
      roleType: null,
    });

    expect(
      buildSystemUserCreatePayload({
        avatar: '',
        departmentId: 'DEPT_PATH',
        departmentName: 'Pathology',
        email: '',
        enabled: true,
        jobNo: 'JOB001',
        loginName: 'path-admin',
        name: 'Alice',
        password: '',
        phone: '13800000000',
        titleName: '',
      }),
    ).toEqual({
      avatar: null,
      departmentId: 'DEPT_PATH',
      departmentName: 'Pathology',
      email: null,
      enabled: true,
      jobNo: 'JOB001',
      loginName: 'path-admin',
      name: 'Alice',
      password: null,
      phone: '13800000000',
      titleName: null,
    });

    expect(
      buildMedicalOrderCategorySubmitPayload(
        {
          categoryName: 'Routine Orders',
          enabled: true,
          parentId: '',
          sortOrder: 3,
        },
        'create',
      ),
    ).toEqual({
      categoryName: 'Routine Orders',
      enabled: true,
      parentId: null,
      sortOrder: 3,
    });

    expect(
      buildMedicalOrderItemSubmitPayload(
        {
          categoryId: 'ODC_ROUTINE',
          defaultContent: '',
          enabled: true,
          executionScope: 'GLOBAL',
          orderItemName: 'HE Stain',
          orderType: '',
          sortOrder: 1,
        },
        'create',
      ),
    ).toEqual({
      categoryId: 'ODC_ROUTINE',
      defaultContent: null,
      enabled: true,
      executionScope: 'GLOBAL',
      orderItemName: 'HE Stain',
      orderType: null,
      sortOrder: 1,
    });

    expect(
      buildChargeItemSubmitPayload(
        {
          chargeItemName: 'HE Charge',
          enabled: true,
          orderDictItemId: 'ODI_HE',
          price: 35.5,
          sortOrder: 1,
          specification: 'box',
          unit: '',
        },
        'create',
      ),
    ).toEqual({
      chargeItemName: 'HE Charge',
      enabled: true,
      orderDictItemId: 'ODI_HE',
      price: 35.5,
      sortOrder: 1,
      specification: 'box',
      unit: null,
    });

    expect(
      buildPackageSubmitPayload(
        {
          enabled: true,
          itemIds: ['ODI_HE'],
          ownerUserId: '',
          packageName: 'Basic Package',
          packageType: 'PUBLIC',
          remarks: '',
        },
        'create',
      ),
    ).toEqual({
      enabled: true,
      itemIds: ['ODI_HE'],
      ownerUserId: null,
      packageName: 'Basic Package',
      packageType: 'PUBLIC',
      remarks: null,
    });

    expect(
      buildTemplateCategorySubmitPayload(
        {
          categoryName: 'Routine Templates',
          enabled: true,
          parentId: '',
          sortOrder: 2,
        },
        'create',
      ),
    ).toEqual({
      categoryName: 'Routine Templates',
      enabled: true,
      parentId: null,
      sortOrder: 2,
    });

    expect(
      buildTemplateSubmitPayload(
        {
          applicableSpecimenType: '',
          bodyPartIds: ['BP_STOMACH'],
          categoryId: 'STC_ROUTINE',
          enabled: true,
          splitPartCount: 2,
          templateContent: 'template content',
          templateName: 'Stomach Template',
        },
        'create',
      ),
    ).toEqual({
      applicableSpecimenType: null,
      bodyPartIds: ['BP_STOMACH'],
      categoryId: 'STC_ROUTINE',
      enabled: true,
      splitPartCount: 2,
      templateContent: 'template content',
      templateName: 'Stomach Template',
    });

    expect(
      buildGuidelineCategorySubmitPayload(
        {
          categoryName: 'Routine Guidelines',
          enabled: true,
          parentId: '',
          sortOrder: 4,
        },
        'create',
      ),
    ).toEqual({
      categoryName: 'Routine Guidelines',
      enabled: true,
      parentId: null,
      sortOrder: 4,
    });

    expect(
      buildGuidelineSubmitPayload(
        {
          categoryId: 'SGC_ROUTINE',
          enabled: true,
          guidelineContent: 'guideline content',
          guidelineName: 'Stomach Guideline',
          versionNo: '',
        },
        'create',
      ),
    ).toEqual({
      categoryId: 'SGC_ROUTINE',
      enabled: true,
      guidelineContent: 'guideline content',
      guidelineName: 'Stomach Guideline',
      versionNo: null,
    });

    expect(
      buildConfigCategorySubmitPayload(
        {
          categoryName: 'General Config',
          categoryType: 'BIZ',
          enabled: true,
          parentId: '',
          sortOrder: 1,
        },
        'create',
      ),
    ).toEqual({
      categoryName: 'General Config',
      categoryType: 'BIZ',
      enabled: true,
      parentId: null,
      sortOrder: 1,
    });
  });

  it('keeps readonly code fields null on edit', () => {
    expect(
      buildDepartmentSubmitPayload(
        {
          departmentName: 'Pathology',
          enabled: true,
          parentId: '',
          sortOrder: 1,
        },
        'edit',
      ),
    ).toMatchObject({ departmentCode: null });

    expect(
      buildBodyPartSubmitPayload(
        {
          enabled: true,
          parentId: 'BP_ROOT',
          partAlias: '',
          partLevel: 2,
          partName: 'Stomach',
          sortOrder: 10,
        },
        'edit',
      ),
    ).toMatchObject({ partCode: null });

    expect(
      buildRoleSubmitPayload(
        {
          dataScope: '',
          enabled: true,
          remarks: 'system role',
          roleName: 'Pathology Manager',
          roleType: '',
        },
        'edit',
      ),
    ).toMatchObject({ roleCode: null });

    expect(
      buildSystemUserUpdatePayload({
        avatar: '',
        departmentId: '',
        departmentName: '',
        email: 'demo@example.com',
        enabled: false,
        jobNo: '',
        name: 'Bob',
        phone: '',
        titleName: 'Chief',
      }),
    ).toMatchObject({
      loginTagCode: null,
      userCode: null,
    });

    expect(
      buildMedicalOrderCategorySubmitPayload(
        {
          categoryName: 'Routine Orders',
          enabled: true,
          parentId: '',
          sortOrder: 3,
        },
        'edit',
      ),
    ).toMatchObject({ categoryCode: null });

    expect(
      buildMedicalOrderItemSubmitPayload(
        {
          categoryId: 'ODC_ROUTINE',
          defaultContent: '',
          enabled: true,
          executionScope: 'GLOBAL',
          orderItemName: 'HE Stain',
          orderType: '',
          sortOrder: 1,
        },
        'edit',
      ),
    ).toMatchObject({ orderItemCode: null });

    expect(
      buildChargeItemSubmitPayload(
        {
          chargeItemName: 'HE Charge',
          enabled: true,
          orderDictItemId: 'ODI_HE',
          price: 35.5,
          sortOrder: 1,
          specification: 'box',
          unit: '',
        },
        'edit',
      ),
    ).toMatchObject({ chargeItemCode: null });

    expect(
      buildPackageSubmitPayload(
        {
          enabled: true,
          itemIds: ['ODI_HE'],
          ownerUserId: '',
          packageName: 'Basic Package',
          packageType: 'PUBLIC',
          remarks: '',
        },
        'edit',
      ),
    ).toMatchObject({ packageCode: null });

    expect(
      buildTemplateCategorySubmitPayload(
        {
          categoryName: 'Routine Templates',
          enabled: true,
          parentId: '',
          sortOrder: 2,
        },
        'edit',
      ),
    ).toMatchObject({ categoryCode: null });

    expect(
      buildTemplateSubmitPayload(
        {
          applicableSpecimenType: '',
          bodyPartIds: ['BP_STOMACH'],
          categoryId: 'STC_ROUTINE',
          enabled: true,
          splitPartCount: 2,
          templateContent: 'template content',
          templateName: 'Stomach Template',
        },
        'edit',
      ),
    ).toMatchObject({ templateCode: null });

    expect(
      buildGuidelineCategorySubmitPayload(
        {
          categoryName: 'Routine Guidelines',
          enabled: true,
          parentId: '',
          sortOrder: 4,
        },
        'edit',
      ),
    ).toMatchObject({ categoryCode: null });

    expect(
      buildGuidelineSubmitPayload(
        {
          categoryId: 'SGC_ROUTINE',
          enabled: true,
          guidelineContent: 'guideline content',
          guidelineName: 'Stomach Guideline',
          versionNo: '',
        },
        'edit',
      ),
    ).toMatchObject({ guidelineCode: null });

    expect(
      buildConfigCategorySubmitPayload(
        {
          categoryName: 'General Config',
          categoryType: 'BIZ',
          enabled: true,
          parentId: '',
          sortOrder: 1,
        },
        'edit',
      ),
    ).toMatchObject({ categoryCode: null });
  });

  it('keeps medical order dictionary selected code values in submit payloads', () => {
    expect(
      buildMedicalOrderItemSubmitPayload(
        {
          categoryId: 'ODC_ROUTINE',
          defaultContent: 'HE 染色',
          enabled: true,
          executionScope: 'TECHNICIAN',
          orderItemName: 'HE 染色',
          orderType: 'ROUTINE',
          sortOrder: 10,
        },
        'create',
      ),
    ).toMatchObject({
      categoryId: 'ODC_ROUTINE',
      executionScope: 'TECHNICIAN',
      orderType: 'ROUTINE',
    });
  });
});
