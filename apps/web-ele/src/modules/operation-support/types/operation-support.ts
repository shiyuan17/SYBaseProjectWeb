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

export interface BatchCreateArchiveCabinetRequest {
  cabinetCodePrefix: string;
  cabinetNamePrefix?: string;
  cabinetType: string;
  count: number;
  layerCount: number;
  locationDescription?: string;
  numberWidth: number;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  slotCountPerLayer: number;
  startNo: number;
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
  applicationDilution?: null | string;
  cloneNo?: null | string;
  createdAt?: null | string;
  createdByName?: null | string;
  defaultLowStockThreshold?: null | number | string;
  defaultNearExpiryDays?: null | number;
  defaultStockThreshold?: null | number | string;
  enabled: boolean;
  id: string;
  manufacturer?: null | string;
  orderDictItemId?: null | string;
  orderItemName?: null | string;
  reagentType?: null | string;
  reagentUsage?: null | string;
  recommendedDilution?: null | string;
  reagentCode: string;
  reagentName: string;
  remarks?: null | string;
  specification?: null | string;
  stainCapacity?: null | number | string;
  stainThreshold?: null | number | string;
  templateStatus?: null | string;
  unit?: null | string;
  updatedAt?: null | string;
  updatedByName?: null | string;
  validityDays?: null | number;
}

export interface CreateReagentRequest {
  applicationDilution?: string;
  cloneNo?: string;
  defaultLowStockThreshold?: number | string;
  defaultNearExpiryDays?: number;
  defaultStockThreshold?: number | string;
  enabled: boolean;
  manufacturer?: string;
  orderDictItemId?: string;
  reagentType?: string;
  reagentUsage?: string;
  recommendedDilution?: string;
  reagentCode: string;
  reagentName: string;
  remarks?: string;
  specification?: string;
  stainCapacity?: number | string;
  stainThreshold?: number | string;
  templateStatus?: string;
  unit?: string;
  validityDays?: number;
}

export type UpdateReagentRequest = Omit<CreateReagentRequest, 'reagentCode'>;

export interface ReagentStockView {
  applicationDilution?: null | string;
  batchNo: string;
  createdAt?: null | string;
  createdByName?: null | string;
  expiryDate?: null | string;
  expiryReminderThreshold?: null | number;
  finishedAt?: null | string;
  id: string;
  inboundAt?: null | string;
  initialQuantity?: null | number | string;
  lowStockThreshold?: null | number | string;
  nearExpiryDays?: null | number;
  orderDictItemId?: null | string;
  orderItemName?: null | string;
  productionDate?: null | string;
  reagentCode?: null | string;
  reagentId: string;
  reagentName?: null | string;
  reagentType?: null | string;
  recommendedDilution?: null | string;
  remainingQuantity?: null | number | string;
  remarks?: null | string;
  stainCapacity?: null | number | string;
  stainThreshold?: null | number | string;
  startedAt?: null | string;
  stockQuantity?: null | number | string;
  stockStatus: string;
  storageLocation?: null | string;
  testedAt?: null | string;
  testReminderThreshold?: null | number;
  updatedAt?: null | string;
  updatedByName?: null | string;
  validityDays?: null | number;
}

export interface CreateReagentStockRequest {
  applicationDilution?: string;
  batchNo: string;
  expiryDate?: string;
  expiryReminderThreshold?: number;
  inboundAt?: string;
  initialQuantity?: number | string;
  lowStockThreshold?: number | string;
  nearExpiryDays?: number;
  productionDate?: string;
  reagentId: string;
  recommendedDilution?: string;
  remainingQuantity?: number | string;
  remarks?: string;
  stainCapacity?: number | string;
  stainThreshold?: number | string;
  stockQuantity?: number | string;
  stockStatus: string;
  storageLocation?: string;
  testReminderThreshold?: number;
  validityDays?: number;
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

export interface ReagentStockActionRequest {
  quantity?: number | string;
  remarks?: string;
}

export interface ReagentStockEventView {
  eventType: string;
  id: string;
  occurredAt?: null | string;
  operatorName?: null | string;
  quantityAfter?: null | number | string;
  quantityBefore?: null | number | string;
  quantityDelta?: null | number | string;
  remarks?: null | string;
  stockId: string;
}

export interface ReagentStockImportError {
  field: string;
  message: string;
  rejectedValue?: null | string;
  rowNumber: number;
}

export interface ReagentStockImportResult {
  errors: ReagentStockImportError[];
  failureCount: number;
  successCount: number;
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
