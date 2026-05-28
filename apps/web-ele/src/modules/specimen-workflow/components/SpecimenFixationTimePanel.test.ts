import { createApp, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import SpecimenFixationTimePanel from './SpecimenFixationTimePanel.vue';

const {
  completeFixationMock,
  getApplicationDetailMock,
  listPendingFixationsMock,
  startFixationMock,
} = vi.hoisted(() => ({
  completeFixationMock: vi.fn(async () => ({
    barcode: 'BC-FIXING',
    fixationStatus: 'COMPLETED',
    specimenId: 'SPEC-FIXING',
  })),
  getApplicationDetailMock: vi.fn(async () => ({
    applicationNo: 'M2-001',
    currentNode: 'FIXATION',
    id: 'APP-PENDING',
    patientName: 'Alice',
    recentEvents: [],
    specimenRemovalTime: '2026-05-26 07:40:00',
    specimens: [],
    submissionDate: '2026-05-26',
  })),
  listPendingFixationsMock: vi.fn(async () => ({
    items: [
      {
        abnormalFlag: false,
        applicationId: 'APP-PENDING',
        applicationNo: 'M2-001',
        barcode: 'BC-PENDING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationCompletedAt: null,
        fixationLiquidType: null,
        fixationStartedAt: null,
        fixationStatus: 'PENDING',
        latestTrackingAt: '2026-05-26 08:00:00',
        patientName: 'Alice',
        registeredAt: '2026-05-26 08:00:00',
        specimenId: 'SPEC-PENDING',
        specimenNo: 'SP-001',
        specimenStatus: 'REGISTERED',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        transportOrderId: null,
        verificationCompletedAt: '2026-05-26 07:55:00',
        verificationStartedAt: '2026-05-26 07:50:00',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-FIXING',
        applicationNo: 'M2-002',
        barcode: 'BC-FIXING',
        containerCount: 1,
        containerName: 'Bottle',
        fixationCompletedAt: null,
        fixationLiquidType: '10%中性福尔马林',
        fixationStartedAt: '2026-05-26 08:30:00',
        fixationStatus: 'FIXING',
        latestTrackingAt: '2026-05-26 08:30:00',
        patientName: 'Bob',
        registeredAt: '2026-05-26 08:20:00',
        specimenId: 'SPEC-FIXING',
        specimenNo: 'SP-002',
        specimenStatus: 'FIXING',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        transportOrderId: null,
        verificationCompletedAt: '2026-05-26 08:18:00',
        verificationStartedAt: '2026-05-26 08:15:00',
        verificationStatus: 'VERIFIED',
      },
      {
        abnormalFlag: false,
        applicationId: 'APP-ANOMALY',
        applicationNo: 'M2-004',
        barcode: 'BC-ANOMALY',
        containerCount: 1,
        containerName: 'Bottle',
        fixationCompletedAt: null,
        fixationLiquidType: '酒精',
        fixationStartedAt: null,
        fixationStatus: 'FIXING',
        latestTrackingAt: '2026-05-26 08:45:00',
        patientName: 'Dora',
        registeredAt: '2026-05-26 08:25:00',
        specimenId: 'SPEC-ANOMALY',
        specimenNo: 'SP-004',
        specimenStatus: 'FIXING',
        submittingDepartmentId: 'DEPT-001',
        submittingDepartmentName: 'Surgery',
        transportOrderId: null,
        verificationCompletedAt: '2026-05-26 08:22:00',
        verificationStartedAt: '2026-05-26 08:21:00',
        verificationStatus: 'VERIFIED',
      },
    ],
    page: 1,
    size: 20,
    total: 3,
  })),
  startFixationMock: vi.fn(async () => ({
    barcode: 'BC-PENDING',
    fixationStatus: 'FIXING',
    specimenId: 'SPEC-PENDING',
  })),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
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

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'selectedLabel', 'placeholder'],
    emits: ['change', 'update:modelValue'],
    template: '<input :value="selectedLabel" />',
  },
}));

vi.mock('#/modules/system-management/components/ReferenceOptionSelect.vue', () => ({
  default: {
    props: ['modelValue', 'options', 'placeholder'],
    emits: ['update:modelValue'],
    template:
      '<input :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    fixationLiquidTypes: [],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: vi.fn(async () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    fixationLiquidTypes: [{ label: '10% 中性福尔马林', value: '10%中性福尔马林' }],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  })),
}));

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus');
  return {
    ...actual,
    ElMessage: { success: vi.fn(), warning: vi.fn() },
  };
});

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: completeFixationMock,
  getApplicationDetail: getApplicationDetailMock,
  listPendingFixations: listPendingFixationsMock,
  startFixation: startFixationMock,
}));

function mountView() {
  const container = document.createElement('div');
  document.body.append(container);
  const app = createApp({
    render: () => h(SpecimenFixationTimePanel),
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

describe('SpecimenFixationTimePanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders fixation columns, anomaly tag, and filters out unverified rows', async () => {
    const { app, container } = mountView();
    await flushView();

    expect(container.textContent).toContain('固定液类型');
    expect(container.textContent).toContain('开始固定时间');
    expect(container.textContent).toContain('完成固定时间');
    expect(container.textContent).toContain('离体时间');
    expect(container.textContent).toContain('时间异常');
    expect(container.textContent).toContain('10%中性福尔马林');

    const startButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('开始固定'),
    );
    const completeButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('完成固定'),
    );

    expect(startButtons).toHaveLength(1);
    expect(completeButtons).toHaveLength(2);

    app.unmount();
  });

  it('opens start fixation dialog and blocks submit without fixation liquid', async () => {
    const { app, container } = mountView();
    await flushView();

    const startButton = [...container.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('开始固定'),
    );

    startButton?.click();
    await flushView();

    expect(document.body.textContent).toContain('确认开始固定');

    const submitButton = [...document.body.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('确认开始固定'),
    );
    submitButton?.click();
    await flushView();

    expect(startFixationMock).not.toHaveBeenCalled();

    const fixationInput = document.body.querySelector(
      'input[placeholder="请选择或输入固定液"]',
    ) as HTMLInputElement | null;
    fixationInput!.value = '10%中性福尔马林';
    fixationInput!.dispatchEvent(new Event('input', { bubbles: true }));
    submitButton?.click();
    await flushView();

    expect(startFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: '10%中性福尔马林',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      remarks: null,
      specimenBarcode: 'BC-PENDING',
      terminalCode: null,
    });

    app.unmount();
  });

  it('forwards specimenNo when searching fixation list by specimen serial number', async () => {
    const { app, container } = mountView();
    await flushView();

    vi.clearAllMocks();

    const specimenNoInput = container.querySelector(
      'input[placeholder="请输入标本流水号"]',
    ) as HTMLInputElement | null;
    specimenNoInput!.value = 'SP-002';
    specimenNoInput!.dispatchEvent(new Event('input', { bubbles: true }));
    specimenNoInput!.dispatchEvent(
      new KeyboardEvent('keyup', { bubbles: true, code: 'Enter', key: 'Enter' }),
    );
    await flushView();

    expect(listPendingFixationsMock).toHaveBeenCalledWith(
      expect.objectContaining({ specimenNo: 'SP-002', verificationStatus: 'VERIFIED' }),
    );

    app.unmount();
  });

  it('opens complete fixation dialog and forwards fixation timing context', async () => {
    const { app, container } = mountView();
    await flushView();

    const completeButtons = [...container.querySelectorAll('button')].filter((button) =>
      button.textContent?.includes('完成固定'),
    );

    completeButtons[0]?.click();
    await flushView();

    expect(document.body.textContent).toContain('开始固定时间');
    expect(document.body.textContent).toContain('2026-05-26 08:30:00');

    const submitButton = [...document.body.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('确认完成固定'),
    );
    submitButton?.click();
    await flushView();

    expect(completeFixationMock).toHaveBeenCalledWith({
      fixationLiquidType: '10%中性福尔马林',
      operatorName: 'Test User',
      operatorUserId: 'USER-001',
      remarks: null,
      specimenBarcode: 'BC-FIXING',
      terminalCode: null,
    });

    app.unmount();
  });
});
