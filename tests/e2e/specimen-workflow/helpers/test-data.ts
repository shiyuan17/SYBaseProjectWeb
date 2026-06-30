export type WorkflowRunData = {
  applicationNo: string;
  clinicalDiagnosis: string;
  clinicalSymptom: string;
  externalOrderNo: string;
  patientId: string;
  patientName: string;
  specimenName: string;
  specimenSite: string;
};

function buildSuffix() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${stamp}${random}`;
}

export function createWorkflowRunData(): WorkflowRunData {
  const suffix = buildSuffix();

  return {
    applicationNo: `APP-M2-E2E-${suffix}`,
    clinicalDiagnosis: 'Papillary thyroid carcinoma',
    clinicalSymptom: 'Neck mass',
    externalOrderNo: `EXT-M2-E2E-${suffix}`,
    // 本地 dev 库对 applications.patient_id 有外键约束，E2E 默认仅使用患者姓名建单。
    patientId: '',
    patientName: `E2E患者${suffix.slice(-4)}`,
    specimenName: 'Thyroid Tissue',
    specimenSite: 'Thyroid',
  };
}
