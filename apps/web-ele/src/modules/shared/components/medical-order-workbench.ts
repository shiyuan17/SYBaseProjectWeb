import type { MedicalOrderSummary } from '#/modules/doctor-workflow/types/doctor-workflow';

export type MedicalOrderBlockOptionSource = 'CASE_BLOCK' | 'MEDICAL_ORDER_ONLY';

export interface MedicalOrderBlockOption {
  blockCode?: null | string;
  description?: null | string;
  label: string;
  optionId: string;
  source: MedicalOrderBlockOptionSource;
  targetBlockId?: null | string;
}

export interface MedicalOrderWorkbenchValue {
  blockOptions: MedicalOrderBlockOption[];
  canCreateMedicalOrder: boolean;
  caseId: string;
  medicalOrders: MedicalOrderSummary[];
  pathologyNo?: null | string;
  readonly?: boolean;
}
