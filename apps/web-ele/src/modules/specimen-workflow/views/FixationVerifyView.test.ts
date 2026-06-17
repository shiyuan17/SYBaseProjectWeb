import type { SpecimenRemovalItem } from '../types/specimen-workflow';

import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import FixationVerifyView from './FixationVerifyView.vue';

const lookupApplicationRegistrationWorkbenchRecordMock = vi.hoisted(() =>
  vi.fn(),
);

const {
  confirmMock,
  confirmSpecimenRemovalByIdentifierMock,
  confirmSpecimenRemovalMock,
  getApplicationDetailMock,
  listOperatingBuildingOptionsMock,
  listSpecimensMock,
  listPendingSpecimenRemovalsMock,
  messageSuccessMock,
  messageWarningMock,
  mockRoute,
  resetMockRemovalRows,
} = vi.hoisted(() => {
  const createMockRemovalRows = (): SpecimenRemovalItem[] => [
    {
      abnormalFlag: false,
      applicationId: 'APP-PENDING',
      applicationNo: 'AP202605230001',
      barcode: 'SP-PENDING',
      confirmedAt: null,
      containerCount: 1,
      containerName: '福尔马林瓶',
      inpatientNo: 'ZYH-001',
      latestTrackingAt: '2026-05-23 12:44:44',
      patientGender: '女',
      patientId: 'uuid-patient-001',
      patientName: 'Alice',
      registeredAt: '2026-05-23 12:44:44',
      registeredByName: '周永坚',
      specimenId: 'SPEC-PENDING',
      specimenName: '右股骨骨髓',
      specimenNo: 'SP202605230001',
      specimenRemovalAt: null,
      specimenRemovalOperatorName: null,
      specimenStatus: 'REGISTERED',
      specimenType: '常规',
      surgeryName: 'OR-102',
      wardName: '妇科病区 3A',
    },
    {
      abnormalFlag: false,
      applicationId: 'APP-PENDING',
      applicationNo: 'AP202605230001',
      barcode: 'SP-SIBLING',
      confirmedAt: null,
      containerCount: 1,
      containerName: '福尔马林瓶',
      inpatientNo: 'ZYH-001',
      latestTrackingAt: '2026-05-23 12:45:44',
      patientGender: '女',
      patientId: 'uuid-patient-001',
      patientName: 'Alice',
      registeredAt: '2026-05-23 12:45:44',
      registeredByName: '周永坚',
      specimenId: 'SPEC-SIBLING',
      specimenName: '子宫肌瘤组织',
      specimenNo: 'SP202605230002',
      specimenRemovalAt: null,
      specimenRemovalOperatorName: null,
      specimenStatus: 'REGISTERED',
      specimenType: '常规',
      surgeryName: 'OR-102',
      wardName: '妇科病区 3A',
    },
  ];

  const mockRemovalRows = createMockRemovalRows();

  const resetMockRemovalRows = () => {
    mockRemovalRows.splice(
      0,
      mockRemovalRows.length,
      ...createMockRemovalRows(),
    );
  };

  const confirmRemoval = (
    identifier: string,
    lookup: 'barcode' | 'identifier',
  ) => {
    const targetRow = mockRemovalRows.find((row) =>
      lookup === 'barcode'
        ? row.barcode === identifier
        : row.barcode === identifier || row.specimenNo === identifier,
    );

    if (!targetRow) {
      throw new Error('未找到对应标本');
    }

    targetRow.confirmedAt = '2026-05-23T13:20:00';
    targetRow.latestTrackingAt = '2026-05-23T13:20:00';
    targetRow.specimenRemovalAt = '2026-05-23T13:20:00';
    targetRow.specimenRemovalOperatorName = 'Test User';

    return {
      barcode: targetRow.barcode,
      operatorName: 'Test User',
      specimenId: targetRow.specimenId,
      specimenRemovalAt: '2026-05-23T13:20:00',
    };
  };

  return {
    confirmMock: vi.fn(async () => 'confirm'),
    confirmSpecimenRemovalByIdentifierMock: vi.fn(async ({ identifier }) =>
      confirmRemoval(identifier, 'identifier'),
    ),
    confirmSpecimenRemovalMock: vi.fn(async ({ specimenBarcode }) =>
      confirmRemoval(specimenBarcode, 'barcode'),
    ),
    getApplicationDetailMock: vi.fn(async (applicationId?: string) => ({
      abnormalFlag: false,
      applicationDate: '2026-06-06',
      applicationFormStatus: 'IN_TRANSIT',
      applicationNo:
        applicationId === 'APP-PENDING' ? 'AP202605230001' : 'AP-LOOKUP-001',
      applicationType: 'ROUTINE',
      clinicalDiagnosis: null,
      clinicalSymptom: null,
      createdAt: '2026-06-06T00:00:00',
      currentNode: 'REMOVAL',
      deletable: false,
      editable: false,
      externalOrderNo: null,
      id: applicationId ?? 'APP-LOOKUP',
      operationDisabledReason: null,
      patientAge: '51',
      patientGender: '女',
      patientId: '1d857986-392a-4620-bc10-bf2c900001a8',
      patientName: '林晓芸',
      recentEvents: [],
      remarks: null,
      sourceHospitalId: null,
      sourceHospitalName: null,
      specimenRemovalTime: '2026-06-08 23:20:29',
      specimens: [],
      status: 'IN_TRANSIT',
      submissionDate: '2026-06-06',
      submittingDepartmentId: 'DEPT-GYN',
      submittingDepartmentName: '妇科',
      submittingDoctorName: '王丽',
      submittingDoctorUserId: 'DOC-001',
      thirdPartySource: null,
      updatedAt: '2026-06-08T23:20:29',
      voided: false,
    })),
    listOperatingBuildingOptionsMock: vi.fn(async () => [
      {
        buildingId: 'B001',
        buildingName: '惠侨楼',
        floors: 12,
        location: '北区',
        operatingRooms: [
          {
            buildingId: 'B001',
            cleanLevel: '百级',
            floor: 3,
            roomId: 'OR-102',
            roomName: '手术室 2',
            roomType: '洁净手术室',
          },
        ],
      },
    ]),
    listSpecimensMock: vi.fn(async (params: Record<string, unknown> = {}) => {
      const keyword =
        typeof params.keyword === 'string' ? params.keyword.trim() : '';
      const items = mockRemovalRows
        .filter((row) => {
          if (!keyword) {
            return true;
          }
          return [
            row.applicationNo,
            row.barcode,
            row.patientName,
            row.specimenName,
            row.specimenNo,
          ].some((value) => String(value ?? '').includes(keyword));
        })
        .map((row) => ({
          abnormalFlag: row.abnormalFlag,
          applicationId: row.applicationId,
          applicationNo: row.applicationNo,
          barcode: row.barcode,
          checkInStatus: null,
          checkedInAt: null,
          checkedInByName: null,
          containerCount: row.containerCount,
          containerName: row.containerName,
          fixationStatus: 'PENDING',
          labelPrintBatchNo: row.labelPrintBatchNo ?? null,
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: row.latestTrackingAt,
          patientGender: row.patientGender,
          patientId: row.patientId ?? null,
          patientName: row.patientName,
          recentNode: null,
          registeredAt: row.registeredAt,
          specimenConfirmedAt: null,
          specimenCount: 1,
          specimenId: row.specimenId,
          specimenName: row.specimenName,
          specimenNo: row.specimenNo,
          specimenRemovalAt: row.specimenRemovalAt,
          specimenRemovalOperatorName: row.specimenRemovalOperatorName,
          specimenSite: null,
          specimenStatus: row.specimenStatus,
          specimenType: row.specimenType,
          submittingDepartmentId: null,
          submittingDepartmentName: null,
          wardName: row.wardName ?? null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        }));

      return {
        items,
        page: 1,
        size: 100,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: items.length,
          pendingLabelCount: 0,
          totalCount: items.length,
        },
        total: items.length,
      };
    }),
    listPendingSpecimenRemovalsMock: vi.fn(
      async (params: Record<string, unknown> = {}) => {
        const applicationNo =
          typeof params.applicationNo === 'string' ? params.applicationNo : '';
        const keyword =
          typeof params.keyword === 'string' ? params.keyword.trim() : '';
        const items = mockRemovalRows
          .filter((row) => !row.specimenRemovalAt)
          .filter((row) => {
            if (applicationNo && row.applicationNo !== applicationNo) {
              return false;
            }
            if (!keyword) {
              return true;
            }
            return [
              row.applicationNo,
              row.barcode,
              row.patientName,
              row.specimenName,
              row.specimenNo,
            ].some((value) => String(value ?? '').includes(keyword));
          });

        return {
          items,
          page: 1,
          size: 20,
          summary: {
            abnormalCount: 0,
            confirmedCount: 0,
            pendingCount: items.length,
            totalCount: items.length,
          },
          total: items.length,
        };
      },
    ),
    messageSuccessMock: vi.fn(),
    messageWarningMock: vi.fn(),
    mockRoute: {
      query: {} as Record<string, string>,
    },
    resetMockRemovalRows,
  };
});

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: 'Test User',
      userId: 'USER-001',
    },
  }),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('../components/WorkflowSectionCard.vue', () => ({
  default: {
    props: ['title', 'description'],
    template:
      '<section><h2>{{ title }}</h2><p>{{ title ? description : "" }}</p><slot /></section>',
  },
}));

vi.mock('../components/FixationVerifyTable.vue', () => ({
  default: {
    emits: ['selectionChange'],
    props: [
      'actionLoading',
      'canConfirmRemoval',
      'formatRemovalStatus',
      'items',
      'loading',
      'page',
      'size',
    ],
    setup(props: any, { emit }: any) {
      const formatNullable = (value: unknown) =>
        value === null || value === undefined || value === '' ? '-' : String(value);
      const formatDateTime = (value: unknown) =>
        value === null || value === undefined || value === '' ? '-' : String(value);

      return () =>
        h('div', { 'data-testid': 'fixation-verify-table' }, [
          h(
            'div',
            '序号申请单标本编号姓名住院号病区性别手术间标本名称标本状态类型离体时间离体操作人添加时间添加人病人ID',
          ),
          ...(props.items ?? []).flatMap((row: any, index: number) => [
            h(
              'button',
              {
                'data-testid': `select-row-${index}`,
                disabled: !props.canConfirmRemoval(row),
                type: 'button',
                onClick: () => emit('selectionChange', [row]),
              },
              '选中',
            ),
            h(
              'div',
              { 'data-testid': `row-${index}` },
              [
                String(index + 1),
                row.applicationNo,
                row.specimenNo,
                formatNullable(row.patientName),
                formatNullable(row.inpatientNo),
                formatNullable(row.wardName),
                formatNullable(row.patientGender),
                formatNullable(row.surgeryName),
                formatNullable(row.specimenName),
                props.formatRemovalStatus(row),
                formatNullable(row.specimenType),
                formatDateTime(row.specimenRemovalAt),
                formatNullable(row.specimenRemovalOperatorName),
                formatDateTime(row.registeredAt),
                formatNullable(row.registeredByName),
                formatNullable(row.patientIdLabel),
              ].join(' '),
            ),
          ]),
        ]);
    },
  },
}));

vi.mock('element-plus', async () => {
  const actual =
    await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: messageSuccessMock, warning: messageWarningMock },
    ElMessageBox: { confirm: confirmMock },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  confirmSpecimenRemovalByIdentifier: confirmSpecimenRemovalByIdentifierMock,
  confirmSpecimenRemoval: confirmSpecimenRemovalMock,
  getApplicationDetail: getApplicationDetailMock,
  listSpecimens: listSpecimensMock,
  listPendingSpecimenRemovals: listPendingSpecimenRemovalsMock,
}));

lookupApplicationRegistrationWorkbenchRecordMock.mockImplementation(
  async ({ keyword }: { keyword: string }) => ({
      applicationId: keyword === 'AP202605230001' ? 'APP-PENDING' : 'APP-LOOKUP',
      contagiousSpecimen: {
        hepatitis: false,
        hiv: false,
        isolation: false,
        syphilis: false,
        tuberculosis: false,
      },
      gynecologyInfo: {
        additionalNotes: '',
        hpvResult: null,
        lastMenstrualPeriod: null,
        menopause: false,
        previousCytology: '',
        previousTreatment: '',
        specialConditions: {
          abnormalBleeding: false,
          birthControl: false,
          hormoneReplacement: false,
          hysterectomy: false,
          iud: false,
          lactation: false,
          menopause: false,
          other: '',
          pregnancy: false,
          radiotherapy: false,
        },
      },
      patientInfo: {
        age: '51',
        applicationDate: '2026-06-06',
        applicationNo: keyword,
        applyDept: '妇科',
        applyDoctor: '王丽',
        bedNo: '26床',
        checkItem: '妇科病理检查',
        clinicalDiagnosis: null,
        clinicalHistory: null,
        deliveryRequirement: null,
        endoscopyDiagnosis: null,
        frozenReminder: false,
        gender: '女',
        idNo: '08305',
        imagingResult: null,
        inpatientNo: 'ZY08305',
        patientName: '林晓芸',
        patientVerified: true,
        phone: '13800008305',
        registrationStatus: null,
        remark: null,
        specimenType: null,
        wardName: '妇科病区 3A',
      },
      specimenItems: [],
      surgeryInfo: {
        buildingId: null,
        clinicalFindings: null,
        fixativeType: null,
        fixationPerson: '病理科管理员',
        fixationTime: null,
        roomId: 'OR-102',
        surgeryName: '离体送检',
      },
    }),
);

vi.mock('../api/application-registration-workbench-service', () => ({
  listOperatingBuildingOptions: listOperatingBuildingOptionsMock,
  lookupApplicationRegistrationWorkbenchRecord:
    lookupApplicationRegistrationWorkbenchRecordMock,
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(FixationVerifyView),
  });

  app.directive('loading', {});
  app.mount(container);

  return { app, container };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

async function waitForViewAssertion(assertion: () => void) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await flushView();
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

describe('FixationVerifyView', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    mockRoute.query = {};
    resetMockRemovalRows();
    vi.clearAllMocks();
  });

  it('keeps the removal workbench empty by default', async () => {
    const { app, container } = mountView();
    await flushView();

    expect(listPendingSpecimenRemovalsMock).not.toHaveBeenCalled();
    expect(listSpecimensMock).not.toHaveBeenCalled();
    expect(container.textContent).toMatch(/全部\s*0/);

    app.unmount();
  });

  it('renders removal-centric content and actions', async () => {
    mockRoute.query = { applicationNo: 'AP202605230001' };
    const { app, container } = mountView();
    await waitForViewAssertion(() => {
      expect(container.textContent).toContain('SP202605230001');
    });

    const confirmButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('离体确认'),
    );
    expect(container.textContent).toContain('离体确认');
    expect(container.textContent).toContain('全部');
    expect(container.textContent).toContain('已离体');
    expect(container.textContent).toContain('未设置');
    expect(container.textContent).not.toContain('标本流水号');
    expect(container.textContent).not.toContain('申请单号');
    expect(container.textContent).not.toContain('送检科室');
    expect(container.textContent).not.toContain('登记日期');
    expect(container.textContent).not.toContain('查询');
    expect(container.textContent).not.toContain('重置');
    expect(container.textContent).toContain('清除列表');
    expect(container.textContent).toContain('标本编号');
    expect(container.textContent).toContain('离体时间');
    expect(container.textContent).toContain('离体操作人');
    expect(container.textContent).toContain('08305');
    expect(container.textContent).not.toContain('1d857986-392a-4620-bc10-bf2c900001a8');
    expect(container.textContent).toContain('妇科病区 3A');
    expect(container.textContent).not.toContain('开始核对');
    expect(container.textContent).not.toContain('完成核对');
    expect(container.textContent).not.toContain('开始核对');
    expect(container.textContent).not.toContain('完成核对');
    expect(confirmButtons).toHaveLength(1);
    expect(container.querySelector('[data-testid="select-row-0"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="select-row-1"]')).not.toBeNull();

    app.unmount();
  });

  it('confirms selected removals after submission', async () => {
    mockRoute.query = { applicationNo: 'AP202605230001' };
    const { app, container } = mountView();
    await waitForViewAssertion(() => {
      expect(container.textContent).toContain('SP202605230001');
    });

    const selectionButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="select-row-0"]',
    );
    selectionButton?.click();
    await flushView();

    const confirmButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('离体确认'),
    );

    confirmButton?.click();
    await flushView();

    expect(confirmMock).toHaveBeenCalledWith(
      '确认选中的 1 条标本已离体吗？',
      '离体确认',
      {
        cancelButtonText: '取消',
        confirmButtonText: '确认',
        type: 'warning',
      },
    );
    expect(confirmSpecimenRemovalMock).toHaveBeenCalledWith({
      remarks: '离体确认',
      specimenBarcode: 'SP-PENDING',
    });
    expect(listPendingSpecimenRemovalsMock).not.toHaveBeenCalled();
    expect(listSpecimensMock).toHaveBeenCalledWith({
      applicationNo: 'AP202605230001',
      page: 1,
      size: 500,
    });
    expect(messageSuccessMock).toHaveBeenCalledWith('已完成 1 条标本离体确认');
    expect(container.textContent).toContain('SP202605230001');
    expect(container.textContent).toContain('SP202605230002');
    expect(container.textContent).toContain('08305');
    expect(container.textContent).not.toContain('1d857986-392a-4620-bc10-bf2c900001a8');
    expect(container.textContent).toContain('妇科病区 3A');

    app.unmount();
  });

  it('confirms selected removal by specimen number when table row has no barcode', async () => {
    mockRoute.query = { applicationNo: 'AP202605230001' };
    listSpecimensMock.mockResolvedValueOnce({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-PENDING',
          applicationNo: 'AP202605230001',
          barcode: null,
          checkInStatus: null,
          checkedInAt: null,
          checkedInByName: null,
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationStatus: 'PENDING',
          labelPrintBatchNo: null,
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-23 12:44:44',
          patientName: 'Alice',
          recentNode: null,
          registeredAt: '2026-05-23 12:44:44',
          specimenConfirmedAt: null,
          specimenCount: 1,
          specimenId: 'SPEC-PENDING',
          specimenName: '右股骨骨髓',
          specimenNo: 'SP202605230001',
          specimenRemovalAt: null,
          specimenSite: null,
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          submittingDepartmentId: null,
          submittingDepartmentName: null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        },
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 1,
        pendingLabelCount: 0,
        totalCount: 1,
      },
      total: 1,
    } as any);
    const { app, container } = mountView();
    await waitForViewAssertion(() => {
      expect(container.textContent).toContain('SP202605230001');
    });

    const selectionButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="select-row-0"]',
    );
    selectionButton?.click();
    await flushView();

    const confirmButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('离体确认'),
    );

    confirmButton?.click();
    await flushView();

    expect(confirmSpecimenRemovalMock).not.toHaveBeenCalled();
    expect(confirmSpecimenRemovalByIdentifierMock).toHaveBeenCalledWith({
      identifier: 'SP202605230001',
      identifierType: 'SPECIMEN_NO',
      remarks: '离体确认',
    });
    expect(messageSuccessMock).toHaveBeenCalledWith(
      '已完成 1 条标本离体确认',
    );

    app.unmount();
  });

  it('disables batch confirm when no rows are selected', async () => {
    mockRoute.query = { applicationNo: 'AP202605230001' };
    const { app, container } = mountView();
    await waitForViewAssertion(() => {
      expect(container.textContent).toContain('SP202605230001');
    });

    const confirmButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('离体确认'),
    ) as HTMLButtonElement | undefined;

    expect(confirmButton?.disabled).toBe(true);

    app.unmount();
  });

  it('quick confirms by specimen number on enter and refocuses the input', async () => {
    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP202605230001';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(confirmSpecimenRemovalByIdentifierMock).toHaveBeenCalledWith({
      identifier: 'SP202605230001',
      identifierType: 'SPECIMEN_NO',
      remarks: '离体确认',
    });
    await waitForViewAssertion(() => {
      expect(listSpecimensMock).toHaveBeenCalledWith({
        applicationNo: 'AP202605230001',
        page: 1,
        size: 500,
      });
    });
    await waitForViewAssertion(() => {
      expect(messageSuccessMock).toHaveBeenCalledWith(
        '标本 SP202605230001 已完成离体确认',
      );
      expect(container.textContent).toContain('Test User');
    });
    expect(specimenIdInput!.value).toBe('');

    const clearListButton = [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('清除列表'),
    );
    clearListButton?.click();
    await waitForViewAssertion(() => {
      expect(container.textContent).not.toContain('SP202605230001');
      expect(container.textContent).not.toContain('SP202605230002');
    });

    app.unmount();
  });

  it('quick confirms by barcode on enter', async () => {
    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP-PENDING';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(confirmSpecimenRemovalByIdentifierMock).toHaveBeenCalledWith({
      identifier: 'SP-PENDING',
      identifierType: 'BARCODE',
      remarks: '离体确认',
    });
    await waitForViewAssertion(() => {
      expect(messageSuccessMock).toHaveBeenCalledWith(
        '标本 SP-PENDING 已完成离体确认',
      );
    });
    expect(specimenIdInput!.value).toBe('');

    app.unmount();
  });

  it('keeps quick confirm input when quick confirm fails', async () => {
    listSpecimensMock.mockResolvedValueOnce({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-DUPLICATE',
          applicationNo: 'AP202605239999',
          barcode: 'BC-DUPLICATE',
          checkInStatus: null,
          checkedInAt: null,
          checkedInByName: null,
          containerCount: 1,
          containerName: '福尔马林瓶',
          fixationStatus: 'PENDING',
          labelPrintBatchNo: null,
          labelPrintStatus: 'SUCCESS',
          latestTrackingAt: '2026-05-23 12:50:00',
          patientName: 'Alice',
          recentNode: null,
          registeredAt: '2026-05-23 12:49:00',
          specimenConfirmedAt: null,
          specimenCount: 1,
          specimenId: 'SPEC-DUPLICATE',
          specimenName: '腹部组织',
          specimenNo: 'SP-DUPLICATE',
          specimenRemovalAt: null,
          specimenSite: null,
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          submittingDepartmentId: null,
          submittingDepartmentName: null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        },
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 1,
        pendingLabelCount: 0,
        totalCount: 1,
      },
      total: 1,
    } as any);
    confirmSpecimenRemovalByIdentifierMock.mockRejectedValueOnce(
      new Error('标本条码/编号对应多条记录，无法自动确认'),
    );
    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP-DUPLICATE';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(confirmSpecimenRemovalByIdentifierMock).toHaveBeenCalledWith({
      identifier: 'SP-DUPLICATE',
      identifierType: 'SPECIMEN_NO',
      remarks: '离体确认',
    });
    expect(specimenIdInput!.value).toBe('SP-DUPLICATE');
    expect(container.textContent).toContain(
      '标本条码/编号对应多条记录，无法自动确认',
    );

    app.unmount();
  });

  it('does not submit quick confirm when specimen is already removed', async () => {
    confirmSpecimenRemovalByIdentifierMock.mockClear();
    listSpecimensMock
      .mockResolvedValueOnce({
        items: [
          {
            abnormalFlag: false,
            applicationId: 'APP-REMOVED',
            applicationNo: 'AP202606010006',
            barcode: 'BC-REMOVED',
            checkInStatus: null,
            checkedInAt: null,
            checkedInByName: null,
            containerCount: 1,
            containerName: '福尔马林瓶',
            fixationStatus: 'PENDING',
            labelPrintBatchNo: null,
            labelPrintStatus: 'SUCCESS',
            latestTrackingAt: '2026-06-01 13:52:01',
            patientName: 'Alice',
            recentNode: null,
            registeredAt: '2026-06-01 13:40:00',
            specimenConfirmedAt: '2026-06-01T13:45:00',
            specimenCount: 1,
            specimenId: 'SPEC-REMOVED',
            specimenName: '腹部皮肤活检',
            specimenNo: 'SP20260601006',
            specimenRemovalAt: '2026-06-01T13:50:00',
            specimenSite: null,
            specimenStatus: 'REGISTERED',
            specimenType: '常规',
            submittingDepartmentId: null,
            submittingDepartmentName: null,
            verificationCompletedAt: null,
            verificationStartedAt: null,
            verificationStatus: null,
          },
        ],
        page: 1,
        size: 100,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: 1,
          pendingLabelCount: 0,
          totalCount: 1,
        },
        total: 1,
      } as any)
      .mockResolvedValueOnce({
        items: [
          {
            abnormalFlag: false,
            applicationId: 'APP-REMOVED',
            applicationNo: 'AP202606010006',
            barcode: 'BC-REMOVED',
            checkInStatus: null,
            checkedInAt: null,
            checkedInByName: null,
            containerCount: 1,
            containerName: '福尔马林瓶',
            fixationStatus: 'PENDING',
            labelPrintBatchNo: null,
            labelPrintStatus: 'SUCCESS',
            latestTrackingAt: '2026-06-01 13:52:01',
            patientName: 'Alice',
            recentNode: null,
            registeredAt: '2026-06-01 13:40:00',
            specimenConfirmedAt: '2026-06-01T13:45:00',
            specimenCount: 1,
            specimenId: 'SPEC-REMOVED',
            specimenName: '腹部皮肤活检',
            specimenNo: 'SP20260601006',
            specimenRemovalAt: '2026-06-01T13:50:00',
            specimenSite: null,
            specimenStatus: 'REGISTERED',
            specimenType: '常规',
            submittingDepartmentId: null,
            submittingDepartmentName: null,
            verificationCompletedAt: null,
            verificationStartedAt: null,
            verificationStatus: null,
          },
          {
            abnormalFlag: false,
            applicationId: 'APP-REMOVED',
            applicationNo: 'AP202606010006',
            barcode: 'BC-REMOVED-SIBLING',
            checkInStatus: null,
            checkedInAt: null,
            checkedInByName: null,
            containerCount: 1,
            containerName: '福尔马林瓶',
            fixationStatus: 'PENDING',
            labelPrintBatchNo: null,
            labelPrintStatus: 'SUCCESS',
            latestTrackingAt: '2026-06-01 13:53:01',
            patientName: 'Alice',
            recentNode: null,
            registeredAt: '2026-06-01 13:41:00',
            specimenConfirmedAt: '2026-06-01T13:46:00',
            specimenCount: 1,
            specimenId: 'SPEC-REMOVED-SIBLING',
            specimenName: '胃窦黏膜',
            specimenNo: 'SP20260601007',
            specimenRemovalAt: null,
            specimenSite: null,
            specimenStatus: 'REGISTERED',
            specimenType: '常规',
            submittingDepartmentId: null,
            submittingDepartmentName: null,
            verificationCompletedAt: null,
            verificationStartedAt: null,
            verificationStatus: null,
          },
        ],
        page: 1,
        size: 500,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: 2,
          pendingLabelCount: 0,
          totalCount: 2,
        },
        total: 2,
      } as any);

    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP20260601006';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await waitForViewAssertion(() => {
      expect(listSpecimensMock).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'SP20260601006',
        }),
      );
      expect(confirmSpecimenRemovalByIdentifierMock).not.toHaveBeenCalled();
      expect(listSpecimensMock).toHaveBeenLastCalledWith({
        applicationNo: 'AP202606010006',
        page: 1,
        size: 500,
      });
      expect(messageWarningMock).toHaveBeenCalledWith(
        '标本 SP20260601006 已完成离体确认',
      );
    });

    expect(specimenIdInput!.value).toBe('SP20260601006');
    expect(container.textContent).toContain('SP20260601006');
    expect(container.textContent).toContain('SP20260601007');

    app.unmount();
  });

  it('does not submit quick confirm when specimen cannot be found', async () => {
    confirmSpecimenRemovalByIdentifierMock.mockClear();
    listSpecimensMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 0,
      },
      total: 0,
    } as any);

    const { app, container } = mountView();
    await flushView();

    const specimenIdInput = container.querySelector(
      'input[placeholder="请输入标本条码/编号后按回车确认"]',
    ) as HTMLInputElement | null;
    expect(specimenIdInput).not.toBeNull();

    specimenIdInput!.value = 'SP-NOT-FOUND';
    specimenIdInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenIdInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }),
    );
    await flushView();

    expect(listSpecimensMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'SP-NOT-FOUND',
      }),
    );
    expect(confirmSpecimenRemovalByIdentifierMock).not.toHaveBeenCalled();
    expect(messageWarningMock).toHaveBeenCalledWith(
      '未找到对应标本，请确认标本条码/编号是否正确',
    );
    expect(specimenIdInput!.value).toBe('SP-NOT-FOUND');

    app.unmount();
  });

  it('resolves legacy applicationId query into applicationNo before loading', async () => {
    mockRoute.query = { applicationId: 'APP-LOOKUP' };
    const { app } = mountView();
    await waitForViewAssertion(() => {
      expect(getApplicationDetailMock).toHaveBeenCalledWith('APP-LOOKUP');
      expect(listSpecimensMock).toHaveBeenCalled();
    });

    expect(getApplicationDetailMock).toHaveBeenCalledWith('APP-LOOKUP');
    expect(listSpecimensMock).toHaveBeenCalledWith({
      applicationNo: 'AP-LOOKUP-001',
      page: 1,
      size: 500,
    });

    app.unmount();
  });
});
