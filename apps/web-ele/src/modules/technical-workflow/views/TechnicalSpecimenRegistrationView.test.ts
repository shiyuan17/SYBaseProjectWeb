import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';

import type {
  PendingTechnicalSpecimenRegistrationItem,
  TechnicalSpecimenRegistrationWorkspace,
} from '../types/technical-workflow';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageError,
  messageSuccess,
  messageWarning,
  mockCompleteTechnicalSpecimenRegistration,
  mockDeleteTechnicalSpecimenRegistrationMediaAsset,
  mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
  mockGetTechnicalSpecimenRegistrationWorkspace,
  mockGoToTasks,
  mockListPendingTechnicalSpecimenRegistrations,
  mockRouter,
  mockSaveTechnicalSpecimenRegistrationDetailSections,
  mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  mockSaveTechnicalSpecimenRegistrationMaterials,
  mockUploadTechnicalSpecimenRegistrationMediaAsset,
} = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCompleteTechnicalSpecimenRegistration: vi.fn(),
  mockDeleteTechnicalSpecimenRegistrationMediaAsset: vi.fn(),
  mockGetTechnicalSpecimenRegistrationApplicationWorkbench: vi.fn(),
  mockGetTechnicalSpecimenRegistrationWorkspace: vi.fn(),
  mockGoToTasks: vi.fn(),
  mockListPendingTechnicalSpecimenRegistrations: vi.fn(),
  mockRouter: {
    push: vi.fn(),
  },
  mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo:
    vi.fn(),
  mockSaveTechnicalSpecimenRegistrationDetailSections: vi.fn(),
  mockSaveTechnicalSpecimenRegistrationMaterials: vi.fn(),
  mockUploadTechnicalSpecimenRegistrationMediaAsset: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    props: ['description', 'title'],
    setup(props, { slots }) {
      return () =>
        h('main', [
          h('h1', props.title),
          props.description ? h('p', props.description) : null,
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock('@vben/icons', async () => {
  const { h } = await import('vue');

  const createIcon = (name: string) =>
    (() => h('span', { 'aria-hidden': 'true', 'data-icon': name })) as unknown;

  return {
    UserRoundPen: createIcon('UserRoundPen'),
  };
});

vi.mock('../api/technical-workflow-service', () => ({
  completeTechnicalSpecimenRegistration:
    mockCompleteTechnicalSpecimenRegistration,
  deleteTechnicalSpecimenRegistrationMediaAsset:
    mockDeleteTechnicalSpecimenRegistrationMediaAsset,
  getTechnicalSpecimenRegistrationApplicationWorkbench:
    mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
  getTechnicalSpecimenRegistrationWorkspace:
    mockGetTechnicalSpecimenRegistrationWorkspace,
  listPendingTechnicalSpecimenRegistrations:
    mockListPendingTechnicalSpecimenRegistrations,
  saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo:
    mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  saveTechnicalSpecimenRegistrationDetailSections:
    mockSaveTechnicalSpecimenRegistrationDetailSections,
  saveTechnicalSpecimenRegistrationMaterials:
    mockSaveTechnicalSpecimenRegistrationMaterials,
  uploadTechnicalSpecimenRegistrationMediaAsset:
    mockUploadTechnicalSpecimenRegistrationMediaAsset,
}));

vi.mock('../utils/navigation', () => ({
  useTechnicalWorkflowNavigation: () => ({
    goToTasks: mockGoToTasks,
  }),
}));

vi.mock('element-plus', () => {
  const ElAlert = defineComponent({
    props: ['title'],
    setup(props) {
      return () => h('section', props.title);
    },
  });

  const ElButton = defineComponent({
    emits: ['click'],
    setup(_, { attrs, emit, slots }) {
      return () =>
        h(
          'button',
          {
            ...attrs,
            type: 'button',
            onClick: (event: MouseEvent) => emit('click', event),
          },
          slots.default?.(),
        );
    },
  });

  const ElEmpty = defineComponent({
    props: ['description'],
    setup(props) {
      return () => h('div', props.description);
    },
  });

  const ElInput = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          placeholder: props.placeholder,
          value: props.modelValue,
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).value,
            ),
        });
    },
  });

  const ElPagination = defineComponent({
    setup() {
      return () => h('nav');
    },
  });

  return {
    ElAlert,
    ElButton,
    ElEmpty,
    ElInput,
    ElMessage: {
      error: messageError,
      success: messageSuccess,
      warning: messageWarning,
    },
    ElPagination,
  };
});

vi.mock(
  '../components/specimen-registration/TechnicalSpecimenRegistrationApplicationSummaryCard.vue',
  () => ({
    default: defineComponent({
      props: ['error', 'loading', 'record', 'workspace'],
      emits: ['edit'],
      setup(props, { emit }) {
        return () =>
          h('section', { 'data-testid': 'application-summary-card' }, [
            h(
              'div',
              [
                props.record?.patientInfo?.applicationNo,
                props.workspace?.basicInfo?.pathologyNo,
                props.record?.patientInfo?.patientName,
              ]
                .filter(Boolean)
                .join('|'),
            ),
            h(
              'button',
              {
                'data-testid': 'open-application-drawer',
                onClick: () => emit('edit'),
                type: 'button',
              },
              '编辑申请',
            ),
          ]);
      },
    }),
  }),
);

vi.mock(
  '../components/specimen-registration/TechnicalSpecimenRegistrationApplicationDrawer.vue',
  () => ({
    default: defineComponent({
      props: ['error', 'loading', 'modelValue', 'pathologyNo', 'record', 'saving'],
      emits: ['save', 'update:modelValue', 'update:record'],
      setup(props, { emit }) {
        return () =>
          props.modelValue
            ? h('section', { 'data-testid': 'application-drawer' }, [
                h(
                  'div',
                  props.record?.patientInfo?.clinicalDiagnosis ?? 'EMPTY',
                ),
                h(
                  'button',
                  {
                    'data-testid': 'drawer-update-record',
                    onClick: () => {
                      if (!props.record) {
                        return;
                      }
                      emit('update:record', {
                        ...props.record,
                        patientInfo: {
                          ...props.record.patientInfo,
                          clinicalDiagnosis: '抽屉更新后的临床诊断',
                        },
                      });
                    },
                    type: 'button',
                  },
                  '更新申请记录',
                ),
                h(
                  'button',
                  {
                    'data-testid': 'drawer-save-record',
                    onClick: () => emit('save'),
                    type: 'button',
                  },
                  '保存申请信息',
                ),
              ])
            : null;
      },
    }),
  }),
);

import TechnicalSpecimenRegistrationView from './TechnicalSpecimenRegistrationView.vue';

function createPendingItem(
  overrides: Partial<PendingTechnicalSpecimenRegistrationItem> = {},
): PendingTechnicalSpecimenRegistrationItem {
  return {
    applicationId: 'APP-1',
    applicationNo: 'APP-20260601-001',
    applicationType: 'ROUTINE',
    caseId: 'CASE-1',
    checkItem: 'HE',
    inpatientNo: 'INP-1',
    pathologyNo: 'BL-20260601-001',
    patientId: 'P-001',
    patientName: '患者甲',
    receivedAt: '2026-06-01T08:00:00',
    registeredAt: null,
    registeredByName: null,
    registrationStatus: 'PENDING',
    submittingDepartmentName: '病理科',
    ...overrides,
  };
}

function createWorkspace(
  overrides: Partial<TechnicalSpecimenRegistrationWorkspace> = {},
): TechnicalSpecimenRegistrationWorkspace {
  return {
    actionFlags: {
      canCompleteRegistration: true,
      canDeleteMediaAssets: true,
      canSaveDetailSections: true,
      canSaveMaterials: true,
      canUploadMediaAssets: true,
    },
    basicInfo: {
      applicationNo: 'APP-20260601-001',
      applicationType: 'ROUTINE',
      fixationTime: '2026-06-01T09:00:00',
      inpatientNo: 'INP-1',
      pathologyNo: 'BL-20260601-001',
      patientAge: '34',
      patientGender: '女',
      patientId: 'P-001',
      patientName: '患者甲',
      registrationStatus: 'PENDING',
      specimenRemovalTime: '2026-06-01T07:30:00',
      submissionDate: '2026-06-01',
      submittingDepartmentName: '病理科',
      submittingDoctorName: '医生甲',
    },
    checkItems: [{ name: 'HE', sequenceNo: 1 }],
    detailSections: {
      clinicalExaminationAndSurgeryFindings: '默认临床检查及手术所见',
      clinicalSubmissionRequirements: '默认临床送检要求',
      externalPathologyDiagnosis: null,
      historySummary: '默认病史摘要内容',
      infectiousAndPastHistorySummary: '默认传染/既往信息摘要',
      labAndImagingExaminations: '默认检验和影像检查',
    },
    materials: [
      {
        sequenceNo: 1,
        sourcePart: '胃',
        specimenId: 'SP-1',
        specimenName: '组织块',
        specimenType: 'ROUTINE',
      },
    ],
    mediaAssets: [],
    pendingSummary: createPendingItem(),
    ...overrides,
  };
}

function createApplicationWorkbenchRecord(
  overrides: Partial<ApplicationRegistrationWorkbenchRecord> = {},
): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: 'APP-1',
    contagiousSpecimen: {
      hepatitis: false,
      hiv: false,
      isolation: false,
      syphilis: false,
      tuberculosis: false,
    },
    gynecologyInfo: {
      additionalNotes: '',
      hpvResult: '',
      lastMenstrualPeriod: '',
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
      age: '34',
      applicationDate: '2026-06-01T08:00:00',
      applicationNo: 'APP-20260601-001',
      applyDept: '病理科',
      applyDoctor: '医生甲',
      bedNo: '',
      checkItem: 'HE',
      clinicalDiagnosis: '初始临床诊断',
      clinicalHistory: '',
      deliveryRequirement: '',
      endoscopyDiagnosis: '',
      frozenReminder: false,
      gender: '女',
      idNo: 'ID-001',
      imagingResult: '',
      inpatientNo: 'INP-1',
      patientName: '患者甲',
      patientVerified: false,
      phone: '',
      registrationStatus: 'PENDING',
      remark: '',
      specimenType: 'ROUTINE',
      wardName: '',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: 'BLDG-1',
      clinicalFindings: '',
      fixativeType: '',
      fixationPerson: '',
      fixationTime: '2026-06-01T09:00:00',
      roomId: 'OR-01',
      specimenRemovalTime: '2026-06-01T07:30:00',
      surgeryName: '',
    },
    ...overrides,
  };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

function findButton(text: string) {
  const button = [...document.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === text,
  );
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
}

function mountView() {
  const root = document.createElement('div');
  document.body.append(root);

  const app = createApp({
    render: () => h(TechnicalSpecimenRegistrationView),
  });

  app.mount(root);
  return { app, root };
}

describe('TechnicalSpecimenRegistrationView', () => {
  let workspaceByCaseId: Record<string, TechnicalSpecimenRegistrationWorkspace>;
  let workbenchByCaseId: Record<string, ApplicationRegistrationWorkbenchRecord>;

  beforeEach(() => {
    workspaceByCaseId = {
      'CASE-1': createWorkspace(),
      'CASE-2': createWorkspace({
        basicInfo: {
          ...createWorkspace().basicInfo,
          pathologyNo: 'BL-20260601-002',
          patientName: '患者乙',
        },
        mediaAssets: [
          {
            assetId: 'ASSET-1',
            capturedAt: '2026-06-01T10:00:00',
            fileName: 'photo-1.jpg',
            fileUrl: '/photo-1.jpg',
          },
        ],
        pendingSummary: createPendingItem({
          caseId: 'CASE-2',
          pathologyNo: 'BL-20260601-002',
          patientName: '患者乙',
        }),
      }),
    };
    workbenchByCaseId = {
      'CASE-1': createApplicationWorkbenchRecord(),
      'CASE-2': createApplicationWorkbenchRecord({
        applicationId: 'APP-2',
        patientInfo: {
          ...createApplicationWorkbenchRecord().patientInfo,
          applicationNo: 'APP-20260601-002',
          clinicalDiagnosis: '患者乙临床诊断',
          inpatientNo: 'INP-2',
          patientName: '患者乙',
        },
      }),
    };

    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValue({
      items: [
        createPendingItem({
          caseId: 'CASE-1',
          pathologyNo: 'BL-20260601-001',
        }),
        createPendingItem({
          caseId: 'CASE-2',
          pathologyNo: 'BL-20260601-002',
          patientName: '患者乙',
        }),
      ],
      page: 1,
      size: 20,
      total: 2,
    });
    mockGetTechnicalSpecimenRegistrationWorkspace.mockImplementation(
      async (caseId: string) => workspaceByCaseId[caseId],
    );
    mockGetTechnicalSpecimenRegistrationApplicationWorkbench.mockImplementation(
      async (caseId: string) => workbenchByCaseId[caseId],
    );
    mockSaveTechnicalSpecimenRegistrationDetailSections.mockImplementation(
      async (
        _caseId: string,
        data: {
          detailSections: TechnicalSpecimenRegistrationWorkspace['detailSections'];
        },
      ) => {
        const currentWorkspace = workspaceByCaseId['CASE-1']!;
        const fallbackDetailSections = createWorkspace().detailSections;
        const nextWorkspace = {
          ...currentWorkspace,
          detailSections: {
            clinicalExaminationAndSurgeryFindings:
              data.detailSections.clinicalExaminationAndSurgeryFindings ??
              fallbackDetailSections.clinicalExaminationAndSurgeryFindings,
            clinicalSubmissionRequirements:
              data.detailSections.clinicalSubmissionRequirements ??
              fallbackDetailSections.clinicalSubmissionRequirements,
            externalPathologyDiagnosis:
              data.detailSections.externalPathologyDiagnosis ?? null,
            historySummary:
              data.detailSections.historySummary ??
              fallbackDetailSections.historySummary,
            infectiousAndPastHistorySummary:
              data.detailSections.infectiousAndPastHistorySummary ??
              fallbackDetailSections.infectiousAndPastHistorySummary,
            labAndImagingExaminations:
              data.detailSections.labAndImagingExaminations ??
              fallbackDetailSections.labAndImagingExaminations,
          },
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        workspaceByCaseId['CASE-1'] = nextWorkspace;
        return nextWorkspace;
      },
    );
    mockSaveTechnicalSpecimenRegistrationMaterials.mockImplementation(
      async (_caseId: string, data: { materials: TechnicalSpecimenRegistrationWorkspace['materials'] }) => {
        const currentWorkspace = workspaceByCaseId['CASE-1']!;
        const nextWorkspace = {
          ...currentWorkspace,
          materials: data.materials.map((item, index) => ({
            sequenceNo: index + 1,
            sourcePart: item.sourcePart ?? null,
            specimenId: item.specimenId ?? `NEW-${index + 1}`,
            specimenName: item.specimenName ?? null,
            specimenType: item.specimenType ?? null,
          })),
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        workspaceByCaseId['CASE-1'] = nextWorkspace;
        return nextWorkspace;
      },
    );
    mockUploadTechnicalSpecimenRegistrationMediaAsset.mockImplementation(
      async () => {
        const currentWorkspace = workspaceByCaseId['CASE-1']!;
        workspaceByCaseId['CASE-1'] = {
          ...currentWorkspace,
          mediaAssets: [
            {
              assetId: 'ASSET-UPLOADED',
              capturedAt: '2026-06-01T11:00:00',
              fileName: 'upload.jpg',
              fileUrl: '/upload.jpg',
            },
          ],
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        return workspaceByCaseId['CASE-1']!.mediaAssets[0]!;
      },
    );
    mockDeleteTechnicalSpecimenRegistrationMediaAsset.mockImplementation(
      async () => {
        const currentWorkspace = workspaceByCaseId['CASE-1']!;
        workspaceByCaseId['CASE-1'] = {
          ...currentWorkspace,
          mediaAssets: [],
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        return { assetId: 'ASSET-UPLOADED', deleted: true };
      },
    );
    mockCompleteTechnicalSpecimenRegistration.mockResolvedValue({
      caseId: 'CASE-1',
      grossingTaskCreated: true,
      pathologyNo: 'BL-20260601-001',
      registrationStatus: 'COMPLETED',
    });
    mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo.mockImplementation(
      async (_caseId: string, data: { patientInfo: { clinicalDiagnosis: string } }) => {
        const currentRecord = workbenchByCaseId['CASE-1']!;
        const nextRecord = {
          ...currentRecord,
          patientInfo: {
            ...currentRecord.patientInfo,
            ...data.patientInfo,
          },
        } satisfies ApplicationRegistrationWorkbenchRecord;
        workbenchByCaseId['CASE-1'] = nextRecord;
        return nextRecord;
      },
    );
    mockGoToTasks.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockCompleteTechnicalSpecimenRegistration.mockReset();
    mockDeleteTechnicalSpecimenRegistrationMediaAsset.mockReset();
    mockGetTechnicalSpecimenRegistrationApplicationWorkbench.mockReset();
    mockGetTechnicalSpecimenRegistrationWorkspace.mockReset();
    mockGoToTasks.mockReset();
    mockListPendingTechnicalSpecimenRegistrations.mockReset();
    mockRouter.push.mockReset();
    mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo.mockReset();
    mockSaveTechnicalSpecimenRegistrationDetailSections.mockReset();
    mockSaveTechnicalSpecimenRegistrationMaterials.mockReset();
    mockUploadTechnicalSpecimenRegistrationMediaAsset.mockReset();
    messageError.mockReset();
    messageSuccess.mockReset();
    messageWarning.mockReset();
    document.body.innerHTML = '';
  });

  it('renders the three-column workbench and loads pending registrations on mount', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('接收列表');
    expect(document.body.textContent).toContain('登记工作区');
    expect(document.body.textContent).toContain('APP-20260601-001');
    expect(mockListPendingTechnicalSpecimenRegistrations).toHaveBeenCalledWith({
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      size: 20,
    });
    expect(mockGetTechnicalSpecimenRegistrationWorkspace).toHaveBeenCalledWith(
      'CASE-1',
    );
    expect(
      mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
    ).toHaveBeenCalledWith('CASE-1');

    app.unmount();
    root.remove();
  });

  it('refreshes the workspace when selecting a different case', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="specimen-row-CASE-2"]')
      ?.click();
    await flushView();

    expect(mockGetTechnicalSpecimenRegistrationWorkspace).toHaveBeenCalledWith(
      'CASE-2',
    );
    expect(
      mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
    ).toHaveBeenCalledWith('CASE-2');
    expect(document.body.textContent).toContain('患者乙');

    app.unmount();
    root.remove();
  });

  it('shows the hover edit button and saves an edited detail section', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="detail-section-edit-historySummary"]',
      )
      ?.click();
    await flushView();

    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="detail-section-input-historySummary"]',
    );
    expect(textarea).toBeTruthy();
    textarea!.value = '更新后的病史摘要';
    textarea!.dispatchEvent(new Event('input'));
    await flushView();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="detail-section-save-historySummary"]',
      )
      ?.click();
    await flushView();

    expect(
      mockSaveTechnicalSpecimenRegistrationDetailSections,
    ).toHaveBeenCalledWith('CASE-1', {
      detailSections: {
        clinicalExaminationAndSurgeryFindings: '默认临床检查及手术所见',
        clinicalSubmissionRequirements: '默认临床送检要求',
        externalPathologyDiagnosis: null,
        historySummary: '更新后的病史摘要',
        infectiousAndPastHistorySummary: '默认传染/既往信息摘要',
        labAndImagingExaminations: '默认检验和影像检查',
      },
      terminalCode: 'T-M3-SPEC-REG',
    });
    expect(document.body.textContent).toContain('更新后的病史摘要');

    app.unmount();
    root.remove();
  });

  it('supports entering detail section editing through double click', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLElement>(
        '[data-testid="detail-section-value-historySummary"]',
      )
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushView();

    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="detail-section-input-historySummary"]',
    );
    expect(textarea).toBeTruthy();

    app.unmount();
    root.remove();
  });

  it('falls back to the original value when saving an empty detail section', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="detail-section-edit-historySummary"]',
      )
      ?.click();
    await flushView();

    const textarea = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="detail-section-input-historySummary"]',
    );
    expect(textarea).toBeTruthy();
    textarea!.value = '   ';
    textarea!.dispatchEvent(new Event('input'));
    await flushView();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="detail-section-save-historySummary"]',
      )
      ?.click();
    await flushView();

    expect(document.body.textContent).toContain('默认病史摘要内容');

    app.unmount();
    root.remove();
  });

  it('hides detail section editing when the workspace is not editable', async () => {
    workspaceByCaseId['CASE-1'] = createWorkspace({
      actionFlags: {
        canCompleteRegistration: false,
        canDeleteMediaAssets: true,
        canSaveDetailSections: false,
        canSaveMaterials: false,
        canUploadMediaAssets: true,
      },
    });

    const { app, root } = mountView();
    await flushView();

    expect(
      document.querySelector('[data-testid="detail-section-edit-historySummary"]'),
    ).toBeNull();

    document
      .querySelector<HTMLElement>(
        '[data-testid="detail-section-value-historySummary"]',
      )
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushView();

    expect(
      document.querySelector('[data-testid="detail-section-input-historySummary"]'),
    ).toBeNull();

    app.unmount();
    root.remove();
  });

  it('saves edited materials through the new materials API', async () => {
    const { app, root } = mountView();
    await flushView();

    const materialNameInput = document.querySelector<HTMLInputElement>(
      'input[placeholder="材料名称"]',
    );
    expect(materialNameInput).toBeTruthy();
    materialNameInput!.value = '新材料名称';
    materialNameInput!.dispatchEvent(new Event('input'));
    await flushView();

    findButton('保存材料修改').click();
    await flushView();

    expect(mockSaveTechnicalSpecimenRegistrationMaterials).toHaveBeenCalledWith(
      'CASE-1',
      {
        materials: [
          {
            sourcePart: '胃',
            specimenId: 'SP-1',
            specimenName: '新材料名称',
            specimenType: 'ROUTINE',
          },
        ],
        terminalCode: 'T-M3-SPEC-REG',
      },
    );

    app.unmount();
    root.remove();
  });

  it('uploads and deletes media assets from the right-side media panel', async () => {
    const { app, root } = mountView();
    await flushView();

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeTruthy();
    const file = new File(['image'], 'upload.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput!, 'files', {
      configurable: true,
      value: [file],
    });
    fileInput!.dispatchEvent(new Event('change'));
    await flushView();
    await flushView();

    expect(mockUploadTechnicalSpecimenRegistrationMediaAsset).toHaveBeenCalledWith(
      'CASE-1',
      file,
    );
    expect(document.body.textContent).toContain('upload.jpg');

    findButton('删除图片').click();
    await flushView();
    await flushView();

    expect(
      mockDeleteTechnicalSpecimenRegistrationMediaAsset,
    ).toHaveBeenCalledWith('CASE-1', 'ASSET-UPLOADED');

    app.unmount();
    root.remove();
  });

  it('opens the application drawer and saves updated application info', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="open-application-drawer"]')
      ?.click();
    await flushView();

    expect(
      document.querySelector('[data-testid="application-drawer"]'),
    ).toBeTruthy();

    document
      .querySelector<HTMLButtonElement>('[data-testid="drawer-update-record"]')
      ?.click();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="drawer-save-record"]')
      ?.click();
    await flushView();
    await flushView();

    expect(
      mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
    ).toHaveBeenCalledWith(
      'CASE-1',
      expect.objectContaining({
        patientInfo: expect.objectContaining({
          clinicalDiagnosis: '抽屉更新后的临床诊断',
        }),
      }),
    );
    expect(mockGetTechnicalSpecimenRegistrationWorkspace).toHaveBeenCalledTimes(
      2,
    );
    expect(messageSuccess).toHaveBeenCalledWith('申请信息已保存');

    app.unmount();
    root.remove();
  });

  it('completes registration and jumps to task pool', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('完成登记').click();
    await flushView();
    await flushView();

    expect(mockCompleteTechnicalSpecimenRegistration).toHaveBeenCalledWith(
      'CASE-1',
      {
        remarks: undefined,
        terminalCode: 'T-M3-SPEC-REG',
      },
    );
    expect(mockGoToTasks).toHaveBeenCalledWith({
      mode: 'queue',
      pathologyNo: 'BL-20260601-001',
    });

    app.unmount();
    root.remove();
  });
});
