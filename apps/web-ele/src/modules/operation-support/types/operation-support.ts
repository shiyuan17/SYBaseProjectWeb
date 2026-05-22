export interface ArchiveCabinetView {
  cabinetCode: string;
  cabinetName: string;
  cabinetStatus: string;
  cabinetType: string;
  capacity: number;
  id: string;
  layerCount: number;
  locationDescription?: null | string;
  remarks?: null | string;
  slotCountPerLayer: number;
}

export interface ArchivePositionView {
  cabinetId: string;
  id: string;
  layerNo: number;
  positionCode: string;
  positionStatus: string;
  slotNo: number;
}

export interface CreateArchiveCabinetRequest {
  cabinetCode: string;
  cabinetName: string;
  cabinetType: string;
  layerCount: number;
  locationDescription?: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  slotCountPerLayer: number;
  terminalCode?: string;
}

export interface UpdateArchiveCabinetRequest {
  cabinetName: string;
  cabinetStatus: string;
  locationDescription?: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ArchiveApplicationFormRequest {
  archivePositionId: string;
  caseId: string;
  fileName?: string;
  fileUrl?: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ArchiveEmbeddingBoxRequest {
  archivePositionId: string;
  embeddingBoxId: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ArchiveSlideRequest {
  archivePositionId: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  slideId: string;
  terminalCode?: string;
}

export interface ArchiveActionResult {
  archiveLocation: string;
  archiveStatus: string;
  caseId: string;
  objectId: string;
  objectType: string;
}

export interface SearchArchiveRecordsQuery {
  caseId?: string;
  keyword?: string;
  objectType?: string;
}

export interface ArchiveRecordView {
  applicationNo?: null | string;
  archiveLocation?: null | string;
  archiveStatus?: null | string;
  archivedAt?: null | string;
  borrowedAt?: null | string;
  borrowedByName?: null | string;
  caseId: string;
  loanStatus?: null | string;
  objectCode?: null | string;
  objectId: string;
  objectType: string;
  pathologyNo?: null | string;
  patientName?: null | string;
  storedByName?: null | string;
}

export interface MaterialLoanQuery {
  keyword?: string;
  materialType?: string;
}

export interface CreateMaterialLoanRequest {
  borrowedByName: string;
  borrowedByUserId?: string;
  borrowPurpose?: string;
  materialId: string;
  materialType: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ReturnMaterialLoanRequest {
  archivePositionId?: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface MaterialLoanView {
  applicationNo?: null | string;
  approvedByName?: null | string;
  borrowedAt?: null | string;
  borrowedByName?: null | string;
  borrowPurpose?: null | string;
  caseId: string;
  loanId: string;
  loanStatus: string;
  materialId: string;
  materialType: string;
  objectCode?: null | string;
  pathologyNo?: null | string;
  patientName?: null | string;
  remarks?: null | string;
  returnedAt?: null | string;
  returnedByName?: null | string;
}

export interface ReagentView {
  defaultLowStockThreshold?: null | number | string;
  defaultNearExpiryDays?: null | number;
  enabled: boolean;
  id: string;
  manufacturer?: null | string;
  reagentCode: string;
  reagentName: string;
  remarks?: null | string;
  specification?: null | string;
  unit?: null | string;
}

export interface CreateReagentRequest {
  defaultLowStockThreshold?: number | string;
  defaultNearExpiryDays?: number;
  enabled: boolean;
  manufacturer?: string;
  operatorName: string;
  operatorUserId?: string;
  reagentCode: string;
  reagentName: string;
  remarks?: string;
  specification?: string;
  unit?: string;
}

export type UpdateReagentRequest = Omit<CreateReagentRequest, 'reagentCode'>;

export interface ReagentStockView {
  batchNo: string;
  expiryDate?: null | string;
  id: string;
  lowStockThreshold?: null | number | string;
  nearExpiryDays?: null | number;
  reagentCode?: null | string;
  reagentId: string;
  reagentName?: null | string;
  remarks?: null | string;
  stockQuantity?: null | number | string;
  stockStatus: string;
  storageLocation?: null | string;
}

export interface CreateReagentStockRequest {
  batchNo: string;
  expiryDate?: string;
  lowStockThreshold?: number | string;
  nearExpiryDays?: number;
  operatorName: string;
  operatorUserId?: string;
  reagentId: string;
  remarks?: string;
  stockQuantity?: number | string;
  stockStatus: string;
  storageLocation?: string;
}

export type UpdateReagentStockRequest = Omit<
  CreateReagentStockRequest,
  'batchNo' | 'reagentId'
>;

export interface ReagentWarningView {
  batchNo: string;
  expiryDate?: null | string;
  lowStockThreshold?: null | number | string;
  nearExpiryDays?: null | number;
  reagentCode: string;
  reagentName: string;
  stockId: string;
  stockQuantity?: null | number | string;
  warningType: string;
}

export interface EquipmentRecordView {
  enabledAt?: null | string;
  equipmentCategory?: null | string;
  equipmentCode: string;
  equipmentName: string;
  equipmentStatus: string;
  id: string;
  locationDescription?: null | string;
  modelNo?: null | string;
  nextMaintenanceAt?: null | string;
  remarks?: null | string;
}

export interface CreateEquipmentRecordRequest {
  enabledAt?: string;
  equipmentCategory?: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentStatus: string;
  locationDescription?: string;
  modelNo?: string;
  nextMaintenanceAt?: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
}

export type UpdateEquipmentRecordRequest = Omit<
  CreateEquipmentRecordRequest,
  'equipmentCode'
>;

export interface EquipmentMaintenanceLogView {
  description?: null | string;
  equipmentId: string;
  id: string;
  maintenanceStatus: string;
  maintenanceType: string;
  nextMaintenanceAt?: null | string;
  performedAt: string;
  performedByName?: null | string;
  remarks?: null | string;
}

export interface CreateEquipmentMaintenanceLogRequest {
  description?: string;
  maintenanceStatus: string;
  maintenanceType: string;
  nextMaintenanceAt?: string;
  operatorName: string;
  operatorUserId?: string;
  performedAt: string;
  remarks?: string;
}

export interface EquipmentWarningView {
  equipmentCode: string;
  equipmentId: string;
  equipmentName: string;
  equipmentStatus: string;
  nextMaintenanceAt?: null | string;
  warningType: string;
}
