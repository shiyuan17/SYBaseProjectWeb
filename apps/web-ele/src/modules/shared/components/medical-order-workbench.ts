import type { MedicalOrderSummary } from '#/modules/doctor-workflow/types/doctor-workflow';

export interface MedicalOrderBlockOption {
  blockCode?: null | string;
  blockId: string;
  description?: null | string;
  label: string;
}

export interface MedicalOrderWorkbenchValue {
  blockOptions: MedicalOrderBlockOption[];
  canCreateMedicalOrder: boolean;
  caseId: string;
  medicalOrders: MedicalOrderSummary[];
  pathologyNo?: null | string;
  readonly?: boolean;
}
