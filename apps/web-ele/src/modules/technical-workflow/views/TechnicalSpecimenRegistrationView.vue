<script setup lang="ts">
import type {
  PendingTechnicalSpecimenRegistrationItem,
  SaveTechnicalSpecimenRegistrationMaterialItem,
  TechnicalSpecimenRegistrationDetailSections,
  TechnicalSpecimenRegistrationMaterial,
  TechnicalSpecimenRegistrationStatus,
  TechnicalSpecimenRegistrationWorkspace,
} from '../types/technical-workflow';

import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';
import type {
  ApplicationDetailView,
  ApplicationUpdateRequest,
} from '#/modules/specimen-workflow/types/specimen-workflow';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { Page } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import {
  getApplicationDetail,
  updateApplication,
} from '#/modules/specimen-workflow/api/specimen-workflow-service';
import { reportInlineErrorDisabled } from '#/utils/error-feedback';

import {
  cancelTechnicalSpecimenRegistrationMaterialVerification,
  completeTechnicalSpecimenRegistration,
  deleteTechnicalSpecimenRegistrationMediaAsset,
  getTechnicalSpecimenRegistrationApplicationWorkbench,
  getTechnicalSpecimenRegistrationWorkspace,
  listTechnicalSpecimenRegistrations,
  saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo,
  saveTechnicalSpecimenRegistrationDetailSections,
  saveTechnicalSpecimenRegistrationMaterials,
  uploadTechnicalSpecimenRegistrationMediaAsset,
  verifyTechnicalSpecimenRegistrationMaterial,
} from '../api/technical-workflow-service';
import TechnicalSpecimenRegistrationMediaPanel from '../components/specimen-registration/TechnicalSpecimenRegistrationMediaPanel.vue';
import TechnicalSpecimenRegistrationPendingListPanel from '../components/specimen-registration/TechnicalSpecimenRegistrationPendingListPanel.vue';
import TechnicalSpecimenRegistrationWorkspacePanel from '../components/specimen-registration/TechnicalSpecimenRegistrationWorkspacePanel.vue';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getWorkflowPageErrorMessage } from '../utils/error';
import {
  isTechnicalRegistrationConsultationApplicationType,
  isTechnicalRegistrationPathologyNoPreview,
  resolveTechnicalRegistrationApplicationType,
  resolveTechnicalRegistrationPathologyNo,
} from '../utils/specimen-registration-application';

type RegistrationListTab = 'received' | 'registered';

const pendingLoading = ref(false);
const workspaceLoading = ref(false);
const consultationContextLoading = ref(false);
const detailSectionSaving = ref(false);
const materialSaving = ref(false);
const materialVerificationSaving = ref(false);
const mediaUploading = ref(false);
const mediaDeleting = ref(false);
const submitting = ref(false);
const pageError = ref('');
const workspaceError = ref('');
const pendingItems = ref<PendingTechnicalSpecimenRegistrationItem[]>([]);
const total = ref(0);
const selectedCaseId = ref('');
const consultationApplicationDetail = ref<ApplicationDetailView | null>(null);
const consultationWorkbench =
  ref<ApplicationRegistrationWorkbenchRecord | null>(null);
const workspace = ref<null | TechnicalSpecimenRegistrationWorkspace>(null);
const activeRegistrationListTab = ref<RegistrationListTab>('received');
const selectedRegistrationApplicationType = ref('');
const pathologyNoDraft = ref('');
const pathologyNoDraftTouched = ref(false);
const pathologyNoDraftCaseId = ref('');
const activeMediaAssetId = ref('');
const mediaPanelExpanded = ref(false);

let mediaPanelCollapseTimer: null | ReturnType<typeof setTimeout> = null;

const filters = reactive({
  applicationType: '',
  keyword: '',
  page: 1,
  receivedFrom: '',
  receivedTo: '',
  size: DEFAULT_PAGE_SIZE,
});

const currentPageModel = computed({
  get: () => filters.page,
  set: (page: number) => {
    filters.page = page;
    void loadPendingData(selectedCaseId.value);
  },
});

const pageSizeModel = computed({
  get: () => filters.size,
  set: (size: number) => {
    filters.size = size;
    filters.page = 1;
    void loadPendingData(selectedCaseId.value);
  },
});

const visiblePendingItems = computed(() => pendingItems.value);

const registrationGridClass =
  'xl:grid-cols-[320px_minmax(0,1fr)_96px] 2xl:grid-cols-[360px_minmax(0,1fr)_96px]';

function clearMediaPanelCollapseTimer() {
  if (!mediaPanelCollapseTimer) {
    return;
  }
  clearTimeout(mediaPanelCollapseTimer);
  mediaPanelCollapseTimer = null;
}

function isConsultationApplicationType(value: null | string | undefined) {
  return isTechnicalRegistrationConsultationApplicationType(value);
}

function trimOrNull(value: null | string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue || null;
}

function resolveRegistrationListStatus(): TechnicalSpecimenRegistrationStatus {
  return activeRegistrationListTab.value === 'registered'
    ? 'COMPLETED'
    : 'PENDING';
}

function clearPathologyNoDraft() {
  pathologyNoDraft.value = '';
  pathologyNoDraftTouched.value = false;
  pathologyNoDraftCaseId.value = '';
}

function resolveWorkspaceApplicationType(
  currentWorkspace: TechnicalSpecimenRegistrationWorkspace,
  applicationType?: null | string,
) {
  return resolveTechnicalRegistrationApplicationType(
    applicationType?.trim() || currentWorkspace.basicInfo.applicationType,
  );
}

function createPathologyNoDraft(
  currentWorkspace: TechnicalSpecimenRegistrationWorkspace,
  applicationType: string,
) {
  const existingPathologyNo = currentWorkspace.basicInfo.pathologyNo;
  if (
    existingPathologyNo?.trim() &&
    !isTechnicalRegistrationPathologyNoPreview({
      applicationType,
      existingPathologyNo,
    })
  ) {
    return existingPathologyNo.trim();
  }

  return resolveTechnicalRegistrationPathologyNo({
    applicationType,
    existingPathologyNo,
    referenceDate: currentWorkspace.basicInfo.submissionDate,
  });
}

function syncPathologyNoDraft(
  currentWorkspace: TechnicalSpecimenRegistrationWorkspace,
  applicationType: string,
  options: { force?: boolean } = {},
) {
  const caseId = currentWorkspace.pendingSummary.caseId.trim();
  const selectedCaseChanged = caseId !== pathologyNoDraftCaseId.value;
  if (selectedCaseChanged) {
    pathologyNoDraftTouched.value = false;
  }
  pathologyNoDraftCaseId.value = caseId;

  if (options.force || selectedCaseChanged || !pathologyNoDraftTouched.value) {
    pathologyNoDraft.value = createPathologyNoDraft(
      currentWorkspace,
      applicationType,
    );
  }
}

function syncWorkspace(
  nextWorkspace: null | TechnicalSpecimenRegistrationWorkspace,
) {
  workspace.value = nextWorkspace;
  if (!nextWorkspace) {
    clearPathologyNoDraft();
  }
  if (nextWorkspace && !selectedRegistrationApplicationType.value.trim()) {
    selectedRegistrationApplicationType.value =
      resolveTechnicalRegistrationApplicationType(
        nextWorkspace.basicInfo.applicationType,
      );
  }
  if (nextWorkspace) {
    syncPathologyNoDraft(
      nextWorkspace,
      resolveWorkspaceApplicationType(
        nextWorkspace,
        selectedRegistrationApplicationType.value,
      ),
    );
  }
  const nextActiveAssetId = nextWorkspace?.mediaAssets.some(
    (item) => item.assetId === activeMediaAssetId.value,
  )
    ? activeMediaAssetId.value
    : (nextWorkspace?.mediaAssets[0]?.assetId ?? '');
  activeMediaAssetId.value = nextActiveAssetId;
}

function clearConsultationContext() {
  consultationApplicationDetail.value = null;
  consultationWorkbench.value = null;
}

async function loadApplicationContext(
  currentWorkspace: null | TechnicalSpecimenRegistrationWorkspace,
) {
  if (!currentWorkspace) {
    clearConsultationContext();
    return;
  }

  const applicationId = currentWorkspace.pendingSummary.applicationId?.trim();
  const shouldLoadApplicationDetail =
    applicationId &&
    isConsultationApplicationType(currentWorkspace.basicInfo.applicationType);

  consultationContextLoading.value = true;
  try {
    const [applicationDetailResult, workbenchResult] = await Promise.allSettled(
      [
        shouldLoadApplicationDetail
          ? getApplicationDetail(applicationId)
          : Promise.resolve(null),
        getTechnicalSpecimenRegistrationApplicationWorkbench(
          currentWorkspace.pendingSummary.caseId,
        ),
      ],
    );

    consultationApplicationDetail.value =
      applicationDetailResult.status === 'fulfilled'
        ? applicationDetailResult.value
        : null;
    consultationWorkbench.value =
      workbenchResult.status === 'fulfilled' ? workbenchResult.value : null;
  } finally {
    consultationContextLoading.value = false;
  }
}

function createFallbackApplicationUpdateRequest(
  currentWorkspace: TechnicalSpecimenRegistrationWorkspace,
  fields: {
    clinicalDiagnosis: string;
    externalConsultationId: string;
    sourceHospitalName: string;
    sourcePart: string;
  },
): ApplicationUpdateRequest {
  const detail = consultationApplicationDetail.value;
  return {
    applicationDate: detail?.applicationDate ?? null,
    applicationNo:
      currentWorkspace.basicInfo.applicationNo ?? detail?.applicationNo ?? null,
    applicationFormStatus: detail?.applicationFormStatus ?? null,
    applicationType:
      currentWorkspace.basicInfo.applicationType ??
      detail?.applicationType ??
      'CONSULTATION',
    clinicalDiagnosis: fields.clinicalDiagnosis,
    clinicalSymptom: detail?.clinicalSymptom ?? null,
    externalOrderNo: trimOrNull(fields.externalConsultationId),
    patientAge:
      currentWorkspace.basicInfo.patientAge ?? detail?.patientAge ?? null,
    patientGender:
      currentWorkspace.basicInfo.patientGender ?? detail?.patientGender ?? null,
    patientId:
      currentWorkspace.basicInfo.patientId ?? detail?.patientId ?? null,
    patientName:
      currentWorkspace.basicInfo.patientName ?? detail?.patientName ?? null,
    remarks: detail?.remarks ?? null,
    sourceHospitalId: detail?.sourceHospitalId ?? null,
    sourceHospitalName: trimOrNull(fields.sourceHospitalName),
    specimenRemovalTime:
      currentWorkspace.basicInfo.specimenRemovalTime ??
      detail?.specimenRemovalTime ??
      null,
    specimenSite: trimOrNull(fields.sourcePart),
    status: detail?.status ?? null,
    submissionDate:
      currentWorkspace.basicInfo.submissionDate ??
      detail?.submissionDate ??
      null,
    submittingDepartmentId: detail?.submittingDepartmentId ?? null,
    submittingDepartmentName:
      currentWorkspace.basicInfo.submittingDepartmentName ??
      detail?.submittingDepartmentName ??
      null,
    submittingDoctorName:
      currentWorkspace.basicInfo.submittingDoctorName ??
      detail?.submittingDoctorName ??
      null,
    submittingDoctorUserId: detail?.submittingDoctorUserId ?? null,
    thirdPartySource: detail?.thirdPartySource ?? null,
  };
}

function createFallbackApplicationWorkbench(
  currentWorkspace: TechnicalSpecimenRegistrationWorkspace,
) {
  return {
    applicationId: currentWorkspace.pendingSummary.applicationId,
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
      age: currentWorkspace.basicInfo.patientAge ?? '',
      applicationDate: currentWorkspace.basicInfo.submissionDate ?? '',
      applicationNo: currentWorkspace.basicInfo.applicationNo ?? '',
      applyDept: currentWorkspace.basicInfo.submittingDepartmentName ?? '',
      applyDoctor: currentWorkspace.basicInfo.submittingDoctorName ?? '',
      bedNo: '',
      checkItem: '',
      clinicalDiagnosis: '',
      clinicalHistory: '',
      deliveryRequirement: '',
      endoscopyDiagnosis: '',
      frozenReminder: false,
      gender: currentWorkspace.basicInfo.patientGender ?? '',
      idNo: '',
      imagingResult: '',
      inpatientNo: currentWorkspace.basicInfo.inpatientNo ?? '',
      patientName: currentWorkspace.basicInfo.patientName ?? '',
      patientVerified: false,
      phone: '',
      registrationStatus: currentWorkspace.basicInfo.registrationStatus ?? '',
      remark: '',
      specimenType: currentWorkspace.basicInfo.applicationType ?? '',
      wardName: '',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: '',
      clinicalFindings: '',
      fixativeType: '',
      fixationPerson: '',
      fixationTime: currentWorkspace.basicInfo.fixationTime ?? '',
      roomId: '',
      specimenRemovalTime: currentWorkspace.basicInfo.specimenRemovalTime ?? '',
      surgeryName: '',
    },
  } satisfies ApplicationRegistrationWorkbenchRecord;
}

function escapePrintText(value: null | string | undefined) {
  return (value || '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildMaterialLabelPrintDocument(
  currentWorkspace: TechnicalSpecimenRegistrationWorkspace,
  material: Partial<TechnicalSpecimenRegistrationMaterial>,
) {
  const pathologyNo = currentWorkspace.basicInfo.pathologyNo || '-';
  const barcode = material.specimenBarcode || material.specimenId || '-';
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>标本标签 - ${escapePrintText(pathologyNo)}</title>
    <style>
      @page { margin: 0; size: 72mm 42mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SimHei", "Microsoft YaHei", sans-serif;
        color: #111827;
      }
      .label {
        width: 72mm;
        height: 42mm;
        padding: 3mm;
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        gap: 1.2mm;
      }
      .primary {
        font-size: 6mm;
        font-weight: 700;
        line-height: 1.1;
        word-break: break-all;
      }
      .line {
        font-size: 4.2mm;
        line-height: 1.15;
        word-break: break-word;
      }
      .name {
        font-size: 5.2mm;
        font-weight: 700;
        line-height: 1.15;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <section class="label">
      <div class="primary">${escapePrintText(pathologyNo)}</div>
      <div class="line">条码：${escapePrintText(barcode)}</div>
      <div class="line">患者：${escapePrintText(currentWorkspace.basicInfo.patientName)}</div>
      <div class="line">部位：${escapePrintText(material.sourcePart)}</div>
      <div class="name">${escapePrintText(material.specimenName)}</div>
    </section>
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
    </scr${'ipt'}>
  </body>
</html>`;
}

function handlePrintMaterialLabel(
  material: Partial<TechnicalSpecimenRegistrationMaterial>,
) {
  if (!workspace.value) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    ElMessage.warning('打印窗口被浏览器拦截，请允许弹出窗口后重试');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(
    buildMaterialLabelPrintDocument(workspace.value, material),
  );
  printWindow.document.close();
}

function expandMediaPanel() {
  clearMediaPanelCollapseTimer();
  mediaPanelExpanded.value = true;
}

function scheduleMediaPanelCollapse() {
  clearMediaPanelCollapseTimer();
  mediaPanelCollapseTimer = setTimeout(() => {
    mediaPanelExpanded.value = false;
    mediaPanelCollapseTimer = null;
  }, 1500);
}

function handleMediaFocusOut(event: FocusEvent) {
  const nextTarget = event.relatedTarget;
  if (nextTarget instanceof Node) {
    const currentTarget = event.currentTarget;
    if (
      currentTarget instanceof HTMLElement &&
      currentTarget.contains(nextTarget)
    ) {
      return;
    }
  }
  scheduleMediaPanelCollapse();
}

function clearSelectedCaseContext() {
  syncWorkspace(null);
  clearConsultationContext();
  selectedRegistrationApplicationType.value = '';
  clearPathologyNoDraft();
  workspaceError.value = '';
}

async function syncVisibleSelection(
  preferredCaseId?: string,
  options: { forceLoad?: boolean } = {},
) {
  const nextSelectedCaseId =
    preferredCaseId &&
    visiblePendingItems.value.some((item) => item.caseId === preferredCaseId)
      ? preferredCaseId
      : (visiblePendingItems.value[0]?.caseId ?? '');

  if (!nextSelectedCaseId) {
    selectedCaseId.value = '';
    clearSelectedCaseContext();
    return;
  }

  const selectedCaseChanged = nextSelectedCaseId !== selectedCaseId.value;
  if (!selectedCaseChanged && !options.forceLoad && workspace.value) {
    return;
  }

  if (selectedCaseChanged) {
    selectedRegistrationApplicationType.value = '';
    clearPathologyNoDraft();
  }
  selectedCaseId.value = nextSelectedCaseId;
  await loadWorkspace(nextSelectedCaseId);
}

async function loadPendingData(preferredCaseId?: string) {
  pendingLoading.value = true;
  pageError.value = '';
  try {
    const result = await listTechnicalSpecimenRegistrations({
      applicationType: filters.applicationType.trim() || undefined,
      keyword: filters.keyword.trim() || undefined,
      page: filters.page,
      receivedFrom: filters.receivedFrom || undefined,
      receivedTo: filters.receivedTo || undefined,
      registrationStatus: resolveRegistrationListStatus(),
      size: filters.size,
    });
    pendingItems.value = result.items;
    total.value = result.total;
    await syncVisibleSelection(preferredCaseId, { forceLoad: true });
  } catch (error) {
    pendingItems.value = [];
    total.value = 0;
    clearSelectedCaseContext();
    pageError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    pendingLoading.value = false;
  }
}

async function loadWorkspace(caseId: string) {
  if (!caseId.trim()) {
    syncWorkspace(null);
    workspaceError.value = '';
    return;
  }
  workspaceLoading.value = true;
  workspaceError.value = '';
  try {
    const result = await getTechnicalSpecimenRegistrationWorkspace(caseId);
    syncWorkspace(result);
    workspaceLoading.value = false;
    await loadApplicationContext(result);
  } catch (error) {
    syncWorkspace(null);
    clearConsultationContext();
    workspaceError.value = getWorkflowPageErrorMessage(error);
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    workspaceLoading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  void loadPendingData(selectedCaseId.value);
}

function handleRowSelect(row: PendingTechnicalSpecimenRegistrationItem) {
  if (row.caseId === selectedCaseId.value) {
    return;
  }
  selectedRegistrationApplicationType.value = '';
  clearPathologyNoDraft();
  selectedCaseId.value = row.caseId;
  void loadWorkspace(row.caseId);
}

function handleSelectedRegistrationApplicationTypeUpdate(value: string) {
  const nextApplicationType =
    resolveTechnicalRegistrationApplicationType(value);
  selectedRegistrationApplicationType.value = nextApplicationType;
  pathologyNoDraftTouched.value = false;
  if (workspace.value) {
    syncPathologyNoDraft(workspace.value, nextApplicationType, {
      force: true,
    });
  }
}

function handlePathologyNoDraftUpdate(value: string) {
  pathologyNoDraft.value = value;
  pathologyNoDraftTouched.value = true;
  pathologyNoDraftCaseId.value = workspace.value?.pendingSummary.caseId ?? '';
}

async function handleSaveMaterials(
  materials: SaveTechnicalSpecimenRegistrationMaterialItem[],
) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  materialSaving.value = true;
  try {
    const result = await saveTechnicalSpecimenRegistrationMaterials(
      currentCaseId,
      {
        materials,
        terminalCode: 'T-M3-SPEC-REG',
      },
    );
    syncWorkspace(result);
    ElMessage.success('标本修改已保存');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    materialSaving.value = false;
  }
}

async function handleSaveConsultationItem(payload: {
  consultationFields: {
    clinicalDiagnosis: string;
    consultationRequirement: string;
    externalConsultationId: string;
    materialType: string;
    quantity: number;
    sourceHospitalName: string;
    sourcePart: string;
  };
  materials: SaveTechnicalSpecimenRegistrationMaterialItem[];
}) {
  const currentCaseId = selectedCaseId.value.trim();
  const currentWorkspace = workspace.value;
  const applicationId = currentWorkspace?.pendingSummary.applicationId?.trim();
  if (!currentCaseId || !currentWorkspace || !applicationId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }

  materialSaving.value = true;
  try {
    const workbenchSeed =
      consultationWorkbench.value ??
      createFallbackApplicationWorkbench(currentWorkspace);
    const updatedWorkbench =
      await saveTechnicalSpecimenRegistrationApplicationWorkbenchPatientInfo(
        currentCaseId,
        {
          contagiousSpecimen: { ...workbenchSeed.contagiousSpecimen },
          gynecologyInfo: {
            ...workbenchSeed.gynecologyInfo,
            specialConditions: {
              ...workbenchSeed.gynecologyInfo.specialConditions,
            },
          },
          patientInfo: {
            ...workbenchSeed.patientInfo,
            clinicalDiagnosis: payload.consultationFields.clinicalDiagnosis,
            deliveryRequirement:
              payload.consultationFields.consultationRequirement,
          },
          surgeryInfo: { ...workbenchSeed.surgeryInfo },
        },
      );

    await updateApplication(
      applicationId,
      createFallbackApplicationUpdateRequest(
        currentWorkspace,
        payload.consultationFields,
      ),
    );

    const result = await saveTechnicalSpecimenRegistrationMaterials(
      currentCaseId,
      {
        materials: payload.materials,
        terminalCode: 'T-M3-SPEC-REG',
      },
    );

    consultationWorkbench.value = updatedWorkbench;
    consultationApplicationDetail.value = consultationApplicationDetail.value
      ? {
          ...consultationApplicationDetail.value,
          clinicalDiagnosis: payload.consultationFields.clinicalDiagnosis,
          externalOrderNo: trimOrNull(
            payload.consultationFields.externalConsultationId,
          ),
          sourceHospitalName: trimOrNull(
            payload.consultationFields.sourceHospitalName,
          ),
          specimenSite: trimOrNull(payload.consultationFields.sourcePart),
        }
      : consultationApplicationDetail.value;
    syncWorkspace(result);
    ElMessage.success('会诊项已保存');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    materialSaving.value = false;
  }
}

async function handleVerifyMaterial(specimenId: string) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  materialVerificationSaving.value = true;
  try {
    const result = await verifyTechnicalSpecimenRegistrationMaterial(
      currentCaseId,
      specimenId,
      { terminalCode: 'T-M3-SPEC-REG' },
    );
    syncWorkspace(result);
    ElMessage.success('标本已核对');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    materialVerificationSaving.value = false;
  }
}

async function handleCancelMaterialVerification(specimenId: string) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  materialVerificationSaving.value = true;
  try {
    const result =
      await cancelTechnicalSpecimenRegistrationMaterialVerification(
        currentCaseId,
        specimenId,
        { terminalCode: 'T-M3-SPEC-REG' },
      );
    syncWorkspace(result);
    ElMessage.success('标本核对已取消');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    materialVerificationSaving.value = false;
  }
}

async function handleSaveDetailSections(
  detailSections: TechnicalSpecimenRegistrationDetailSections,
) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  detailSectionSaving.value = true;
  try {
    const result = await saveTechnicalSpecimenRegistrationDetailSections(
      currentCaseId,
      {
        detailSections,
        terminalCode: 'T-M3-SPEC-REG',
      },
    );
    syncWorkspace(result);
    ElMessage.success('摘要内容已保存');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    detailSectionSaving.value = false;
  }
}

async function handleUploadMediaAsset(file: File) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  clearMediaPanelCollapseTimer();
  mediaPanelExpanded.value = true;
  mediaUploading.value = true;
  try {
    await uploadTechnicalSpecimenRegistrationMediaAsset(currentCaseId, file);
    await loadWorkspace(currentCaseId);
    clearMediaPanelCollapseTimer();
    mediaPanelExpanded.value = true;
    ElMessage.success('图片已导入');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    mediaUploading.value = false;
  }
}

async function handleDeleteMediaAsset(assetId: string) {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  mediaDeleting.value = true;
  try {
    await deleteTechnicalSpecimenRegistrationMediaAsset(currentCaseId, assetId);
    await loadWorkspace(currentCaseId);
    clearMediaPanelCollapseTimer();
    mediaPanelExpanded.value = true;
    ElMessage.success('图片已删除');
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    mediaDeleting.value = false;
  }
}

async function handleCompleteRegistration() {
  const currentCaseId = selectedCaseId.value.trim();
  if (!currentCaseId) {
    ElMessage.warning('请先选择待登记病例');
    return;
  }
  submitting.value = true;
  try {
    await completeTechnicalSpecimenRegistration(currentCaseId, {
      applicationType:
        resolveTechnicalRegistrationApplicationType(
          selectedRegistrationApplicationType.value,
        ) || undefined,
      pathologyNo: pathologyNoDraft.value.trim() || undefined,
      terminalCode: 'T-M3-SPEC-REG',
    });
    ElMessage.success('标本登记完成，已进入取材前置队列');
    await loadPendingData();
  } catch (error) {
    reportInlineErrorDisabled(error, getWorkflowPageErrorMessage);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  void loadPendingData();
});

onBeforeUnmount(() => {
  clearMediaPanelCollapseTimer();
});

watch(
  () => filters.applicationType,
  () => {
    filters.page = 1;
    void loadPendingData(selectedCaseId.value);
  },
);

watch(activeRegistrationListTab, () => {
  filters.page = 1;
  void loadPendingData();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-4">
      <div
        class="grid gap-4 transition-[grid-template-columns] duration-300 ease-in-out"
        :class="registrationGridClass"
        data-testid="registration-workbench-grid"
      >
        <TechnicalSpecimenRegistrationPendingListPanel
          v-model:active-tab="activeRegistrationListTab"
          v-model:application-type="filters.applicationType"
          v-model:keyword="filters.keyword"
          v-model:page="currentPageModel"
          v-model:received-from="filters.receivedFrom"
          v-model:received-to="filters.receivedTo"
          v-model:size="pageSizeModel"
          :items="visiblePendingItems"
          :loading="pendingLoading"
          :selected-case-id="selectedCaseId"
          :total="total"
          @search="handleSearch"
          @select="handleRowSelect"
        />

        <TechnicalSpecimenRegistrationWorkspacePanel
          :consultation-application-detail="consultationApplicationDetail"
          :consultation-context-loading="consultationContextLoading"
          :consultation-workbench="consultationWorkbench"
          :detail-section-saving="detailSectionSaving"
          :loading="workspaceLoading"
          :material-saving="materialSaving"
          :material-verification-saving="materialVerificationSaving"
          :pathology-no-draft="pathologyNoDraft"
          :selected-application-type="selectedRegistrationApplicationType"
          :submitting="submitting"
          :workspace="workspace"
          @cancel-material-verification="handleCancelMaterialVerification"
          @complete="handleCompleteRegistration"
          @print-material-label="handlePrintMaterialLabel"
          @save-consultation-item="handleSaveConsultationItem"
          @save-detail-sections="handleSaveDetailSections"
          @save-materials="handleSaveMaterials"
          @update:pathology-no-draft="handlePathologyNoDraftUpdate"
          @update:selected-application-type="
            handleSelectedRegistrationApplicationTypeUpdate
          "
          @verify-material="handleVerifyMaterial"
        />

        <div
          class="relative z-10 min-h-[760px] min-w-0 overflow-visible"
          data-testid="media-panel-shell"
          :data-expanded="mediaPanelExpanded ? 'true' : 'false'"
          @focusin="expandMediaPanel"
          @focusout="handleMediaFocusOut"
          @mouseenter="expandMediaPanel"
          @mouseleave="scheduleMediaPanelCollapse"
        >
          <div
            class="absolute right-0 top-0 z-20 flex min-h-[760px] transition-[width] duration-300"
            :class="
              mediaPanelExpanded
                ? 'w-full xl:w-[660px] 2xl:w-[720px]'
                : 'w-full xl:w-24'
            "
          >
            <TechnicalSpecimenRegistrationMediaPanel
              :active-asset-id="activeMediaAssetId"
              :can-delete="workspace?.actionFlags.canDeleteMediaAssets ?? false"
              :can-upload="workspace?.actionFlags.canUploadMediaAssets ?? false"
              :collapsed="!mediaPanelExpanded"
              :deleting="mediaDeleting"
              :media-assets="workspace?.mediaAssets ?? []"
              :uploading="mediaUploading"
              @delete="handleDeleteMediaAsset"
              @select="activeMediaAssetId = $event"
              @upload="handleUploadMediaAsset"
            />
          </div>
        </div>
      </div>

      <p class="text-xs text-muted-foreground">
        当前保留阶段动作：保存摘要、保存标本修改、导入图片、拍照、删除图片、完成登记；病理检查号仅展示接收阶段已生成编号。
      </p>
    </div>
  </Page>
</template>
