import { createApp, h, nextTick, watch } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockAccessStore, mockRoute, mockRouter, mockUserStore } = vi.hoisted(
  () => ({
    mockAccessStore: {
      accessCodes: [] as string[],
    },
    mockRoute: {
      query: {
        action: 'register',
        applicationId: 'APP-ID',
      } as Record<string, string>,
    },
    mockRouter: {
      push: vi.fn(),
      replace: vi.fn(),
    },
    mockUserStore: {
      userInfo: {
        realName: '测试用户',
        userId: 'USER-001',
      },
    },
  }),
);

const registerDialogProps = vi.hoisted(() => ({
  applicationId: '',
  modelValue: false,
}));

const workbenchPanelProps = vi.hoisted(() => ({
  lookupKeyword: '',
  lookupQueryType: '',
  lookupTriggerKey: 0,
}));

const reprintApplicationFormMock = vi.hoisted(() => vi.fn());
const warningMock = vi.hoisted(() => vi.fn());
const successMock = vi.hoisted(() => vi.fn());
const errorMock = vi.hoisted(() => vi.fn());

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    props: ['title'],
    template: '<div><slot /></div>',
  },
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
  useUserStore: () => mockUserStore,
}));

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<any>('element-plus');
  return {
    ...actual,
    ElMessage: {
      warning: warningMock,
      success: successMock,
      error: errorMock,
    },
  };
});

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    fixationLiquidTypes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: vi.fn(async () => ({
    clinicalSymptoms: [{ label: '肿物', value: '肿物' }],
    collectionModes: [{ label: '手术', value: 'SURGERY' }],
    containerNames: [{ label: '标本瓶', value: '标本瓶' }],
    fixationLiquidTypes: [{ label: '10% 中性福尔马林', value: 'FORMALIN' }],
    specimenTypes: [{ label: '常规', value: 'ROUTINE' }],
  })),
}));

vi.mock('#/modules/system-management/components/DepartmentSelect.vue', () => ({
  default: {
    props: ['modelValue', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock(
  '#/modules/system-management/components/ReferenceOptionSelect.vue',
  () => ({
    default: {
      props: ['modelValue', 'options', 'placeholder'],
      template: '<div />',
    },
  }),
);

vi.mock('#/modules/system-management/components/SystemUserSelect.vue', () => ({
  default: {
    props: ['modelValue', 'selectedLabel', 'placeholder'],
    template: '<div />',
  },
}));

vi.mock('../components/SpecimenRegisterDialog.vue', () => ({
  default: {
    props: ['applicationId', 'modelValue'],
    setup(props: { applicationId: string; modelValue: boolean }) {
      watch(
        () => [props.applicationId, props.modelValue] as const,
        ([applicationId, modelValue]) => {
          registerDialogProps.applicationId = applicationId;
          registerDialogProps.modelValue = modelValue;
        },
        { immediate: true },
      );
      return {};
    },
    template: '<div data-testid="register-dialog-proxy" />',
  },
}));

vi.mock('../components/ApplicationRegistrationWorkbenchPanel.vue', () => ({
  default: {
    props: ['lookupKeyword', 'lookupQueryType', 'lookupTriggerKey'],
    emits: ['reprint-application-form', 'save-workbench'],
    setup(
      props: {
        lookupKeyword: string;
        lookupQueryType: string;
        lookupTriggerKey: number;
      },
      { emit }: any,
    ) {
      watch(
        () =>
          [
            props.lookupKeyword,
            props.lookupQueryType,
            props.lookupTriggerKey,
          ] as const,
        ([lookupKeyword, lookupQueryType, lookupTriggerKey]) => {
          workbenchPanelProps.lookupKeyword = lookupKeyword;
          workbenchPanelProps.lookupQueryType = lookupQueryType;
          workbenchPanelProps.lookupTriggerKey = lookupTriggerKey;
        },
        { immediate: true },
      );
      return {
        emitReprintApplicationForm() {
          emit('reprint-application-form', {
            applicationId:
              props.lookupKeyword === 'MISSING'
                ? ''
                : props.lookupKeyword || 'APP-ID',
            record: {
              applicationId:
                props.lookupKeyword === 'MISSING'
                  ? ''
                  : props.lookupKeyword || 'APP-ID',
              contagiousSpecimen: {
                hepatitis: false,
                hiv: false,
                isolation: false,
                syphilis: false,
                tuberculosis: false,
              },
              gynecologyInfo: {
                additionalNotes: '补充说明',
                hpvResult: '阴性',
                lastMenstrualPeriod: '2026-05-01',
                menopause: false,
                previousCytology: '正常',
                previousTreatment: '无',
                specialConditions: {
                  abnormalBleeding: false,
                  birthControl: false,
                  hormoneReplacement: false,
                  hysterectomy: false,
                  iud: false,
                  lactation: false,
                  menopause: false,
                  other: '补充说明',
                  pregnancy: false,
                  radiotherapy: false,
                },
              },
              patientInfo: {
                age: '40',
                applicationDate: '2026-05-21 10:00:00',
                applicationNo: 'APP-001',
                applyDept: '外科',
                applyDoctor: '医生A',
                bedNo: '12床',
                checkItem: '检查项目',
                clinicalDiagnosis: '诊断',
                clinicalHistory: '病史',
                deliveryRequirement: '尽快送检',
                endoscopyDiagnosis: '内镜诊断',
                frozenReminder: false,
                gender: '女',
                idNo: 'P-001',
                imagingResult: '影像结果',
                inpatientNo: 'ZY001',
                patientName: '张三',
                patientVerified: false,
                phone: '13800000000',
                registrationStatus: '登记',
                remark: '备注',
                specimenType: '常规',
                wardName: '外科病区',
              },
              specimenItems: [
                {
                  id: 'item-1',
                  quantity: 1,
                  specimenName: '右侧肿物病灶',
                  specimenNo: '22498',
                  specimenSite: '骨颈',
                  status: '新增',
                },
              ],
              surgeryInfo: {
                buildingId: '惠侨楼',
                clinicalFindings: '术中所见',
                fixativeType: '福尔马林',
                fixationPerson: '周永康',
                fixationTime: '2026-05-27 11:07:02',
                roomId: '手术室一',
                surgeryName: '右侧肿瘤切除术',
              },
            },
          });
        },
      };
    },
    template:
      '<div data-testid="workbench-panel-proxy" :data-keyword="lookupKeyword" :data-query-type="lookupQueryType" :data-trigger="lookupTriggerKey"><button data-testid="reprint-application-button" type="button" @click="emitReprintApplicationForm">补打申请单</button></div>',
  },
}));

vi.mock('../api/specimen-workflow-service', () => ({
  completeFixation: vi.fn(),
  getApplicationDetail: vi.fn(async () => ({
    abnormalFlag: false,
    applicationDate: '2026-05-21',
    applicationFormStatus: 'PENDING',
    applicationNo: 'APP-001',
    applicationType: 'ROUTINE',
    clinicalDiagnosis: '诊断',
    clinicalSymptom: null,
    createdAt: '2026-05-21T10:00:00',
    currentNode: 'SPECIMEN_COLLECTION',
    externalOrderNo: null,
    id: 'APP-ID',
    patientAge: '40',
    patientGender: 'F',
    patientId: 'P-001',
    patientName: '张三',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '本院',
    specimenRemovalTime: '2026-05-21T09:30:00',
    specimenSite: '胸',
    specimens: [],
    status: 'SUBMITTED',
    submissionDate: '2026-05-21',
    submittingDepartmentId: 'DEP-1',
    submittingDepartmentName: '外科',
    submittingDoctorName: '医生A',
    submittingDoctorUserId: 'DOC-1',
    thirdPartySource: null,
    updatedAt: '2026-05-21T10:00:00',
  })),
  getLatestRegistrationResult: vi.fn(async () => ({
    applicationId: 'APP-ID',
    labelPrintBatchNo: null,
    labelPrintMessage: null,
    labelPrintSuccess: false,
    registrationSnapshot: null,
    specimens: [],
  })),
  listSpecimens: vi.fn(async () => ({
    items: [],
    page: 1,
    size: 20,
    summary: {
      abnormalCount: 0,
      labelPrintedCount: 0,
      pendingLabelCount: 0,
      totalCount: 0,
    },
    total: 0,
  })),
  reprintApplicationForm: reprintApplicationFormMock,
  retryLabelPrint: vi.fn(),
  startFixation: vi.fn(),
}));

import SpecimenManagementView from './SpecimenManagementView.vue';

describe('SpecimenManagementView', () => {
  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockRoute.query.applicationId = 'APP-ID';
    mockRoute.query.action = 'register';
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    registerDialogProps.applicationId = '';
    registerDialogProps.modelValue = false;
    workbenchPanelProps.lookupKeyword = '';
    workbenchPanelProps.lookupQueryType = '';
    workbenchPanelProps.lookupTriggerKey = 0;
    reprintApplicationFormMock.mockReset();
    warningMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('forwards route application id to the embedded workbench panel', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];

    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(SpecimenManagementView),
    });

    app.mount(root);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(workbenchPanelProps.lookupKeyword).toBe('APP-ID');
    expect(workbenchPanelProps.lookupQueryType).toBe('AUTO');
    expect(workbenchPanelProps.lookupTriggerKey).toBe(1);
    expect(document.body.textContent).toContain('工作台概览');
    expect(document.body.textContent).toContain('标本列表');
    expect(registerDialogProps.modelValue).toBe(false);

    app.unmount();
    root.remove();
  });

  it('opens print window when the panel requests reprint', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    const printWindowState = { html: '' };
    vi.spyOn(window, 'open').mockImplementation(() => {
      return {
        close: vi.fn(),
        document: {
          close: vi.fn(),
          open: vi.fn(),
          write: (html: string) => {
            printWindowState.html = html;
          },
        },
        focus: vi.fn(),
      } as any;
    });

    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(SpecimenManagementView),
    });

    app.mount(root);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="reprint-application-button"]',
      )!
      .click();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(printWindowState.html).toContain('补打申请单');
    expect(printWindowState.html).toContain('申请单号');
    expect(printWindowState.html).toContain('APP-001');
    expect(reprintApplicationFormMock).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain('兼容登记');

    app.unmount();
    root.remove();
  });

  it('uses application no fallback and warns when popup is blocked', async () => {
    mockAccessStore.accessCodes = [
      'PERM_APPLICATION_DETAIL_QUERY',
      'PERM_SPECIMEN_REGISTER',
    ];
    mockRoute.query.applicationId = 'MISSING';
    vi.spyOn(window, 'open').mockReturnValue(null);

    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () => h(SpecimenManagementView),
    });

    app.mount(root);
    await nextTick();
    await Promise.resolve();
    await nextTick();

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="reprint-application-button"]',
      )!
      .click();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(warningMock).toHaveBeenCalledWith(
      '打印窗口被浏览器拦截，请允许弹窗后重试',
    );
    expect(reprintApplicationFormMock).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });
});
