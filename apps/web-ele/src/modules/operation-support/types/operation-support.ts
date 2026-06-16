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

export type ArchiveCabinetNodeType = 'AREA' | 'CABINET' | 'DRAWER';

export interface ArchiveCabinetNodeView {
  cabinetId?: null | string;
  cabinetType?: null | string;
  capacity: number;
  id: string;
  layerNo?: null | number;
  nodeCode: string;
  nodeType: ArchiveCabinetNodeType;
  parentId?: null | string;
  pathLocation?: null | string;
  remainingCapacity: number;
  remarks?: null | string;
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
  parentId?: string;
  remarks?: string;
  slotCountPerLayer: number;
  startNo: number;
  terminalCode?: string;
}

export interface CreateArchiveCabinetNodeRequest {
  cabinetType?: string;
  capacity: number;
  nodeCode: string;
  nodeType: ArchiveCabinetNodeType;
  parentId?: string;
  pathLocation?: string;
  remarks?: string;
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

export interface UpdateArchiveCabinetNodeRequest {
  cabinetType?: string;
  capacity: number;
  nodeCode: string;
  pathLocation?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ArchiveApplicationFormRequest {
  archivePositionId: string;
  caseId: string;
  fileName?: string;
  fileUrl?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ArchiveEmbeddingBoxRequest {
  archivePositionId: string;
  embeddingBoxId: string;
  remarks?: string;
  terminalCode?: string;
}

export interface ArchiveSlideRequest {
  archivePositionId: string;
  remarks?: string;
  slideId: string;
  terminalCode?: string;
}

export interface ArchiveSpecimenRequest {
  archivePositionId: string;
  remarks?: string;
  specimenId: string;
  terminalCode?: string;
}

export interface BatchArchiveObjectRequest {
  archiveCabinetId: string;
  objectIds: string[];
  remarks?: string;
  terminalCode?: string;
}

export interface BatchArchiveSpecimenRequest extends BatchArchiveObjectRequest {
  archiveExpiresAt?: string;
  archiveReminderDays?: number;
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

export type ArchiveObjectType =
  | 'APPLICATION_FORM'
  | 'EMBEDDING_BOX'
  | 'SLIDE'
  | 'SPECIMEN';

export interface ArchiveObjectQuery {
  keyword?: string;
  objectType: ArchiveObjectType;
  page?: number;
  size?: number;
}

export interface ArchiveRecordView {
  applicationNo?: null | string;
  applicantDoctorName?: null | string;
  applicationDate?: null | string;
  archiveLocation?: null | string;
  archivePositionId?: null | string;
  archiveStatus?: null | string;
  archivedAt?: null | string;
  borrowedAt?: null | string;
  borrowedByName?: null | string;
  caseId: string;
  contentDescribedByName?: null | string;
  archiveExpiresAt?: null | string;
  archiveReminderDays?: null | number;
  loanStatus?: null | string;
  objectCode?: null | string;
  objectId: string;
  objectType: string;
  objectStatus?: null | string;
  pathologyNo?: null | string;
  patientName?: null | string;
  sampledAt?: null | string;
  sampledByName?: null | string;
  slicedAt?: null | string;
  slicedByName?: null | string;
  storedAt?: null | string;
  storedByName?: null | string;
}

export interface ArchiveObjectPage {
  items: ArchiveRecordView[];
  page: number;
  size: number;
  total: number;
}

export interface MaterialLoanQuery {
  keyword?: string;
  loanStatus?: string;
  materialType?: string;
}

export interface CreateMaterialLoanRequest {
  borrowedByName: string;
  borrowedByUserId?: string;
  borrowerPhone?: string;
  borrowerUnit?: string;
  borrowPurpose?: string;
  depositAmount?: number | string;
  materialId: string;
  materialType: string;
  operatorName: string;
  operatorUserId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface CreateMaterialLoanAbnormalRecordRequest {
  abnormalReason: string;
  borrowedAt?: string;
  borrowedContent?: string;
  borrowedSlideNo?: string;
  borrowerIdentityNo?: string;
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerRelationship?: string;
  borrowerUnit?: string;
  contactResult?: string;
  contacted?: boolean;
  depositAmount?: number | string;
  expectedReturnAt?: string;
  loanId?: string;
  materialId: string;
  materialType: string;
  returnAbnormalInfo?: string;
  slideCount?: number;
  terminalCode?: string;
}

export interface MaterialLoanAbnormalRecordView {
  abnormalReason: string;
  caseId: string;
  contactResult?: null | string;
  contacted?: boolean;
  id: string;
  loanId?: null | string;
  materialId: string;
  materialType: string;
  registeredAt?: null | string;
  registeredByName?: null | string;
}

export interface ReturnMaterialLoanRequest {
  archivePositionId?: string;
  remarks?: string;
  terminalCode?: string;
}

export interface MaterialLoanView {
  applicationNo?: null | string;
  approvedByName?: null | string;
  borrowedAt?: null | string;
  borrowedByName?: null | string;
  borrowerPhone?: null | string;
  borrowerUnit?: null | string;
  borrowPurpose?: null | string;
  caseId: string;
  depositAmount?: null | number | string;
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

export interface WhiteSlideStockView {
  id: string;
  quantityAvailable: number;
  quantityBorrowed: number;
  remarks?: null | string;
  specification?: null | string;
  status: string;
  stockCode: string;
  stockNo: string;
}

export interface WhiteSlideLoanQuery {
  keyword?: string;
  loanStatus?: string;
}

export interface WhiteSlideStockQuery {
  keyword?: string;
  status?: string;
}

export interface WhiteSlideLoanView {
  amount?: null | number | string;
  borrowerIdentityNo?: null | string;
  borrowerName: string;
  borrowerPhone?: null | string;
  borrowerUnit?: null | string;
  caseId?: null | string;
  embeddingBoxNo?: null | string;
  id: string;
  loanNo: string;
  loanStatus: string;
  loanedAt?: null | string;
  operatorName?: null | string;
  pathologyNo?: null | string;
  patientName?: null | string;
  quantity: number;
  remarks?: null | string;
  returnedAt?: null | string;
  returnedByName?: null | string;
  saveDirectPrint: boolean;
  slicePurpose?: null | string;
  sliceThickness?: null | string;
  stockCode: string;
  stockId: string;
  stockNo: string;
  unitPrice?: null | number | string;
  waxBlockUsage?: null | string;
}

export interface CreateWhiteSlideLoanRequest {
  amount?: number | string;
  borrowerIdentityNo?: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerUnit?: string;
  caseId?: string;
  embeddingBoxNo?: string;
  pathologyNo?: string;
  patientName?: string;
  quantity: number;
  remarks?: string;
  saveDirectPrint?: boolean;
  slicePurpose?: string;
  sliceThickness?: string;
  stockId: string;
  terminalCode?: string;
  unitPrice?: number | string;
  waxBlockUsage?: string;
}

export interface ReturnWhiteSlideLoanRequest {
  remarks?: string;
  terminalCode?: string;
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
  quantity?: null | number;
  purchaseDate?: null | string;
  purchaserName?: null | string;
  purchaserCode?: null | string;
  managementUnit?: null | string;
  managementCode?: null | string;
  useUnit?: null | string;
  principalCode?: null | string;
  principalName?: null | string;
  userName?: null | string;
  productionDate?: null | string;
  warrantyEndDate?: null | string;
  factoryNo?: null | string;
  depreciationMethod?: null | string;
  serviceLifeYears?: null | number;
  price?: null | number | string;
  manufacturer?: null | string;
  portNo?: null | string;
  ipAddress?: null | string;
  commonStartupTime?: null | string;
  commonShutdownTime?: null | string;
  commonUsageContent?: null | string;
  commonlyUsed?: boolean;
  setTemperature?: null | number | string;
  currentTemperature?: null | number | string;
  rfid?: null | string;
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
  quantity?: number;
  purchaseDate?: string;
  purchaserName?: string;
  purchaserCode?: string;
  managementUnit?: string;
  managementCode?: string;
  useUnit?: string;
  principalCode?: string;
  principalName?: string;
  userName?: string;
  productionDate?: string;
  warrantyEndDate?: string;
  factoryNo?: string;
  depreciationMethod?: string;
  serviceLifeYears?: number;
  price?: number | string;
  manufacturer?: string;
  portNo?: string;
  ipAddress?: string;
  commonStartupTime?: string;
  commonShutdownTime?: string;
  commonUsageContent?: string;
  commonlyUsed: boolean;
  setTemperature?: number | string;
  currentTemperature?: number | string;
  rfid?: string;
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

export interface BatchUpdateEquipmentStatusRequest {
  equipmentIds: string[];
  equipmentStatus: 'ACTIVE' | 'DISABLED';
}

export interface MedicalWasteOptionItem {
  label: string;
  value: string;
}

export interface MedicalWasteSpecimenOptionsView {
  grossingOperators: MedicalWasteOptionItem[];
  grossingPeriods: MedicalWasteOptionItem[];
  grossingStations: MedicalWasteOptionItem[];
}

export interface MedicalWasteSpecimenPreviewRequest {
  bagName: string;
  grossingDate: string;
  grossingOperatorName: string;
  grossingPeriod: string;
  grossingStationName: string;
}

export interface MedicalWasteSpecimenLabelView {
  patientId?: null | string;
  patientName?: null | string;
  pathologyNo?: null | string;
  sourceLabelId: string;
  specimenName?: null | string;
}

export interface MedicalWasteSpecimenBatchView {
  bagName: string;
  destroyAction?: null | string;
  destroyedAt?: null | string;
  destroyedByName?: null | string;
  grossingAction?: null | string;
  grossingDate?: null | string;
  grossingOperatorName?: null | string;
  grossingPeriod?: null | string;
  grossingStationName?: null | string;
  id: string;
  labelCount: number;
  printedAt?: null | string;
  printedByName?: null | string;
  weightKg?: null | number | string;
}

export interface MedicalWastePrintSpecimenBatchRequest extends MedicalWasteSpecimenPreviewRequest {
  weightKg?: number | string;
}

export interface MedicalWastePrintSpecimenBatchResult {
  batch: MedicalWasteSpecimenBatchView;
  labels: MedicalWasteSpecimenLabelView[];
  printSubtitle?: null | string;
  printTitle?: null | string;
}

export interface MedicalWasteReagentBagView {
  bagName: string;
  createdAt?: null | string;
  createdByName?: null | string;
  createdInfo?: null | string;
  handedOverAt?: null | string;
  handedOverByName?: null | string;
  handoverInfo?: null | string;
  handoverRemarks?: null | string;
  id: string;
  printedAt?: null | string;
  printedByName?: null | string;
  remarks?: null | string;
  source?: null | string;
  volumeMl?: null | number | string;
  wasteType?: null | string;
  weightKg?: null | number | string;
}

export interface CreateMedicalWasteReagentBagRequest {
  bagName: string;
  id?: string;
  remarks?: string;
  source?: string;
  volumeMl?: number | string;
  wasteType: string;
  weightKg?: number | string;
}

export interface MedicalWasteReagentHandoverRequest {
  handedOverAt: string;
  handedOverByName: string;
  handoverRemarks?: string;
}
