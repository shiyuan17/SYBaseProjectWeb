import type { TechnicalSpecimenRegistrationWorkspace } from '../../types/technical-workflow';

import type { ApplicationRegistrationWorkbenchRecord } from '#/modules/specimen-workflow/types/application-registration-workbench';

import { createApp, h, nextTick, ref } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAlertStub,
  createButtonStub,
  createEmptyStub,
} from '#/modules/specimen-workflow/test-utils/component-stubs';

vi.mock('element-plus', () => ({
  ElAlert: createAlertStub(),
  ElButton: createButtonStub(),
  ElEmpty: createEmptyStub(),
}));

import TechnicalSpecimenRegistrationApplicationSummaryCard from './TechnicalSpecimenRegistrationApplicationSummaryCard.vue';

function createRecord(): ApplicationRegistrationWorkbenchRecord {
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
      applicationNo: 'AP202606010001',
      applyDept: '临床科室',
      applyDoctor: '医生甲',
      bedNo: '',
      checkItem: 'HE',
      clinicalDiagnosis: '',
      clinicalHistory: '',
      deliveryRequirement: '',
      endoscopyDiagnosis: '',
      frozenReminder: false,
      gender: '女',
      idNo: '',
      imagingResult: '',
      inpatientNo: 'INP-1',
      patientName: '患者甲',
      patientVerified: true,
      phone: '',
      registrationStatus: 'PENDING',
      remark: '',
      specimenType: 'ROUTINE',
      wardName: '',
    },
    specimenItems: [],
    surgeryInfo: {
      buildingId: '',
      clinicalFindings: '',
      fixativeType: '',
      fixationPerson: '',
      fixationTime: '2026-06-01T09:00:00',
      roomId: '',
      specimenRemovalTime: '2026-06-01T07:30:00',
      surgeryName: '',
    },
  };
}

function createWorkspace(): TechnicalSpecimenRegistrationWorkspace {
  return {
    actionFlags: {
      canCompleteRegistration: true,
      canDeleteMediaAssets: true,
      canSaveDetailSections: true,
      canSaveMaterials: true,
      canUploadMediaAssets: true,
    },
    basicInfo: {
      applicationNo: 'AP202606010001',
      applicationType: 'ROUTINE',
      fixationTime: '2026-06-01T09:00:00',
      inpatientNo: 'INP-1',
      pathologyNo: 'BL202606010007',
      patientAge: '34',
      patientGender: '女',
      patientId: 'P-1',
      patientName: '患者甲',
      registrationStatus: 'PENDING',
      specimenRemovalTime: '2026-06-01T07:30:00',
      submissionDate: '2026-06-01',
      submittingDepartmentName: '临床科室',
      submittingDoctorName: '医生甲',
    },
    checkItems: [],
    detailSections: {
      clinicalExaminationAndSurgeryFindings: null,
      clinicalSubmissionRequirements: null,
      externalPathologyDiagnosis: null,
      historySummary: null,
      infectiousAndPastHistorySummary: null,
      labAndImagingExaminations: null,
    },
    materials: [],
    mediaAssets: [],
    pendingSummary: {
      applicationId: 'APP-1',
      applicationNo: 'AP202606010001',
      applicationType: 'ROUTINE',
      caseId: 'CASE-1',
      checkItem: 'HE',
      inpatientNo: 'INP-1',
      pathologyNo: 'BL202606010007',
      patientId: 'P-1',
      patientName: '患者甲',
      receivedAt: '2026-06-01T08:30:00',
      registeredAt: null,
      registeredByName: null,
      registrationStatus: 'PENDING',
      submittingDepartmentName: '临床科室',
    },
  };
}

async function flushView() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('TechnicalSpecimenRegistrationApplicationSummaryCard', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lists compact receive checklist types and emits the selected type', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const selectedApplicationType = ref('ROUTINE');

    const app = createApp({
      render() {
        return h(TechnicalSpecimenRegistrationApplicationSummaryCard, {
          record: createRecord(),
          selectedApplicationType: selectedApplicationType.value,
          workspace: createWorkspace(),
          'onUpdate:applicationType': (value: string) => {
            selectedApplicationType.value = value;
          },
        });
      },
    });

    app.mount(root);
    await flushView();

    expect(root.textContent).toContain('补充报告');
    expect(root.textContent).toContain('肝穿');
    expect(root.textContent).not.toContain('BL202606010007');

    root
      .querySelector<HTMLButtonElement>(
        '[data-testid="application-type-SUPPLEMENTAL_REPORT"]',
      )
      ?.click();
    await flushView();

    expect(
      root
        .querySelector<HTMLButtonElement>(
          '[data-testid="application-type-SUPPLEMENTAL_REPORT"]',
        )
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(root.textContent).not.toContain('默认生成');

    app.unmount();
    root.remove();
  });

  it('prefers the selected registration application type over workspace defaults', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render() {
        return h(TechnicalSpecimenRegistrationApplicationSummaryCard, {
          record: createRecord(),
          selectedApplicationType: 'CONSULTATION',
          workspace: createWorkspace(),
        });
      },
    });

    app.mount(root);
    await flushView();

    expect(
      root
        .querySelector<HTMLButtonElement>(
          '[data-testid="application-type-CONSULTATION"]',
        )
        ?.getAttribute('aria-pressed'),
    ).toBe('true');

    app.unmount();
    root.remove();
  });
});
