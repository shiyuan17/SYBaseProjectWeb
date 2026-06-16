import type {
  PendingTechnicalSpecimenRegistrationItem,
  TechnicalSpecimenRegistrationWorkspace,
} from '../types/technical-workflow';

import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';
import type { ApplicationDetailView } from '#/modules/specimen-workflow/types/specimen-workflow';

import { createApp, defineComponent, h, inject, nextTick, provide } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  messageError,
  messageSuccess,
  messageWarning,
  mockCancelTechnicalSpecimenRegistrationMaterialVerification,
  mockCompleteTechnicalSpecimenRegistration,
  mockDeleteTechnicalSpecimenRegistrationMediaAsset,
  mockGetApplicationDetail,
  mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
  mockGetTechnicalSpecimenRegistrationWorkspace,
  mockGoToTasks,
  mockListPendingTechnicalSpecimenRegistrations,
  mockRouter,
  mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  mockSaveTechnicalSpecimenRegistrationDetailSections,
  mockSaveTechnicalSpecimenRegistrationMaterials,
  mockUpdateApplication,
  mockUploadTechnicalSpecimenRegistrationMediaAsset,
  mockVerifyTechnicalSpecimenRegistrationMaterial,
} = vi.hoisted(() => ({
  messageError: vi.fn(),
  messageSuccess: vi.fn(),
  messageWarning: vi.fn(),
  mockCancelTechnicalSpecimenRegistrationMaterialVerification: vi.fn(),
  mockCompleteTechnicalSpecimenRegistration: vi.fn(),
  mockDeleteTechnicalSpecimenRegistrationMediaAsset: vi.fn(),
  mockGetApplicationDetail: vi.fn(),
  mockGetTechnicalSpecimenRegistrationApplicationWorkbench: vi.fn(),
  mockGetTechnicalSpecimenRegistrationWorkspace: vi.fn(),
  mockGoToTasks: vi.fn(),
  mockListPendingTechnicalSpecimenRegistrations: vi.fn(),
  mockRouter: {
    push: vi.fn(),
  },
  mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo: vi.fn(),
  mockSaveTechnicalSpecimenRegistrationDetailSections: vi.fn(),
  mockSaveTechnicalSpecimenRegistrationMaterials: vi.fn(),
  mockUpdateApplication: vi.fn(),
  mockUploadTechnicalSpecimenRegistrationMediaAsset: vi.fn(),
  mockVerifyTechnicalSpecimenRegistrationMaterial: vi.fn(),
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
    Camera: createIcon('Camera'),
    ImagePlus: createIcon('ImagePlus'),
    Square: createIcon('Square'),
    X: createIcon('X'),
    UserRoundPen: createIcon('UserRoundPen'),
  };
});

vi.mock('../api/technical-workflow-service', () => ({
  cancelTechnicalSpecimenRegistrationMaterialVerification:
    mockCancelTechnicalSpecimenRegistrationMaterialVerification,
  completeTechnicalSpecimenRegistration:
    mockCompleteTechnicalSpecimenRegistration,
  deleteTechnicalSpecimenRegistrationMediaAsset:
    mockDeleteTechnicalSpecimenRegistrationMediaAsset,
  getTechnicalSpecimenRegistrationApplicationWorkbench:
    mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
  getTechnicalSpecimenRegistrationWorkspace:
    mockGetTechnicalSpecimenRegistrationWorkspace,
  listTechnicalSpecimenRegistrations:
    mockListPendingTechnicalSpecimenRegistrations,
  saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo:
    mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  saveTechnicalSpecimenRegistrationDetailSections:
    mockSaveTechnicalSpecimenRegistrationDetailSections,
  saveTechnicalSpecimenRegistrationMaterials:
    mockSaveTechnicalSpecimenRegistrationMaterials,
  uploadTechnicalSpecimenRegistrationMediaAsset:
    mockUploadTechnicalSpecimenRegistrationMediaAsset,
  verifyTechnicalSpecimenRegistrationMaterial:
    mockVerifyTechnicalSpecimenRegistrationMaterial,
}));

vi.mock('#/modules/specimen-workflow/api/specimen-workflow-service', () => ({
  getApplicationDetail: mockGetApplicationDetail,
  updateApplication: mockUpdateApplication,
}));

vi.mock('../utils/navigation', () => ({
  useTechnicalWorkflowNavigation: () => ({
    goToTasks: mockGoToTasks,
  }),
}));

vi.mock('element-plus', () => {
  const tabsContextKey = Symbol('technical-registration-tabs');

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

  const ElDatePicker = defineComponent({
    props: ['endPlaceholder', 'modelValue', 'startPlaceholder', 'type'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-date-picker-type': props.type,
          placeholder: props.startPlaceholder || props.endPlaceholder,
          value: Array.isArray(props.modelValue)
            ? props.modelValue.join(',')
            : props.modelValue,
          onInput: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).value
                .split(',')
                .filter(Boolean),
            ),
        });
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
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        });
    },
  });

  const ElImage = defineComponent({
    props: ['alt', 'initialIndex', 'previewSrcList', 'src'],
    setup(props, { slots }) {
      return () =>
        props.src
          ? h('img', {
              alt: props.alt,
              'data-initial-index': props.initialIndex,
              'data-preview-src-list': Array.isArray(props.previewSrcList)
                ? props.previewSrcList.join(',')
                : '',
              src: props.src,
            })
          : slots.error?.();
    },
  });

  const ElOption = defineComponent({
    props: ['label', 'value'],
    setup(props) {
      return () => h('option', { value: props.value }, props.label);
    },
  });

  const ElPagination = defineComponent({
    setup() {
      return () => h('nav');
    },
  });

  const ElRadioGroup = defineComponent({
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit, slots }) {
      provide('technical-registration-radio-group', {
        modelValue: () => props.modelValue,
        update: (value: string) => emit('update:modelValue', value),
      });
      return () =>
        h('div', { ...attrs, role: 'radiogroup' }, slots.default?.());
    },
  });

  const ElRadio = defineComponent({
    props: ['label'],
    setup(props, { slots }) {
      const radioGroup = inject<{
        modelValue: () => unknown;
        update: (value: string) => void;
      }>('technical-registration-radio-group');
      return () =>
        h('label', [
          h('input', {
            checked: radioGroup?.modelValue() === props.label,
            type: 'radio',
            value: props.label,
            onChange: () => radioGroup?.update(String(props.label)),
          }),
          slots.default?.() ?? String(props.label),
        ]);
    },
  });

  const ElSelect = defineComponent({
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          'select',
          {
            ...attrs,
            'aria-label': props.placeholder,
            value: props.modelValue,
            onChange: (event: Event) =>
              emit(
                'update:modelValue',
                (event.target as HTMLSelectElement).value,
              ),
          },
          slots.default?.(),
        );
    },
  });

  const ElSwitch = defineComponent({
    props: ['disabled', 'modelValue'],
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'aria-label': '预览开关',
          checked: props.modelValue,
          disabled: props.disabled,
          role: 'switch',
          type: 'checkbox',
          onChange: (event: Event) =>
            emit(
              'update:modelValue',
              (event.target as HTMLInputElement).checked,
            ),
        });
    },
  });

  const ElTabs = defineComponent({
    props: ['modelValue', 'stretch'],
    emits: ['update:modelValue'],
    setup(props, { attrs, emit, slots }) {
      provide(tabsContextKey, {
        activeName: () => props.modelValue,
        select: (value: string) => emit('update:modelValue', value),
      });
      return () => h('div', { ...attrs, role: 'tablist' }, slots.default?.());
    },
  });

  const ElTabPane = defineComponent({
    props: ['label', 'name'],
    setup(props, { attrs }) {
      const tabs = inject<{
        activeName: () => unknown;
        select: (value: string) => void;
      }>(tabsContextKey);
      return () =>
        h(
          'button',
          {
            ...attrs,
            'aria-selected':
              tabs?.activeName() === props.name ? 'true' : 'false',
            role: 'tab',
            type: 'button',
            onClick: () => tabs?.select(String(props.name)),
          },
          String(props.label),
        );
    },
  });

  return {
    ElAlert,
    ElButton,
    ElDatePicker,
    ElEmpty,
    ElImage,
    ElInput,
    ElMessage: {
      error: messageError,
      success: messageSuccess,
      warning: messageWarning,
    },
    ElOption,
    ElPagination,
    ElRadio,
    ElRadioGroup,
    ElSelect,
    ElSwitch,
    ElTabPane,
    ElTabs,
  };
});

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
    pathologyNo: null,
    patientAge: '34',
    patientGender: '女',
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
      pathologyNo: null,
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
        evaluationItems: [],
        frozen: false,
        sequenceNo: 1,
        sourcePart: '胃',
        specimenBarcode: 'BC-M3-REG-001',
        specimenId: 'SP-1',
        specimenSize: '小标本',
        specimenName: '组织块',
        specimenType: '活体',
        tissueCount: 1,
        verificationCompletedAt: null,
        verificationStatus: 'UNVERIFIED',
        verifiedByName: null,
      },
    ],
    mediaAssets: [],
    pendingSummary: createPendingItem(),
    ...overrides,
  };
}

function createConsultationApplicationDetail(
  overrides: Partial<ApplicationDetailView> = {},
): ApplicationDetailView {
  return {
    abnormalFlag: false,
    applicationDate: '2026-06-01',
    applicationFormStatus: 'PENDING',
    applicationNo: 'APP-20260601-003',
    applicationType: 'CONSULTATION',
    clinicalDiagnosis: '初始会诊诊断',
    clinicalSymptom: null,
    createdAt: '2026-06-01T08:00:00',
    currentNode: 'SPECIMEN_REGISTRATION',
    deletable: false,
    editable: true,
    externalOrderNo: 'CONS-001',
    id: 'APP-3',
    operationDisabledReason: null,
    patientAge: '45',
    patientGender: '男',
    patientId: 'P-003',
    patientName: '患者丙',
    recentEvents: [],
    remarks: null,
    sourceHospitalId: null,
    sourceHospitalName: '外院A',
    specimenSite: '肺',
    specimenRemovalTime: '2026-06-01T07:30:00',
    specimens: [],
    status: 'PENDING',
    submissionDate: '2026-06-01',
    submittingDepartmentId: null,
    submittingDepartmentName: '会诊科室',
    submittingDoctorName: '医生丙',
    submittingDoctorUserId: null,
    thirdPartySource: null,
    updatedAt: '2026-06-01T09:00:00',
    voided: false,
    ...overrides,
  };
}

function createConsultationWorkbench(
  overrides: Partial<ApplicationRegistrationWorkbenchRecord> = {},
): ApplicationRegistrationWorkbenchRecord {
  return {
    applicationId: 'APP-3',
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
      age: '45',
      applicationDate: '2026-06-01',
      applicationNo: 'APP-20260601-003',
      applyDept: '会诊科室',
      applyDoctor: '医生丙',
      bedNo: '',
      checkItem: '',
      clinicalDiagnosis: '初始会诊诊断',
      clinicalHistory: '',
      deliveryRequirement: '初始会诊要求',
      endoscopyDiagnosis: '',
      frozenReminder: false,
      gender: '男',
      idNo: '',
      imagingResult: '',
      inpatientNo: 'INP-3',
      patientName: '患者丙',
      patientVerified: false,
      phone: '',
      registrationStatus: 'PENDING',
      remark: '',
      specimenType: 'CONSULTATION',
      wardName: '',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: '',
      clinicalFindings: '',
      fixativeType: '',
      fixationPerson: '',
      fixationTime: '',
      roomId: '',
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

function findPathologyNoInput() {
  const input = document.querySelector<HTMLInputElement>(
    '[data-testid="registration-pathology-no-input"]',
  );
  expect(input).toBeTruthy();
  return input as HTMLInputElement;
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

function installCameraTestDoubles() {
  const stopTrack = vi.fn();
  const getUserMedia = vi.fn(async () => {
    return {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
  });
  const play = vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockResolvedValue(undefined);
  const drawImage = vi.fn();
  const getContext = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
  const toBlob = vi
    .spyOn(HTMLCanvasElement.prototype, 'toBlob')
    .mockImplementation((callback: BlobCallback, type?: string): void => {
      callback(new Blob(['camera-image'], { type: type ?? 'image/jpeg' }));
    });
  const videoWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLVideoElement.prototype,
    'videoWidth',
  );
  const videoHeightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLVideoElement.prototype,
    'videoHeight',
  );
  const srcObjectDescriptor = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'srcObject',
  );
  const mediaDevicesDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    'mediaDevices',
  );

  let currentSrcObject: MediaProvider | null = null;
  Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
    configurable: true,
    get: () => currentSrcObject,
    set: (value) => {
      currentSrcObject = value;
    },
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    configurable: true,
    get: () => 1280,
  });
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
    configurable: true,
    get: () => 720,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });

  return {
    drawImage,
    getUserMedia,
    restore: () => {
      if (mediaDevicesDescriptor) {
        Object.defineProperty(
          navigator,
          'mediaDevices',
          mediaDevicesDescriptor,
        );
      } else {
        Reflect.deleteProperty(navigator, 'mediaDevices');
      }
      getContext.mockRestore();
      play.mockRestore();
      toBlob.mockRestore();
      if (videoWidthDescriptor) {
        Object.defineProperty(
          HTMLVideoElement.prototype,
          'videoWidth',
          videoWidthDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLVideoElement.prototype, 'videoWidth');
      }
      if (videoHeightDescriptor) {
        Object.defineProperty(
          HTMLVideoElement.prototype,
          'videoHeight',
          videoHeightDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLVideoElement.prototype, 'videoHeight');
      }
      if (srcObjectDescriptor) {
        Object.defineProperty(
          HTMLMediaElement.prototype,
          'srcObject',
          srcObjectDescriptor,
        );
      } else {
        Reflect.deleteProperty(HTMLMediaElement.prototype, 'srcObject');
      }
    },
    stopTrack,
  };
}

describe('TechnicalSpecimenRegistrationView', () => {
  let applicationDetailById: Record<string, ApplicationDetailView>;
  let consultationWorkbenchByCaseId: Record<
    string,
    ApplicationRegistrationWorkbenchRecord
  >;
  let workspaceByCaseId: Record<string, TechnicalSpecimenRegistrationWorkspace>;

  beforeEach(() => {
    workspaceByCaseId = {
      'CASE-1': createWorkspace(),
      'CASE-2': createWorkspace({
        basicInfo: {
          ...createWorkspace().basicInfo,
          applicationNo: 'APP-20260601-002',
          applicationType: 'FROZEN',
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
          applicationNo: 'APP-20260601-002',
          applicationType: 'FROZEN',
          caseId: 'CASE-2',
          patientName: '患者乙',
        }),
      }),
      'CASE-3': createWorkspace({
        basicInfo: {
          ...createWorkspace().basicInfo,
          applicationNo: 'APP-20260601-003',
          applicationType: 'CONSULTATION',
          patientAge: '45',
          patientGender: '男',
          patientId: 'P-003',
          patientName: '患者丙',
          submittingDepartmentName: '会诊科室',
          submittingDoctorName: '医生丙',
        },
        materials: [],
        pendingSummary: createPendingItem({
          applicationId: 'APP-3',
          applicationNo: 'APP-20260601-003',
          applicationType: 'CONSULTATION',
          caseId: 'CASE-3',
          patientId: 'P-003',
          patientName: '患者丙',
          submittingDepartmentName: '会诊科室',
        }),
      }),
    };
    applicationDetailById = {
      'APP-3': createConsultationApplicationDetail(),
    };
    consultationWorkbenchByCaseId = {
      'CASE-1': createConsultationWorkbench({
        patientInfo: {
          ...createConsultationWorkbench().patientInfo,
          age: '34',
          applicationNo: 'APP-20260601-001',
          applyDept: '病理科',
          applyDoctor: '医生甲',
          clinicalHistory: '常规病史',
          gender: '女',
          patientName: '患者甲',
          specimenType: 'ROUTINE',
        },
        surgeryInfo: {
          ...createConsultationWorkbench().surgeryInfo,
          clinicalFindings: '术中见胃窦病灶',
          surgeryName: '胃镜活检',
        },
      }),
      'CASE-2': createConsultationWorkbench({
        patientInfo: {
          ...createConsultationWorkbench().patientInfo,
          age: '36',
          applicationNo: 'APP-20260601-002',
          patientName: '患者乙',
          specimenType: 'FROZEN',
        },
      }),
      'CASE-3': createConsultationWorkbench(),
    };

    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValue({
      items: [
        createPendingItem({
          caseId: 'CASE-1',
        }),
        createPendingItem({
          applicationNo: 'APP-20260601-002',
          applicationType: 'FROZEN',
          caseId: 'CASE-2',
          patientName: '患者乙',
        }),
        createPendingItem({
          applicationId: 'APP-3',
          applicationNo: 'APP-20260601-003',
          applicationType: 'CONSULTATION',
          caseId: 'CASE-3',
          patientId: 'P-003',
          patientName: '患者丙',
          submittingDepartmentName: '会诊科室',
        }),
      ],
      page: 1,
      size: 20,
      total: 3,
    });
    mockGetTechnicalSpecimenRegistrationWorkspace.mockImplementation(
      async (caseId: string) => workspaceByCaseId[caseId],
    );
    mockGetTechnicalSpecimenRegistrationApplicationWorkbench.mockImplementation(
      async (caseId: string) => consultationWorkbenchByCaseId[caseId],
    );
    mockGetApplicationDetail.mockImplementation(
      async (applicationId: string) => applicationDetailById[applicationId],
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
      async (
        caseId: string,
        data: {
          materials: TechnicalSpecimenRegistrationWorkspace['materials'];
        },
      ) => {
        const currentWorkspace = workspaceByCaseId[caseId]!;
        const nextWorkspace = {
          ...currentWorkspace,
          materials: data.materials.map((item, index) => ({
            evaluationItems: item.evaluationItems ?? [],
            frozen: item.frozen ?? false,
            sequenceNo: index + 1,
            sourcePart: item.sourcePart ?? null,
            specimenBarcode: item.specimenBarcode ?? `BC-NEW-${index + 1}`,
            specimenId: item.specimenId ?? `NEW-${index + 1}`,
            specimenSize: item.specimenSize ?? '小标本',
            specimenName: item.specimenName ?? null,
            specimenType: item.specimenType ?? '活体',
            tissueCount: item.tissueCount ?? 1,
            verificationCompletedAt: item.verificationCompletedAt ?? null,
            verificationStatus: item.verificationStatus ?? 'UNVERIFIED',
            verifiedByName: item.verifiedByName ?? null,
          })),
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        workspaceByCaseId[caseId] = nextWorkspace;
        return nextWorkspace;
      },
    );
    mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo.mockImplementation(
      async (caseId: string, data: ApplicationRegistrationWorkbenchRecord) => {
        const nextWorkbench = {
          ...consultationWorkbenchByCaseId[caseId],
          ...data,
          patientInfo: {
            ...consultationWorkbenchByCaseId[caseId]?.patientInfo,
            ...data.patientInfo,
          },
        } satisfies ApplicationRegistrationWorkbenchRecord;
        consultationWorkbenchByCaseId[caseId] = nextWorkbench;
        return nextWorkbench;
      },
    );
    mockUpdateApplication.mockImplementation(
      async (applicationId: string, data: ApplicationDetailView) => {
        applicationDetailById[applicationId] = {
          ...applicationDetailById[applicationId],
          ...data,
          clinicalDiagnosis: data.clinicalDiagnosis,
          externalOrderNo: data.externalOrderNo,
          sourceHospitalName: data.sourceHospitalName,
          specimenSite: data.specimenSite,
        };
        return { id: applicationId };
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
    mockVerifyTechnicalSpecimenRegistrationMaterial.mockImplementation(
      async (_caseId: string, specimenId: string) => {
        const currentWorkspace = workspaceByCaseId['CASE-1']!;
        workspaceByCaseId['CASE-1'] = {
          ...currentWorkspace,
          materials: currentWorkspace.materials.map((material) =>
            material.specimenId === specimenId
              ? {
                  ...material,
                  verificationCompletedAt: '2026-06-02T11:30:00',
                  verificationStatus: 'VERIFIED',
                  verifiedByName: 'Receiver A',
                }
              : material,
          ),
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        return workspaceByCaseId['CASE-1'];
      },
    );
    mockCancelTechnicalSpecimenRegistrationMaterialVerification.mockImplementation(
      async (_caseId: string, specimenId: string) => {
        const currentWorkspace = workspaceByCaseId['CASE-1']!;
        workspaceByCaseId['CASE-1'] = {
          ...currentWorkspace,
          materials: currentWorkspace.materials.map((material) =>
            material.specimenId === specimenId
              ? {
                  ...material,
                  verificationCompletedAt: null,
                  verificationStatus: 'UNVERIFIED',
                  verifiedByName: null,
                }
              : material,
          ),
        } satisfies TechnicalSpecimenRegistrationWorkspace;
        return workspaceByCaseId['CASE-1'];
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
    mockGoToTasks.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockCancelTechnicalSpecimenRegistrationMaterialVerification.mockReset();
    mockCompleteTechnicalSpecimenRegistration.mockReset();
    mockDeleteTechnicalSpecimenRegistrationMediaAsset.mockReset();
    mockGetApplicationDetail.mockReset();
    mockGetTechnicalSpecimenRegistrationApplicationWorkbench.mockReset();
    mockGetTechnicalSpecimenRegistrationWorkspace.mockReset();
    mockGoToTasks.mockReset();
    mockListPendingTechnicalSpecimenRegistrations.mockReset();
    mockRouter.push.mockReset();
    mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo.mockReset();
    mockSaveTechnicalSpecimenRegistrationDetailSections.mockReset();
    mockSaveTechnicalSpecimenRegistrationMaterials.mockReset();
    mockUpdateApplication.mockReset();
    mockUploadTechnicalSpecimenRegistrationMediaAsset.mockReset();
    mockVerifyTechnicalSpecimenRegistrationMaterial.mockReset();
    messageError.mockReset();
    messageSuccess.mockReset();
    messageWarning.mockReset();
    document.body.innerHTML = '';
  });

  it('renders the three-column workbench and loads pending registrations on mount', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('接收列表');
    expect(document.body.textContent).toContain('已登记列表');
    expect(document.body.textContent).toContain('登记工作区');
    expect(document.body.textContent).not.toContain(
      '按接收日期和关键字筛选，选择病例后刷新中间登记工作区。',
    );
    expect(document.body.textContent).toContain('送检单位');
    expect(document.body.textContent).toContain('南海人民医院凯普送检中心');
    expect(document.body.textContent).toContain('南方医院增城分院');
    expect(document.body.textContent).toContain('全部');
    expect(document.body.textContent).toContain('门诊');
    expect(document.body.textContent).toContain('住院');
    expect(document.body.textContent).toContain('体检');
    expect(document.body.textContent).toContain('周');
    expect(document.body.textContent).toContain('月');
    expect(document.body.textContent).toContain('季');
    expect(document.body.textContent).toContain('年');
    expect(document.body.textContent).toContain('APP-20260601-001');
    expect(document.body.textContent).toContain('申请完整信息');
    expect(document.body.textContent).toContain('手术信息');
    expect(document.body.textContent).toContain('妇科信息');
    expect(document.body.textContent).toContain('胃镜活检');
    expect(mockListPendingTechnicalSpecimenRegistrations).toHaveBeenCalledWith({
      applicationType: undefined,
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      registrationStatus: 'PENDING',
      size: 20,
    });
    expect(mockGetTechnicalSpecimenRegistrationWorkspace).toHaveBeenCalledWith(
      'CASE-1',
    );
    expect(
      mockGetTechnicalSpecimenRegistrationApplicationWorkbench,
    ).toHaveBeenCalledWith('CASE-1');
    expect(document.body.textContent).toContain('图片区');

    app.unmount();
    root.remove();
  });

  it('keeps new display-only filters out of pending registration queries', async () => {
    const { app, root } = mountView();
    await flushView();

    const queryCount =
      mockListPendingTechnicalSpecimenRegistrations.mock.calls.length;

    const sendingUnitSelect = document.querySelector<HTMLSelectElement>(
      '[data-testid="sending-unit-display-filter"]',
    );
    const periodSelect = document.querySelector<HTMLSelectElement>(
      '[data-testid="period-display-filter"]',
    );
    const outpatientRadio = document.querySelector<HTMLInputElement>(
      '[data-testid="patient-source-display-filter"] input[value="OUTPATIENT"]',
    );

    sendingUnitSelect!.value = '南方医院';
    sendingUnitSelect!.dispatchEvent(new Event('change'));
    periodSelect!.value = 'YEAR';
    periodSelect!.dispatchEvent(new Event('change'));
    outpatientRadio!.click();
    await nextTick();

    expect(mockListPendingTechnicalSpecimenRegistrations).toHaveBeenCalledTimes(
      queryCount,
    );
    expect(
      mockListPendingTechnicalSpecimenRegistrations,
    ).toHaveBeenLastCalledWith({
      applicationType: undefined,
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      registrationStatus: 'PENDING',
      size: 20,
    });

    app.unmount();
    root.remove();
  });

  it('switches between receive and registered list tabs', async () => {
    const registeredItem = createPendingItem({
      applicationNo: 'APP-20260601-004',
      caseId: 'CASE-4',
      pathologyNo: 'BL-20260601-004',
      patientId: 'P-004',
      patientName: '患者丁',
      registeredAt: '2026-06-01T10:00:00',
      registeredByName: '登记员甲',
      registrationStatus: 'COMPLETED',
    });
    workspaceByCaseId['CASE-4'] = createWorkspace({
      actionFlags: {
        canCompleteRegistration: false,
        canDeleteMediaAssets: false,
        canSaveDetailSections: false,
        canSaveMaterials: false,
        canUploadMediaAssets: false,
      },
      basicInfo: {
        ...createWorkspace().basicInfo,
        applicationNo: 'APP-20260601-004',
        pathologyNo: 'BL-20260601-004',
        patientId: 'P-004',
        patientName: '患者丁',
        registrationStatus: 'COMPLETED',
      },
      pendingSummary: registeredItem,
    });
    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValueOnce({
      items: [
        createPendingItem({
          caseId: 'CASE-1',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });
    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValueOnce({
      items: [registeredItem],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = mountView();
    await flushView();

    expect(
      document.querySelector('[data-testid="specimen-row-CASE-1"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-testid="specimen-row-CASE-4"]'),
    ).toBeNull();
    expect(
      mockListPendingTechnicalSpecimenRegistrations,
    ).toHaveBeenLastCalledWith({
      applicationType: undefined,
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      registrationStatus: 'PENDING',
      size: 20,
    });

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="registration-list-tab-registered"]',
      )
      ?.click();
    await flushView();
    await flushView();

    const registeredRow = document.querySelector<HTMLButtonElement>(
      '[data-testid="specimen-row-CASE-4"]',
    );
    expect(registeredRow).toBeTruthy();
    expect(registeredRow?.textContent).toContain('BL-20260601-004');
    expect(registeredRow?.textContent).toContain('患者丁');
    expect(registeredRow?.textContent).toContain('已登记');
    expect(
      document.querySelector('[data-testid="specimen-row-CASE-1"]'),
    ).toBeNull();
    expect(
      mockListPendingTechnicalSpecimenRegistrations,
    ).toHaveBeenLastCalledWith({
      applicationType: undefined,
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      registrationStatus: 'COMPLETED',
      size: 20,
    });
    expect(
      mockGetTechnicalSpecimenRegistrationWorkspace,
    ).toHaveBeenLastCalledWith('CASE-4');
    expect(document.body.textContent).toContain('当前状态 已登记');

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
    expect(document.body.textContent).toContain('患者乙');

    app.unmount();
    root.remove();
  });

  it('shows compact receive rows with only order, name, and status', async () => {
    const { app, root } = mountView();
    await flushView();

    const row = document.querySelector<HTMLButtonElement>(
      '[data-testid="specimen-row-CASE-1"]',
    );
    expect(row).toBeTruthy();
    expect(row!.textContent).toContain('待生成');
    expect(row!.textContent).not.toContain('BL-20260601-001');
    expect(row!.textContent).toContain('患者甲');
    expect(row!.textContent).toContain('待登记');
    expect(row!.textContent).not.toContain('PENDING');
    expect(row!.textContent).not.toContain('住院号：');
    expect(row!.textContent).not.toContain('送检类型：');
    expect(row!.textContent).not.toContain('申请科室：');
    expect(row!.textContent).not.toContain('检查项目：');
    expect(row!.textContent).not.toContain('接收时间：');

    app.unmount();
    root.remove();
  });

  it('shows 待生成 when pathology number has not been created yet', async () => {
    workspaceByCaseId['CASE-1'] = createWorkspace({
      basicInfo: {
        ...createWorkspace().basicInfo,
        pathologyNo: null,
      },
      pendingSummary: createPendingItem({
        pathologyNo: null,
      }),
    });
    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValueOnce({
      items: [
        createPendingItem({
          pathologyNo: null,
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const { app, root } = mountView();
    await flushView();

    const row = document.querySelector<HTMLButtonElement>(
      '[data-testid="specimen-row-CASE-1"]',
    );
    expect(row?.textContent).toContain('待生成');
    expect(findPathologyNoInput().value).toMatch(/^BL/);
    expect(document.body.textContent).toContain(
      `病理号 ${findPathologyNoInput().value}`,
    );

    app.unmount();
    root.remove();
  });

  it('shows registration status and application type as Chinese labels', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('当前状态 待登记');
    expect(document.body.textContent).toContain('送检类型：常规');
    expect(document.body.textContent).not.toContain('当前状态 PENDING');
    expect(document.body.textContent).not.toContain('送检类型：ROUTINE');

    app.unmount();
    root.remove();
  });

  it('keeps the specimen table compact and removes helper text', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(document.body.textContent).toContain('送检标本');
    expect(document.body.textContent).not.toContain(
      '支持在技术登记阶段调整标本名称、类型、数量、来源部位、大小和冰冻标记，并记录标本评价。',
    );

    const table = document.querySelector<HTMLTableElement>(
      '[data-testid="specimen-material-table"]',
    );
    expect(table).toBeTruthy();
    expect(table?.className).toContain('min-w-');
    expect(table?.className).toContain('whitespace-nowrap');

    app.unmount();
    root.remove();
  });

  it('shows the pathology number draft input beside submitted specimens', async () => {
    const { app, root } = mountView();
    await flushView();

    const pathologyNoInput = findPathologyNoInput();
    expect(pathologyNoInput.disabled).toBe(false);
    expect(pathologyNoInput.value).toMatch(/^BL/);
    expect(document.body.textContent).toContain(
      `病理号 ${pathologyNoInput.value}`,
    );

    app.unmount();
    root.remove();
  });

  it('renders all registration application types and switches to consultation list for consultation types', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(
      document.querySelector(
        '[data-testid="registration-application-type-ROUTINE"]',
      ),
    ).toBeTruthy();
    expect(
      document.querySelector(
        '[data-testid="registration-application-type-CONSULTATION"]',
      ),
    ).toBeTruthy();
    expect(
      document.querySelector(
        '[data-testid="registration-application-type-LIVER_BIOPSY"]',
      ),
    ).toBeTruthy();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="registration-application-type-CONSULTATION"]',
      )
      ?.click();
    await flushView();

    expect(
      document.querySelector('[data-testid="consultation-material-table"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-testid="specimen-material-table"]'),
    ).toBeNull();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="registration-application-type-FROZEN"]',
      )
      ?.click();
    await flushView();

    expect(
      document.querySelector('[data-testid="specimen-material-table"]'),
    ).toBeTruthy();

    app.unmount();
    root.remove();
  });

  it('updates pathology number preview when switching registration application types', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(findPathologyNoInput().value).toMatch(/^BL/);

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="registration-application-type-FROZEN"]',
      )
      ?.click();
    await flushView();

    expect(findPathologyNoInput().value).toMatch(/^BD/);

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="registration-application-type-CONSULTATION"]',
      )
      ?.click();
    await flushView();

    expect(findPathologyNoInput().value).toMatch(/^HZ/);

    app.unmount();
    root.remove();
  });

  it('resets the selected registration application type when switching cases', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>(
        '[data-testid="registration-application-type-CONSULTATION"]',
      )
      ?.click();
    await flushView();

    expect(
      document.querySelector('[data-testid="consultation-material-table"]'),
    ).toBeTruthy();

    document
      .querySelector<HTMLButtonElement>('[data-testid="specimen-row-CASE-2"]')
      ?.click();
    await flushView();
    await flushView();

    expect(
      document.querySelector('[data-testid="consultation-material-table"]'),
    ).toBeNull();
    expect(
      document.querySelector('[data-testid="specimen-material-table"]'),
    ).toBeTruthy();
    expect(
      document
        .querySelector<HTMLButtonElement>(
          '[data-testid="registration-application-type-FROZEN"]',
        )
        ?.getAttribute('aria-pressed'),
    ).toBe('true');

    app.unmount();
    root.remove();
  });

  it('resets pathology number draft when switching cases', async () => {
    const { app, root } = mountView();
    await flushView();

    const pathologyNoInput = findPathologyNoInput();
    pathologyNoInput.value = 'BL202606080099';
    pathologyNoInput.dispatchEvent(new Event('input'));
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="specimen-row-CASE-2"]')
      ?.click();
    await flushView();
    await flushView();

    expect(findPathologyNoInput().value).not.toBe('BL202606080099');
    expect(findPathologyNoInput().value).toMatch(/^BD/);

    app.unmount();
    root.remove();
  });

  it('queries pending registrations by application type so pagination matches the filtered list', async () => {
    const { app, root } = mountView();
    await flushView();

    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValueOnce({
      items: [
        createPendingItem({
          applicationNo: 'APP-20260601-002',
          applicationType: 'FROZEN',
          caseId: 'CASE-2',
          patientName: '患者乙',
        }),
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    const filter = document.querySelector<HTMLSelectElement>(
      '[data-testid="application-type-filter"]',
    );
    expect(filter).toBeTruthy();
    filter!.value = 'FROZEN';
    filter!.dispatchEvent(new Event('change'));
    await flushView();

    expect(
      document.querySelector('[data-testid="specimen-row-CASE-1"]'),
    ).toBeNull();
    expect(
      document.querySelector('[data-testid="specimen-row-CASE-2"]'),
    ).toBeTruthy();
    expect(
      mockGetTechnicalSpecimenRegistrationWorkspace,
    ).toHaveBeenLastCalledWith('CASE-2');
    expect(
      mockListPendingTechnicalSpecimenRegistrations,
    ).toHaveBeenLastCalledWith({
      applicationType: 'FROZEN',
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      registrationStatus: 'PENDING',
      size: 20,
    });

    mockListPendingTechnicalSpecimenRegistrations.mockResolvedValueOnce({
      items: [],
      page: 1,
      size: 20,
      total: 0,
    });

    filter!.value = 'IHC';
    filter!.dispatchEvent(new Event('change'));
    await flushView();

    expect(document.body.textContent).toContain('暂无待登记病例');
    expect(document.body.textContent).toContain('请选择左侧病例');
    expect(
      mockListPendingTechnicalSpecimenRegistrations,
    ).toHaveBeenLastCalledWith({
      applicationType: 'IHC',
      keyword: undefined,
      page: 1,
      receivedFrom: undefined,
      receivedTo: undefined,
      registrationStatus: 'PENDING',
      size: 20,
    });

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

  it('renders detail sections as single-line summary rows by default', async () => {
    const { app, root } = mountView();
    await flushView();

    const detailValue = document.querySelector<HTMLElement>(
      '[data-testid="detail-section-value-historySummary"]',
    );
    expect(detailValue).toBeTruthy();
    expect(detailValue?.className).toContain('whitespace-nowrap');
    expect(detailValue?.className).toContain('text-ellipsis');

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
      document.querySelector(
        '[data-testid="detail-section-edit-historySummary"]',
      ),
    ).toBeNull();

    document
      .querySelector<HTMLElement>(
        '[data-testid="detail-section-value-historySummary"]',
      )
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await flushView();

    expect(
      document.querySelector(
        '[data-testid="detail-section-input-historySummary"]',
      ),
    ).toBeNull();

    app.unmount();
    root.remove();
  });

  it('saves edited specimens through the materials API', async () => {
    const { app, root } = mountView();
    await flushView();

    const materialNameInput = document.querySelector<HTMLInputElement>(
      'input[placeholder="标本名称"]',
    );
    expect(materialNameInput).toBeTruthy();
    materialNameInput!.value = '新标本名称';
    materialNameInput!.dispatchEvent(new Event('input'));
    await flushView();

    findButton('保存标本修改').click();
    await flushView();

    expect(mockSaveTechnicalSpecimenRegistrationMaterials).toHaveBeenCalledWith(
      'CASE-1',
      {
        materials: [
          {
            evaluationItems: [],
            frozen: false,
            sourcePart: '胃',
            specimenId: 'SP-1',
            specimenSize: '小标本',
            specimenName: '新标本名称',
            specimenType: '活体',
            tissueCount: 1,
          },
        ],
        terminalCode: 'T-M3-SPEC-REG',
      },
    );

    app.unmount();
    root.remove();
  });

  it('evaluates the selected specimen with default and custom items', async () => {
    const { app, root } = mountView();
    await flushView();

    const evaluateButton = findButton('评价');
    expect(evaluateButton.disabled).toBe(true);

    const selector = document.querySelector<HTMLInputElement>(
      'input[name="technical-registration-material"]',
    );
    expect(selector).toBeTruthy();
    selector!.checked = true;
    selector!.dispatchEvent(new Event('change'));
    await flushView();

    expect(findButton('评价').disabled).toBe(false);
    findButton('评价').click();
    await flushView();

    expect(
      document.querySelector('[data-testid="material-evaluation-dialog"]'),
    ).toBeTruthy();
    expect(document.body.textContent).toContain('福尔马林未完全浸泡');
    expect(document.body.textContent).toContain('密封不严');
    expect(document.body.textContent).toContain('切面质量低');

    const defaultOption = document.querySelector<HTMLInputElement>(
      '[data-testid="evaluation-option-密封不严"]',
    );
    expect(defaultOption).toBeTruthy();
    defaultOption!.checked = true;
    defaultOption!.dispatchEvent(new Event('change'));
    await flushView();

    const customInput = document.querySelector<HTMLInputElement>(
      '[data-testid="custom-evaluation-input"]',
    );
    expect(customInput).toBeTruthy();
    customInput!.value = '自定义评价项';
    customInput!.dispatchEvent(new Event('input'));
    await flushView();
    findButton('添加').click();
    await flushView();
    findButton('确定').click();
    await flushView();

    findButton('保存标本修改').click();
    await flushView();

    expect(mockSaveTechnicalSpecimenRegistrationMaterials).toHaveBeenCalledWith(
      'CASE-1',
      expect.objectContaining({
        materials: [
          expect.objectContaining({
            evaluationItems: ['密封不严', '自定义评价项'],
          }),
        ],
      }),
    );

    app.unmount();
    root.remove();
  });

  it('shows new specimens as unverified by default', async () => {
    const { app, root } = mountView();
    await flushView();

    findButton('新增标本').click();
    await flushView();

    const newRow = document.querySelector<HTMLElement>(
      '[data-testid="material-row-1"]',
    );
    expect(newRow).toBeTruthy();
    expect(newRow?.textContent).toContain('未核对');

    app.unmount();
    root.remove();
  });

  it('saves consultation items through the consultation tab dialog', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLButtonElement>('[data-testid="specimen-row-CASE-3"]')
      ?.click();
    await flushView();
    await flushView();

    const consultationTab = document.querySelector<HTMLButtonElement>(
      '[data-testid="registration-application-type-CONSULTATION"]',
    );
    expect(consultationTab).toBeTruthy();
    consultationTab?.click();
    await flushView();

    expect(
      document.querySelector('[data-testid="consultation-material-table"]'),
    ).toBeTruthy();

    findButton('新增会诊项').click();
    await flushView();

    const materialType = document.querySelector<HTMLSelectElement>(
      '[data-testid="consultation-material-type"]',
    );
    expect(materialType).toBeTruthy();
    materialType!.value = 'IHC';
    materialType!.dispatchEvent(new Event('change'));

    const quantity = document.querySelector<HTMLInputElement>(
      '[data-testid="consultation-quantity"]',
    );
    quantity!.value = '2';
    quantity!.dispatchEvent(new Event('input'));

    const sourcePart = document.querySelector<HTMLInputElement>(
      '[data-testid="consultation-source-part"]',
    );
    sourcePart!.value = '肺';
    sourcePart!.dispatchEvent(new Event('input'));

    const sourceHospital = document.querySelector<HTMLInputElement>(
      '[data-testid="consultation-source-hospital"]',
    );
    sourceHospital!.value = '外院B';
    sourceHospital!.dispatchEvent(new Event('input'));

    const externalId = document.querySelector<HTMLInputElement>(
      '[data-testid="consultation-external-id"]',
    );
    externalId!.value = 'CONS-002';
    externalId!.dispatchEvent(new Event('input'));

    const requirement = document.querySelector<HTMLInputElement>(
      '[data-testid="consultation-requirement"]',
    );
    requirement!.value = '补充免疫组化';
    requirement!.dispatchEvent(new Event('input'));

    const diagnosis = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="consultation-clinical-diagnosis"]',
    );
    diagnosis!.value = '更新后的会诊诊断';
    diagnosis!.dispatchEvent(new Event('input'));
    await flushView();

    findButton('保存会诊项').click();
    await flushView();
    await flushView();

    expect(
      mockSaveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
    ).toHaveBeenCalledWith(
      'CASE-3',
      expect.objectContaining({
        patientInfo: expect.objectContaining({
          clinicalDiagnosis: '更新后的会诊诊断',
          deliveryRequirement: '补充免疫组化',
        }),
      }),
    );
    expect(mockUpdateApplication).toHaveBeenCalledWith(
      'APP-3',
      expect.objectContaining({
        clinicalDiagnosis: '更新后的会诊诊断',
        externalOrderNo: 'CONS-002',
        sourceHospitalName: '外院B',
      }),
    );
    expect(mockSaveTechnicalSpecimenRegistrationMaterials).toHaveBeenCalledWith(
      'CASE-3',
      expect.objectContaining({
        materials: [
          expect.objectContaining({
            sourcePart: '肺',
            specimenName: 'IHC',
            tissueCount: 2,
          }),
        ],
      }),
    );

    app.unmount();
    root.remove();
  });

  it('verifies and cancels verification for the selected specimen', async () => {
    const { app, root } = mountView();
    await flushView();

    expect(findButton('打印标签').disabled).toBe(true);
    expect(findButton('标本核对').disabled).toBe(true);
    expect(findButton('取消核对').disabled).toBe(true);
    expect(document.body.textContent).toContain('未核对');

    const selector = document.querySelector<HTMLInputElement>(
      'input[name="technical-registration-material"]',
    );
    expect(selector).toBeTruthy();
    selector!.checked = true;
    selector!.dispatchEvent(new Event('change'));
    await flushView();

    expect(findButton('打印标签').disabled).toBe(false);
    expect(findButton('标本核对').disabled).toBe(false);
    findButton('标本核对').click();
    await flushView();

    expect(
      mockVerifyTechnicalSpecimenRegistrationMaterial,
    ).toHaveBeenCalledWith('CASE-1', 'SP-1', { terminalCode: 'T-M3-SPEC-REG' });
    expect(document.body.textContent).toContain('已核对');
    expect(document.body.textContent).not.toContain('2026-06-02 11:30');
    expect(document.body.textContent).not.toContain('Receiver A');

    const refreshedSelector = document.querySelector<HTMLInputElement>(
      'input[name="technical-registration-material"]',
    );
    refreshedSelector!.checked = true;
    refreshedSelector!.dispatchEvent(new Event('change'));
    await flushView();

    findButton('取消核对').click();
    await flushView();

    expect(
      mockCancelTechnicalSpecimenRegistrationMaterialVerification,
    ).toHaveBeenCalledWith('CASE-1', 'SP-1', {
      terminalCode: 'T-M3-SPEC-REG',
    });
    expect(document.body.textContent).toContain('未核对');

    app.unmount();
    root.remove();
  });

  it('uploads and deletes media assets from the right-side media panel', async () => {
    const { app, root } = mountView();
    await flushView();

    document
      .querySelector<HTMLElement>('[data-testid="media-panel-shell"]')
      ?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await flushView();

    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(fileInput).toBeTruthy();
    const file = new File(['image'], 'upload.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput!, 'files', {
      configurable: true,
      value: [file],
    });
    fileInput!.dispatchEvent(new Event('change'));
    await flushView();
    await flushView();

    expect(
      mockUploadTechnicalSpecimenRegistrationMediaAsset,
    ).toHaveBeenCalledWith('CASE-1', file);
    expect(document.body.textContent).toContain('upload.jpg');

    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="删除图片 upload.jpg"]',
      )
      ?.click();
    await flushView();
    await flushView();

    expect(
      mockDeleteTechnicalSpecimenRegistrationMediaAsset,
    ).toHaveBeenCalledWith('CASE-1', 'ASSET-UPLOADED');
    expect(
      document.querySelector<HTMLElement>('[data-testid="media-panel-shell"]')
        ?.dataset.expanded,
    ).toBe('true');

    app.unmount();
    root.remove();
  });

  it('captures a camera frame and uploads it from the right-side media panel', async () => {
    const cameraDoubles = installCameraTestDoubles();
    const { app, root } = mountView();
    try {
      await flushView();

      const mediaShell = document.querySelector<HTMLElement>(
        '[data-testid="media-panel-shell"]',
      );
      expect(mediaShell).toBeTruthy();

      document
        .querySelector<HTMLElement>('[data-testid="media-panel-shell"]')
        ?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await flushView();

      expect(cameraDoubles.getUserMedia).toHaveBeenCalledWith({
        audio: false,
        video: {
          facingMode: 'environment',
        },
      });
      expect(document.body.textContent).toContain('摄像头画面');
      expect(document.body.textContent).toContain('预览中');

      vi.useFakeTimers();
      mediaShell!.dispatchEvent(
        new MouseEvent('mouseleave', { bubbles: true }),
      );
      await flushView();

      findButton('拍照').click();
      await flushView();
      await flushView();

      const uploadedFile =
        mockUploadTechnicalSpecimenRegistrationMediaAsset.mock.calls.at(
          -1,
        )?.[1];
      expect(cameraDoubles.drawImage).toHaveBeenCalled();
      expect(uploadedFile).toBeInstanceOf(File);
      expect((uploadedFile as File).name).toMatch(
        /^registration-camera-.*\.jpg$/,
      );
      expect((uploadedFile as File).type).toBe('image/jpeg');
      expect(cameraDoubles.stopTrack).not.toHaveBeenCalled();
      expect(mediaShell?.dataset.expanded).toBe('true');

      await vi.advanceTimersByTimeAsync(1500);
      await flushView();
      expect(mediaShell?.dataset.expanded).toBe('true');
      vi.useRealTimers();

      const previewSwitch = document.querySelector<HTMLInputElement>(
        'input[role="switch"][aria-label="预览开关"]',
      );
      expect(previewSwitch).toBeTruthy();
      expect(previewSwitch!.checked).toBe(true);
      previewSwitch!.checked = false;
      previewSwitch!.dispatchEvent(new Event('change'));
      await flushView();

      expect(cameraDoubles.stopTrack).toHaveBeenCalled();
      expect(document.body.textContent).toContain('已关闭');
    } finally {
      vi.useRealTimers();
      app.unmount();
      root.remove();
      cameraDoubles.restore();
    }
  });

  it('collapses the media panel after a delay and keeps the workbench grid stable', async () => {
    const { app, root } = mountView();
    try {
      await flushView();

      const mediaShell = document.querySelector<HTMLElement>(
        '[data-testid="media-panel-shell"]',
      );
      const registrationGrid = document.querySelector<HTMLElement>(
        '[data-testid="registration-workbench-grid"]',
      );
      expect(mediaShell).toBeTruthy();
      expect(registrationGrid).toBeTruthy();
      const collapsedGridClassName = registrationGrid!.className;
      expect(mediaShell?.dataset.expanded).toBe('false');
      expect(mediaShell?.textContent).toContain('暂无登记图片');
      expect(mediaShell?.textContent).not.toContain('导入图片');

      vi.useFakeTimers();

      mediaShell!.dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await flushView();

      expect(mediaShell?.dataset.expanded).toBe('true');
      expect(registrationGrid?.className).toBe(collapsedGridClassName);
      expect(mediaShell?.textContent).toContain('导入图片');

      mediaShell!.dispatchEvent(
        new MouseEvent('mouseleave', { bubbles: true }),
      );
      await flushView();
      expect(mediaShell?.dataset.expanded).toBe('true');

      await vi.advanceTimersByTimeAsync(1499);
      await flushView();
      expect(mediaShell?.dataset.expanded).toBe('true');

      await vi.advanceTimersByTimeAsync(1);
      await flushView();

      expect(mediaShell?.dataset.expanded).toBe('false');
      expect(registrationGrid?.className).toBe(collapsedGridClassName);
    } finally {
      vi.useRealTimers();
      app.unmount();
      root.remove();
    }
  });

  it('completes registration and stays on the registration workstation', async () => {
    const { app, root } = mountView();
    await flushView();

    const remarksInput = document.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="补充技术登记备注（选填）"]',
    );
    expect(remarksInput).toBeNull();

    const pathologyNoInput = findPathologyNoInput();
    pathologyNoInput.value = 'BL202606080099';
    pathologyNoInput.dispatchEvent(new Event('input'));
    await flushView();

    findButton('完成登记').click();
    await flushView();
    await flushView();

    expect(mockCompleteTechnicalSpecimenRegistration).toHaveBeenCalledWith(
      'CASE-1',
      {
        applicationType: 'ROUTINE',
        pathologyNo: 'BL202606080099',
        terminalCode: 'T-M3-SPEC-REG',
      },
    );
    expect(mockGoToTasks).not.toHaveBeenCalled();

    app.unmount();
    root.remove();
  });
});
