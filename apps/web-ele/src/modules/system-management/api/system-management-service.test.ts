import type { Mock } from 'vitest';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import * as service from './system-management-service';

vi.mock('#/api/request', () => ({
  requestClient: {
    delete: vi.fn(),
    download: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    request: vi.fn(),
    upload: vi.fn(),
  },
}));

type RequestClientMock = {
  delete: Mock;
  download: Mock;
  get: Mock;
  post: Mock;
  put: Mock;
  request: Mock;
  upload: Mock;
};

const requestClientMock = requestClient as unknown as RequestClientMock;

beforeEach(() => {
  requestClientMock.delete.mockReset();
  requestClientMock.download.mockReset();
  requestClientMock.get.mockReset();
  requestClientMock.post.mockReset();
  requestClientMock.put.mockReset();
  requestClientMock.request.mockReset();
  requestClientMock.upload.mockReset();
});

describe('system-management-service helpers', () => {
  it('normalizes array results to an empty array when payload is invalid', () => {
    expect(service.normalizeArrayResult([{ id: '1' }])).toEqual([{ id: '1' }]);
    expect(service.normalizeArrayResult(null)).toEqual([]);
    expect(service.normalizeArrayResult(undefined)).toEqual([]);
  });

  it('normalizes paged results with stable defaults', () => {
    expect(
      service.normalizePagedResult(
        {
          items: [{ id: '1' }],
          page: 3,
          size: 20,
          total: 99,
        },
        1,
        10,
      ),
    ).toEqual({
      items: [{ id: '1' }],
      page: 3,
      size: 20,
      total: 99,
    });

    expect(
      service.normalizePagedResult(
        {
          items: null as never,
          page: undefined as never,
          size: undefined as never,
          total: undefined as never,
        },
        2,
        50,
      ),
    ).toEqual({
      items: [],
      page: 2,
      size: 50,
      total: 0,
    });
  });
});

describe('system-management-service requests', () => {
  it('queries system users and login logs with stable pagination defaults', async () => {
    requestClientMock.get
      .mockResolvedValueOnce({
        items: [{ id: 'USER-1' }],
        page: 3,
        size: 20,
        total: 99,
      })
      .mockResolvedValueOnce({
        items: null,
        page: undefined,
        size: undefined,
        total: undefined,
      });

    await expect(
      service.listSystemUsers({
        enabled: true,
        keyword: 'pathology',
        page: 1,
        size: 20,
      }),
    ).resolves.toEqual({
      items: [{ id: 'USER-1' }],
      page: 3,
      size: 20,
      total: 99,
    });

    await expect(
      service.listUserLoginLogs('USER-1', { page: 2, size: 50 }),
    ).resolves.toEqual({
      items: [],
      page: 2,
      size: 50,
      total: 0,
    });

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/system-users',
      {
        params: {
          enabled: true,
          keyword: 'pathology',
          page: 1,
          size: 20,
        },
      },
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/system-users/USER-1/login-logs',
      {
        params: {
          page: 2,
          size: 50,
        },
      },
    );
  });

  it('posts system user lifecycle, import-export, and print endpoints', async () => {
    const file = new File(['userCode,loginName\n'], 'system-users.csv', {
      type: 'text/csv',
    });

    await service.createSystemUser({
      enabled: true,
      loginName: 'sys-user',
      name: 'System User',
      password: '123456',
    } as never);
    await service.updateSystemUser('USER-1', {
      enabled: true,
      name: 'Updated User',
      userCode: null,
    } as never);
    await service.updateSystemUserEnabled('USER-1', false);
    await service.assignSystemUserRoles('USER-1', [
      { primary: true, roleId: 'ROLE-1' },
    ] as never);
    await service.importSystemUsers(file);
    await service.exportSystemUsers({ enabled: true, keyword: 'sys-user' });
    await service.printSystemUserLoginTag('USER-1');

    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/system-users',
      {
        enabled: true,
        loginName: 'sys-user',
        name: 'System User',
        password: '123456',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/system-users/USER-1',
      {
        data: {
          enabled: true,
          name: 'Updated User',
          userCode: null,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/system-users/USER-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.put).toHaveBeenCalledWith(
      '/v1/system-users/USER-1/roles',
      {
        assignments: [{ primary: true, roleId: 'ROLE-1' }],
      },
    );
    expect(requestClientMock.upload).toHaveBeenCalledWith(
      '/v1/system-users/import',
      {
        file,
      },
    );
    expect(requestClientMock.download).toHaveBeenCalledWith(
      '/v1/system-users/export',
      {
        params: {
          enabled: true,
          keyword: 'sys-user',
        },
        responseReturn: 'body',
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/system-users/USER-1/print-login-tag',
    );
  });

  it('covers role authorization and lookup endpoints', async () => {
    requestClientMock.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        permissionIds: ['PERM_SYS_ROLE_QUERY'],
        roleId: 'ROLE-1',
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(null);

    await expect(service.listRoles()).resolves.toEqual([]);
    await expect(service.getRoleAuthorization('ROLE-1')).resolves.toEqual({
      permissionIds: ['PERM_SYS_ROLE_QUERY'],
      roleId: 'ROLE-1',
    });
    await expect(service.listMenus()).resolves.toEqual([]);
    await expect(service.listPermissions()).resolves.toEqual([]);
    await expect(service.listMessageTopics()).resolves.toEqual([]);
    await expect(service.listStatCategories()).resolves.toEqual([]);
    await expect(service.listBodyParts()).resolves.toEqual([]);

    await service.createRole({
      enabled: true,
      roleName: '病理科管理员',
    } as never);
    await service.updateRole('ROLE-1', {
      remarks: 'updated',
      roleName: '病理科管理员',
    } as never);
    await service.deleteRole('ROLE-1');
    await service.updateRoleAuthorization('ROLE-1', {
      menuIds: ['MENU_SYSTEM', 'MENU_SYS_ROLES'],
      permissionIds: ['PERM_SYS_ROLE_ASSIGN'],
      statScopes: {},
      topicIds: ['TOPIC-A'],
    } as never);

    expect(requestClientMock.get).toHaveBeenNthCalledWith(1, '/v1/roles');
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/roles/ROLE-1/authorizations',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(3, '/v1/menus');
    expect(requestClientMock.get).toHaveBeenNthCalledWith(4, '/v1/permissions');
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      5,
      '/v1/message-topics',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      6,
      '/v1/stat-categories',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(7, '/v1/body-parts');
    expect(requestClientMock.post).toHaveBeenCalledWith('/v1/roles', {
      enabled: true,
      roleName: '病理科管理员',
    });
    expect(requestClientMock.request).toHaveBeenCalledWith('/v1/roles/ROLE-1', {
      data: {
        remarks: 'updated',
        roleName: '病理科管理员',
      },
      method: 'PATCH',
    });
    expect(requestClientMock.delete).toHaveBeenCalledWith('/v1/roles/ROLE-1');
    expect(requestClientMock.put).toHaveBeenCalledWith(
      '/v1/roles/ROLE-1/authorizations',
      {
        menuIds: ['MENU_SYSTEM', 'MENU_SYS_ROLES'],
        permissionIds: ['PERM_SYS_ROLE_ASSIGN'],
        statScopes: {},
        topicIds: ['TOPIC-A'],
      },
    );
  });

  it('covers department and body-part endpoints', async () => {
    requestClientMock.get.mockResolvedValueOnce(null);

    await expect(service.listDepartments()).resolves.toEqual([]);

    await service.createDepartment({
      departmentName: 'Pathology',
      enabled: true,
      parentId: 'DEPT_ROOT',
    } as never);
    await service.updateDepartment('DEPT-1', {
      departmentCode: null,
      departmentName: 'Updated Pathology',
      enabled: true,
      parentId: 'DEPT_ROOT',
    } as never);
    await service.updateDepartmentEnabled('DEPT-1', false);
    await service.deleteDepartment('DEPT-1');

    await service.createBodyPart({
      enabled: true,
      parentId: 'BP_ROOT',
      partName: 'Lung',
    } as never);
    await service.updateBodyPart('BP-1', {
      enabled: true,
      parentId: 'BP_ROOT',
      partCode: null,
      partName: 'Updated Lung',
    } as never);
    await service.updateBodyPartEnabled('BP-1', false);
    await service.deleteBodyPart('BP-1');

    expect(requestClientMock.get).toHaveBeenCalledWith('/v1/departments');
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/departments',
      {
        departmentName: 'Pathology',
        enabled: true,
        parentId: 'DEPT_ROOT',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/departments/DEPT-1',
      {
        data: {
          departmentCode: null,
          departmentName: 'Updated Pathology',
          enabled: true,
          parentId: 'DEPT_ROOT',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/departments/DEPT-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      1,
      '/v1/departments/DEPT-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/body-parts',
      {
        enabled: true,
        parentId: 'BP_ROOT',
        partName: 'Lung',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      3,
      '/v1/body-parts/BP-1',
      {
        data: {
          enabled: true,
          parentId: 'BP_ROOT',
          partCode: null,
          partName: 'Updated Lung',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      4,
      '/v1/body-parts/BP-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      2,
      '/v1/body-parts/BP-1',
    );
  });

  it('covers medical-order dictionaries and charge-item endpoints', async () => {
    const chargeFile = new File(['chargeItemCode\n'], 'charges.csv', {
      type: 'text/csv',
    });

    requestClientMock.get.mockResolvedValueOnce(null).mockResolvedValueOnce({
      items: null,
      page: undefined,
      size: undefined,
      total: undefined,
    });

    await expect(service.listMedicalOrderDicts()).resolves.toEqual([]);
    await expect(
      service.listChargeItemsPage({
        orderDictItemId: 'ODI_HE',
        page: 1,
        size: 20,
      } as never),
    ).resolves.toEqual({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    await service.createMedicalOrderCategory({
      categoryName: 'Routine',
      enabled: true,
      sortOrder: 1,
    } as never);
    await service.updateMedicalOrderCategory('ODC-1', {
      categoryCode: null,
      categoryName: 'Updated Routine',
      enabled: true,
      sortOrder: 2,
    } as never);
    await service.deleteMedicalOrderCategory('ODC-1');

    await service.createMedicalOrderItem({
      categoryId: 'ODC-1',
      enabled: true,
      orderItemName: 'HE',
    } as never);
    await service.updateMedicalOrderItem('ODI-1', {
      enabled: true,
      orderItemCode: null,
      orderItemName: 'Updated HE',
    } as never);
    await service.updateMedicalOrderItemEnabled('ODI-1', false);
    await service.deleteMedicalOrderItem('ODI-1');

    await service.createChargeItem({
      chargeItemName: 'HE charge',
      enabled: true,
      orderDictItemId: 'ODI_HE',
      price: 35.5,
    } as never);
    await service.updateChargeItem('OCI-1', {
      chargeItemCode: null,
      chargeItemName: 'Updated HE charge',
      enabled: true,
      orderDictItemId: 'ODI_HE',
      price: 40,
    } as never);
    await service.updateChargeItemEnabled('OCI-1', false);
    await service.deleteChargeItem('OCI-1');
    await service.exportChargeItems({ enabled: true, keyword: 'HE' });
    await service.importChargeItems(chargeFile);

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-order-dicts',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-order-charge-items/page',
      {
        params: {
          orderDictItemId: 'ODI_HE',
          page: 1,
          size: 20,
        },
      },
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-order-dicts/categories',
      {
        categoryName: 'Routine',
        enabled: true,
        sortOrder: 1,
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-order-dicts/categories/ODC-1',
      {
        data: {
          categoryCode: null,
          categoryName: 'Updated Routine',
          enabled: true,
          sortOrder: 2,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-order-dicts/categories/ODC-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-order-dicts/items',
      {
        categoryId: 'ODC-1',
        enabled: true,
        orderItemName: 'HE',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-order-dicts/items/ODI-1',
      {
        data: {
          enabled: true,
          orderItemCode: null,
          orderItemName: 'Updated HE',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      3,
      '/v1/medical-order-dicts/items/ODI-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-order-dicts/items/ODI-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      3,
      '/v1/medical-order-charge-items',
      {
        chargeItemName: 'HE charge',
        enabled: true,
        orderDictItemId: 'ODI_HE',
        price: 35.5,
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      4,
      '/v1/medical-order-charge-items/OCI-1',
      {
        data: {
          chargeItemCode: null,
          chargeItemName: 'Updated HE charge',
          enabled: true,
          orderDictItemId: 'ODI_HE',
          price: 40,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      5,
      '/v1/medical-order-charge-items/OCI-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      3,
      '/v1/medical-order-charge-items/OCI-1',
    );
    expect(requestClientMock.download).toHaveBeenCalledWith(
      '/v1/medical-order-charge-items/export',
      {
        params: {
          enabled: true,
          keyword: 'HE',
        },
        responseReturn: 'body',
      },
    );
    expect(requestClientMock.upload).toHaveBeenCalledWith(
      '/v1/medical-order-charge-items/import',
      {
        file: chargeFile,
      },
    );
  });

  it('covers package endpoints with stable pagination defaults', async () => {
    requestClientMock.get.mockResolvedValueOnce({
      items: null,
      page: undefined,
      size: undefined,
      total: undefined,
    });

    await expect(
      service.listMedicalOrderPackagesPage({
        keyword: 'routine',
        page: 2,
        size: 50,
      } as never),
    ).resolves.toEqual({
      items: [],
      page: 2,
      size: 50,
      total: 0,
    });

    await service.createMedicalOrderPackage({
      enabled: true,
      itemIds: ['ODI_HE'],
      packageName: 'Routine package',
      packageType: 'PUBLIC',
    } as never);
    await service.updateMedicalOrderPackage('PKG-1', {
      enabled: true,
      itemIds: ['ODI_HE'],
      packageCode: null,
      packageName: 'Updated package',
      packageType: 'PUBLIC',
    } as never);
    await service.updateMedicalOrderPackageEnabled('PKG-1', false);
    await service.deleteMedicalOrderPackage('PKG-1');

    expect(requestClientMock.get).toHaveBeenCalledWith(
      '/v1/medical-order-packages/page',
      {
        params: {
          keyword: 'routine',
          page: 2,
          size: 50,
        },
      },
    );
    expect(requestClientMock.post).toHaveBeenCalledWith(
      '/v1/medical-order-packages',
      {
        enabled: true,
        itemIds: ['ODI_HE'],
        packageName: 'Routine package',
        packageType: 'PUBLIC',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/medical-order-packages/PKG-1',
      {
        data: {
          enabled: true,
          itemIds: ['ODI_HE'],
          packageCode: null,
          packageName: 'Updated package',
          packageType: 'PUBLIC',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/medical-order-packages/PKG-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenCalledWith(
      '/v1/medical-order-packages/PKG-1',
    );
  });

  it('covers sampling template endpoints', async () => {
    requestClientMock.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'ST-1', templateName: 'Routine template' });

    await expect(service.listSamplingTemplates()).resolves.toEqual([]);
    await expect(service.getSamplingTemplateDetail('ST-1')).resolves.toEqual({
      id: 'ST-1',
      templateName: 'Routine template',
    });

    await service.createSamplingTemplateCategory({
      categoryName: 'Routine templates',
      enabled: true,
    } as never);
    await service.updateSamplingTemplateCategory('STC-1', {
      categoryCode: null,
      categoryName: 'Updated templates',
      enabled: true,
    } as never);
    await service.deleteSamplingTemplateCategory('STC-1');

    await service.createSamplingTemplate({
      bodyPartIds: ['BP_STOMACH'],
      categoryId: 'STC-1',
      enabled: true,
      templateName: 'Routine template',
    } as never);
    await service.updateSamplingTemplate('ST-1', {
      bodyPartIds: ['BP_STOMACH'],
      categoryId: 'STC-1',
      enabled: true,
      templateCode: null,
      templateName: 'Updated template',
    } as never);
    await service.updateSamplingTemplateEnabled('ST-1', false);
    await service.deleteSamplingTemplate('ST-1');

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-templates',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-templates/ST-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-templates/categories',
      {
        categoryName: 'Routine templates',
        enabled: true,
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-templates/categories/STC-1',
      {
        data: {
          categoryCode: null,
          categoryName: 'Updated templates',
          enabled: true,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-templates/categories/STC-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-templates',
      {
        bodyPartIds: ['BP_STOMACH'],
        categoryId: 'STC-1',
        enabled: true,
        templateName: 'Routine template',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-templates/ST-1',
      {
        data: {
          bodyPartIds: ['BP_STOMACH'],
          categoryId: 'STC-1',
          enabled: true,
          templateCode: null,
          templateName: 'Updated template',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      3,
      '/v1/sampling-templates/ST-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-templates/ST-1',
    );
  });

  it('covers sampling guideline endpoints', async () => {
    requestClientMock.get.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'SG-1',
      guidelineName: 'Routine guideline',
    });

    await expect(service.listSamplingGuidelines()).resolves.toEqual([]);
    await expect(service.getSamplingGuidelineDetail('SG-1')).resolves.toEqual({
      guidelineName: 'Routine guideline',
      id: 'SG-1',
    });

    await service.createSamplingGuidelineCategory({
      categoryName: 'Routine guidelines',
      enabled: true,
    } as never);
    await service.updateSamplingGuidelineCategory('SGC-1', {
      categoryCode: null,
      categoryName: 'Updated guidelines',
      enabled: true,
    } as never);
    await service.deleteSamplingGuidelineCategory('SGC-1');

    await service.createSamplingGuideline({
      categoryId: 'SGC-1',
      enabled: true,
      guidelineName: 'Routine guideline',
    } as never);
    await service.updateSamplingGuideline('SG-1', {
      categoryId: 'SGC-1',
      enabled: true,
      guidelineCode: null,
      guidelineName: 'Updated guideline',
    } as never);
    await service.updateSamplingGuidelineEnabled('SG-1', false);
    await service.deleteSamplingGuideline('SG-1');

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-guidelines',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-guidelines/SG-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-guidelines/categories',
      {
        categoryName: 'Routine guidelines',
        enabled: true,
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-guidelines/categories/SGC-1',
      {
        data: {
          categoryCode: null,
          categoryName: 'Updated guidelines',
          enabled: true,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      1,
      '/v1/sampling-guidelines/categories/SGC-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-guidelines',
      {
        categoryId: 'SGC-1',
        enabled: true,
        guidelineName: 'Routine guideline',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-guidelines/SG-1',
      {
        data: {
          categoryId: 'SGC-1',
          enabled: true,
          guidelineCode: null,
          guidelineName: 'Updated guideline',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      3,
      '/v1/sampling-guidelines/SG-1/enabled',
      {
        data: {
          enabled: false,
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      2,
      '/v1/sampling-guidelines/SG-1',
    );
  });

  it('covers system-config and numbering-rule endpoints', async () => {
    requestClientMock.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(undefined);

    await expect(service.listSystemConfigs()).resolves.toEqual([]);
    await expect(service.listNumberingRules()).resolves.toEqual([]);

    await service.createSystemConfigCategory({
      categoryName: 'General',
      enabled: true,
      parentId: 'SCC_ROOT',
    } as never);
    await service.updateSystemConfigCategory('SCC-1', {
      categoryCode: null,
      categoryName: 'Updated general',
      enabled: true,
      parentId: 'SCC_ROOT',
    } as never);
    await service.deleteSystemConfigCategory('SCC-1');

    await service.createSystemConfigItem({
      categoryId: 'SCC-1',
      configKey: 'template.match',
      configValue: 'true',
      enabled: true,
    } as never);
    await service.updateSystemConfigItem('SCI-1', {
      configValue: 'false',
      enabled: true,
      remarks: 'updated',
    } as never);
    await service.deleteSystemConfigItem('SCI-1');

    await service.updateNumberingRule('NR-1', {
      datePattern: 'yyyyMMdd',
      enabled: true,
      prefixPattern: 'AP',
      resetPolicy: 'DAILY',
      scopeType: 'GLOBAL',
      seqLength: 4,
    } as never);

    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      1,
      '/v1/system-configs',
    );
    expect(requestClientMock.get).toHaveBeenNthCalledWith(
      2,
      '/v1/numbering-rules',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      1,
      '/v1/system-configs/categories',
      {
        categoryName: 'General',
        enabled: true,
        parentId: 'SCC_ROOT',
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      1,
      '/v1/system-configs/categories/SCC-1',
      {
        data: {
          categoryCode: null,
          categoryName: 'Updated general',
          enabled: true,
          parentId: 'SCC_ROOT',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      1,
      '/v1/system-configs/categories/SCC-1',
    );
    expect(requestClientMock.post).toHaveBeenNthCalledWith(
      2,
      '/v1/system-configs/items',
      {
        categoryId: 'SCC-1',
        configKey: 'template.match',
        configValue: 'true',
        enabled: true,
      },
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      2,
      '/v1/system-configs/items/SCI-1',
      {
        data: {
          configValue: 'false',
          enabled: true,
          remarks: 'updated',
        },
        method: 'PATCH',
      },
    );
    expect(requestClientMock.delete).toHaveBeenNthCalledWith(
      2,
      '/v1/system-configs/items/SCI-1',
    );
    expect(requestClientMock.request).toHaveBeenNthCalledWith(
      3,
      '/v1/numbering-rules/NR-1',
      {
        data: {
          datePattern: 'yyyyMMdd',
          enabled: true,
          prefixPattern: 'AP',
          resetPolicy: 'DAILY',
          scopeType: 'GLOBAL',
          seqLength: 4,
        },
        method: 'PATCH',
      },
    );
  });
});
