import type {
  LatestSpecimenRegistrationResult,
  SpecimenRegisterItemRequest,
  SpecimenRegisterRequest,
  SpecimenTrackingSummary,
} from '../types/specimen-workflow';

export type RegisterRow = SpecimenRegisterItemRequest & {
  key: number;
};

export type RegisterFormState = {
  collectionScene: string;
  operatorName: string;
  operatorUserId: string;
  printerCode: string;
  remarks: string;
  terminalCode: string;
};

export type RegisterRowSeed = Omit<RegisterRow, 'key'>;

export type RegisterFormSnapshot = RegisterFormState & {
  items: RegisterRowSeed[];
};

export function createDefaultRegisterFormState(
  operatorName: string,
  operatorUserId: string,
): RegisterFormState {
  return {
    collectionScene: '',
    operatorName,
    operatorUserId,
    printerCode: '',
    remarks: '',
    terminalCode: '',
  };
}

export function createEmptyRegisterRowSeed(): RegisterRowSeed {
  return {
    barcode: '',
    clinicalSymptom: '',
    collectionMode: '',
    containerCount: 1,
    containerName: '',
    specimenCount: 1,
    specimenNameStandardized: '',
    specimenSite: '',
    specimenType: '',
  };
}

export function mapSpecimenToRegisterRowSeed(
  specimen: SpecimenTrackingSummary,
): RegisterRowSeed {
  return {
    barcode: specimen.barcode ?? '',
    clinicalSymptom: specimen.clinicalSymptom ?? '',
    collectionMode: specimen.collectionMode ?? '',
    containerCount: specimen.containerCount ?? 1,
    containerName: specimen.containerName ?? '',
    specimenCount: specimen.specimenCount ?? 1,
    specimenNameStandardized: specimen.specimenName ?? '',
    specimenSite: specimen.specimenSite ?? '',
    specimenType: specimen.specimenType ?? '',
  };
}

export function buildRegisterFormSnapshot(
  result: LatestSpecimenRegistrationResult | null,
  currentOperatorName: string,
  currentOperatorUserId: string,
): null | RegisterFormSnapshot {
  if (!result) {
    return null;
  }

  const itemSeeds = result.specimens.map((item) =>
    mapSpecimenToRegisterRowSeed(item),
  );
  const snapshot = result.registrationSnapshot;
  if (!snapshot && itemSeeds.length === 0) {
    return null;
  }

  return {
    collectionScene: snapshot?.collectionScene ?? '',
    items: itemSeeds.length > 0 ? itemSeeds : [createEmptyRegisterRowSeed()],
    operatorName: snapshot?.operatorName ?? currentOperatorName,
    operatorUserId: snapshot?.operatorUserId ?? currentOperatorUserId,
    printerCode: snapshot?.printerCode ?? '',
    remarks: snapshot?.remarks ?? '',
    terminalCode: snapshot?.terminalCode ?? '',
  };
}

export function validateRegisterItems(
  items: Array<{
    barcode: null | string;
    clinicalSymptom: null | string;
    collectionMode: null | string;
    containerCount: number;
    containerName: string;
    specimenCount: number;
    specimenNameStandardized: string;
    specimenSite: null | string;
    specimenType: null | string;
  }>,
) {
  if (items.some((item) => !item.specimenNameStandardized)) {
    return '请完整填写每一行标本名称';
  }
  if (items.some((item) => !item.specimenSite)) {
    return '请完整填写每一行标本部位';
  }
  if (items.some((item) => !item.containerName)) {
    return '请完整填写每一行容器名称';
  }
  if (items.some((item) => !item.specimenCount || item.specimenCount < 1)) {
    return '标本数量必须大于 0';
  }
  if (items.some((item) => !item.containerCount || item.containerCount < 1)) {
    return '容器数量必须大于 0';
  }

  const barcodeSet = new Set<string>();
  for (const item of items) {
    if (!item.barcode) {
      continue;
    }
    if (barcodeSet.has(item.barcode)) {
      return '同一次登记中的条码不能重复';
    }
    barcodeSet.add(item.barcode);
  }

  return '';
}

export function buildRegisterSubmissionRequest(
  applicationId: string,
  form: RegisterFormState,
  items: Array<{
    barcode: null | string;
    clinicalSymptom: null | string;
    collectionMode: null | string;
    containerCount: number;
    containerName: string;
    specimenCount: number;
    specimenNameStandardized: string;
    specimenSite: null | string;
    specimenType: null | string;
  }>,
): SpecimenRegisterRequest {
  return {
    applicationId,
    collectionScene: form.collectionScene.trim() || null,
    items,
    operatorName: form.operatorName.trim(),
    operatorUserId: form.operatorUserId.trim() || null,
    printerCode: form.printerCode.trim() || null,
    remarks: form.remarks.trim() || null,
    terminalCode: form.terminalCode.trim() || null,
  };
}
