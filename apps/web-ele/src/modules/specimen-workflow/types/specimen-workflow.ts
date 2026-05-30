export interface ApplicationCreateRequest {
  applicationDate?: null | string;
  applicationNo?: null | string;
  applicationFormStatus?: null | string;
  applicationType: string;
  clinicalDiagnosis: string;
  clinicalSymptom?: null | string;
  externalOrderNo?: null | string;
  patientAge?: null | string;
  patientGender?: null | string;
  patientId?: null | string;
  patientName?: null | string;
  remarks?: null | string;
  sourceHospitalId?: null | string;
  sourceHospitalName?: null | string;
  specimenSite?: null | string;
  specimenRemovalTime?: null | string;
  status?: null | string;
  submissionDate?: null | string;
  submittingDepartmentId?: null | string;
  submittingDepartmentName?: null | string;
  submittingDoctorName?: null | string;
  submittingDoctorUserId?: null | string;
  thirdPartySource?: null | string;
}

export interface ApplicationCreateResult {
  id: string;
}

export interface ApplicationUpdateRequest extends ApplicationCreateRequest {}

export interface ImportClinicalApplicationRequest {
  externalOrderNo: string;
  thirdPartySource: string;
}

export interface TrackingEventView {
  eventContent: null | string;
  eventStatus: null | string;
  eventTime: null | string;
  eventType: null | string;
  nodeCode: null | string;
  operatorName: null | string;
  specimenBarcode?: null | string;
  specimenId?: null | string;
  specimenNo?: null | string;
  sourceTerminal: null | string;
}

export interface SpecimenTrackingSummary {
  abnormalReason: null | string;
  abnormalType?: null | string;
  barcode: string;
  barcodeBindingStatus?: null | string;
  checkInStatus?: null | string;
  checkedInAt?: null | string;
  checkedInByName?: null | string;
  clinicalSymptom?: null | string;
  collectionMode?: null | string;
  containerCount: null | number;
  containerName: null | string;
  fixationStatus: null | string;
  fixationCompletedAt?: null | string;
  fixationLiquidType?: null | string;
  fixationOperatorName?: null | string;
  fixationOperatorUserId?: null | string;
  fixationStartedAt?: null | string;
  id: string;
  labelPrintStatus: null | string;
  qualityCheckResult?: null | string;
  qualityIssueCodes?: string[];
  receiptStatus?: null | string;
  specimenCount: null | number;
  specimenConfirmedAt?: null | string;
  specimenName: string;
  specimenNo: string;
  specimenSite: null | string;
  specimenStatus: null | string;
  specimenType: null | string;
  verificationCompletedAt?: null | string;
  verificationStartedAt?: null | string;
  verificationStatus?: null | string;
}

export interface RegistrationSnapshotView {
  collectionScene: null | string;
  operatorName: null | string;
  operatorUserId: null | string;
  printerCode: null | string;
  remarks: null | string;
  terminalCode: null | string;
}

export interface ApplicationDetailView {
  abnormalFlag: boolean;
  applicationDate: null | string;
  applicationFormStatus: null | string;
  applicationNo: string;
  applicationType: null | string;
  clinicalDiagnosis: null | string;
  clinicalSymptom: null | string;
  createdAt: null | string;
  currentNode: null | string;
  deletable: boolean;
  editable: boolean;
  externalOrderNo: null | string;
  fixationCompletedAt?: null | string;
  id: string;
  operationDisabledReason: null | string;
  patientAge: null | string;
  patientGender: null | string;
  patientId: null | string;
  patientCheckStatus?: null | string;
  patientName: null | string;
  recentEvents: TrackingEventView[];
  remarks: null | string;
  reportIssued?: boolean;
  reportStatus?: null | string;
  receiptAbnormalSummary?: null | string;
  sourceHospitalId: null | string;
  sourceHospitalName: null | string;
  specimenSite: null | string;
  specimenConfirmedAt?: null | string;
  specimenRemovalTime: null | string;
  specimens: SpecimenTrackingSummary[];
  status: null | string;
  submissionDate: null | string;
  submittingDepartmentId: null | string;
  submittingDepartmentName: null | string;
  submittingDoctorName: null | string;
  submittingDoctorUserId: null | string;
  thirdPartySource: null | string;
  unreceivedCount?: number;
  updatedAt: null | string;
  voided: boolean;
}

export type TrackingQueryView = ApplicationDetailView;

export interface ApplicationListQuery {
  applicationFormStatus?: null | string;
  applicationNo?: null | string;
  applicationType?: null | string;
  dateFrom?: null | string;
  dateTo?: null | string;
  page: number;
  patientName?: null | string;
  size: number;
  submittingDepartmentId?: null | string;
}

export interface ApplicationListItem {
  abnormalFlag: boolean;
  applicationDate: null | string;
  applicationFormStatus: null | string;
  applicationNo: string;
  applicationType: null | string;
  createdAt: null | string;
  currentNode: null | string;
  deletable: boolean;
  editable: boolean;
  id: string;
  patientAge: null | string;
  patientGender: null | string;
  patientCheckStatus?: null | string;
  patientName: null | string;
  operationDisabledReason: null | string;
  registeredSpecimenCount: number;
  reportIssued?: boolean;
  reportStatus?: null | string;
  receiptAbnormalSummary?: null | string;
  submissionDate: null | string;
  status: null | string;
  submittingDepartmentName: null | string;
  submittingDoctorName: null | string;
  latestLabelPrintStatus: null | string;
  updatedAt: null | string;
  voided: boolean;
}

export interface ApplicationPage {
  items: ApplicationListItem[];
  page: number;
  size: number;
  total: number;
}

export interface DuplicateApplicationCheckQuery {
  applicationDate?: null | string;
  applicationType?: null | string;
  externalOrderNo?: null | string;
  patientId?: null | string;
  patientName?: null | string;
  specimenSite?: null | string;
}

export interface DuplicateApplicationCheckItem {
  applicationDate: null | string;
  applicationNo: string;
  currentNode: null | string;
  id: string;
  matchedBy: string[];
  patientName: null | string;
  specimenSite: null | string;
  status: null | string;
}

export interface DuplicateApplicationCheckResult {
  items: DuplicateApplicationCheckItem[];
  suggestedAction: 'ALLOW' | 'BLOCK' | 'CONFIRM' | string;
}

export interface SpecimenManagementListQuery {
  abnormalFlag?: boolean;
  applicationNo?: null | string;
  dateFrom?: null | string;
  dateTo?: null | string;
  departmentId?: null | string;
  keyword?: null | string;
  labelPrintStatus?: null | string;
  page: number;
  size: number;
  specimenStatus?: null | string;
}

export interface SpecimenManagementListItem {
  abnormalFlag: boolean;
  abnormalType?: null | string;
  applicationId: string;
  applicationNo: string;
  barcode: string;
  barcodeBindingStatus?: null | string;
  checkInStatus?: null | string;
  checkedInAt?: null | string;
  checkedInByName?: null | string;
  containerCount: null | number;
  containerName: null | string;
  fixationStatus: null | string;
  fixationCompletedAt?: null | string;
  fixationLiquidType?: null | string;
  fixationOperatorName?: null | string;
  fixationOperatorUserId?: null | string;
  fixationStartedAt?: null | string;
  labelPrintBatchNo: null | string;
  labelPrintStatus: null | string;
  latestTrackingAt: null | string;
  patientName: null | string;
  recentNode?: null | string;
  registeredAt: null | string;
  specimenCount: null | number;
  specimenConfirmedAt?: null | string;
  specimenId: string;
  specimenName: string;
  specimenNo: string;
  specimenSite: null | string;
  specimenStatus: null | string;
  specimenType: null | string;
  submittingDepartmentId: null | string;
  submittingDepartmentName: null | string;
  verificationCompletedAt?: null | string;
  verificationStartedAt?: null | string;
  verificationStatus?: null | string;
}

export interface SpecimenManagementListSummary {
  abnormalCount: number;
  labelPrintedCount: number;
  pendingLabelCount: number;
  totalCount: number;
}

export interface SpecimenRemovalQuery {
  abnormalFlag?: boolean;
  applicationNo?: null | string;
  dateFrom?: null | string;
  dateTo?: null | string;
  departmentId?: null | string;
  keyword?: null | string;
  page: number;
  size: number;
  specimenStatus?: null | string;
}

export interface SpecimenRemovalItem {
  abnormalFlag: boolean;
  applicationId: string;
  applicationNo: string;
  barcode: string;
  confirmedAt?: null | string;
  containerCount: null | number;
  containerName: null | string;
  inpatientNo: null | string;
  latestTrackingAt: null | string;
  patientGender: null | string;
  patientName: null | string;
  registeredAt: null | string;
  labelPrintBatchNo?: null | string;
  registeredByName: null | string;
  specimenId: string;
  specimenName: string;
  specimenNo: string;
  specimenRemovalAt: null | string;
  specimenRemovalOperatorName: null | string;
  specimenStatus: null | string;
  specimenType: null | string;
  surgeryName: null | string;
}

export interface SpecimenRemovalSummary {
  abnormalCount: number;
  confirmedCount: number;
  pendingCount: number;
  totalCount: number;
}

export interface SpecimenRemovalPage {
  items: SpecimenRemovalItem[];
  page: number;
  size: number;
  summary: SpecimenRemovalSummary;
  total: number;
}

export interface SpecimenRemovalConfirmRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  specimenBarcode: string;
  terminalCode?: null | string;
}

export type SpecimenRemovalIdentifierType = 'BARCODE' | 'SPECIMEN_NO';

export interface SpecimenRemovalQuickConfirmRequest {
  identifier: string;
  identifierType: SpecimenRemovalIdentifierType;
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface SpecimenRemovalConfirmResult {
  barcode: string;
  operatorName: string;
  specimenId: string;
  specimenRemovalAt: string;
}

export interface SpecimenManagementListPage {
  items: SpecimenManagementListItem[];
  page: number;
  size: number;
  summary: SpecimenManagementListSummary;
  total: number;
}

export interface SpecimenRegisterItemRequest {
  barcode?: null | string;
  clinicalSymptom?: null | string;
  collectionMode?: null | string;
  containerCount: number;
  containerName: string;
  specimenCount: number;
  specimenNameStandardized: string;
  specimenSite?: null | string;
  specimenType?: null | string;
}

export interface SpecimenRegisterRequest {
  applicationId: string;
  collectionScene?: null | string;
  items: SpecimenRegisterItemRequest[];
  operatorName: string;
  operatorUserId?: null | string;
  printerCode?: null | string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface SpecimenRegisterResult {
  labelPrintBatchNo: string;
  labelPrintMessage: null | string;
  labelPrintSuccess: boolean;
  specimens: SpecimenTrackingSummary[];
}

export interface LatestSpecimenRegistrationResult {
  applicationId: string;
  labelPrintBatchNo: null | string;
  labelPrintMessage: null | string;
  labelPrintSuccess: boolean;
  registrationSnapshot: null | RegistrationSnapshotView;
  specimens: SpecimenTrackingSummary[];
}

export interface LabelPrintRetryRequest {
  operatorName: string;
  operatorUserId?: null | string;
  printerCode: string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface LabelPrintRetryResult {
  allSuccessful: boolean;
  failedCount: number;
  labelPrintBatchNo: string;
  message: null | string;
  retriedCount: number;
  successCount: number;
}

export interface SpecimenBarcodeBindingRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  targetBarcode: string;
  terminalCode?: null | string;
}

export interface SpecimenVerificationRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  specimenBarcode: string;
  terminalCode?: null | string;
}

export interface SpecimenConfirmRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface SpecimenCheckInRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  specimenBarcode: string;
  terminalCode?: null | string;
}

export interface SpecimenVerificationRecord {
  applicationId: string;
  barcode: string;
  operatorName: string;
  remarks: null | string;
  result: string;
  specimenId: string;
  terminalCode: null | string;
  verificationType: string;
  verifiedAt: string;
}

export interface ApplicationFormReprintRequest {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface PendingSpecimenQuery {
  applicationId?: null | string;
  dateFrom?: null | string;
  dateTo?: null | string;
  departmentId?: null | string;
  fixationStatus?: null | string;
  checkInStatus?: null | string;
  page: number;
  size: number;
  specimenNo?: null | string;
  verificationStatus?: null | string;
}

export interface PendingSpecimenItem {
  abnormalFlag: boolean;
  abnormalType?: null | string;
  applicationId: string;
  applicationNo: string;
  batchAbnormalFlag?: boolean;
  barcode: string;
  checkInStatus?: null | string;
  checkedInAt?: null | string;
  checkedInByName?: null | string;
  containerCount: null | number;
  containerName: null | string;
  fixationCompletedAt?: null | string;
  fixationLiquidType?: null | string;
  fixationOperatorName?: null | string;
  fixationOperatorUserId?: null | string;
  fixationStartedAt?: null | string;
  fixationStatus: null | string;
  latestTrackingAt: null | string;
  patientName: null | string;
  registeredAt: null | string;
  reminderCount?: number;
  specimenId: string;
  specimenNo: string;
  specimenStatus: null | string;
  submittingDepartmentId: null | string;
  submittingDepartmentName: null | string;
  transportOrderId: null | string;
  unreceivedCount?: number;
  verificationCompletedAt?: null | string;
  verificationStartedAt?: null | string;
  verificationStatus?: null | string;
}

export interface PendingSpecimenPage {
  items: PendingSpecimenItem[];
  page: number;
  size: number;
  total: number;
}

export interface SpecimenFixationRequest {
  fixationLiquidType?: null | string;
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  specimenBarcode: string;
  terminalCode?: null | string;
}

export interface FixationResult {
  barcode: string;
  fixationCompletedAt?: null | string;
  fixationLiquidType?: null | string;
  operatorName?: null | string;
  operatorUserId?: null | string;
  fixationStatus: string;
  specimenId: string;
}

export interface TransportOrderCreateRequest {
  applicationId: string;
  handoverDepartmentId?: null | string;
  handoverDepartmentName: string;
  handoverUserId?: null | string;
  handoverUserName: string;
  receiverDepartmentId?: null | string;
  receiverDepartmentName: string;
  remarks?: null | string;
  specimenBarcodes: string[];
  terminalCode?: null | string;
}

export interface TransportOrderOperatorRequest {
  operatorName: string;
  operatorUserId?: null | string;
  terminalCode?: null | string;
}

export interface TransportOrderHandoverRequest {
  receiverUserId?: null | string;
  receiverUserName: string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface TransportOrderView {
  applicationId: string;
  handedOverAt: null | string;
  handoverUserName: null | string;
  id: string;
  receiverUserName: null | string;
  status: string;
  toBeTransportedAt: null | string;
  transportOrderNo: string;
}

export interface PendingTransportOrderQuery extends PendingSpecimenQuery {
  status?: null | string;
}

export interface PendingTransportOrderItem {
  applicationId: string;
  applicationNo: string;
  batchAbnormalFlag?: boolean;
  handedOverAt: null | string;
  handoverDepartmentName: null | string;
  id: string;
  patientName: null | string;
  receiverDepartmentName: null | string;
  reminderCount?: number;
  specimenBarcodes: string[];
  status: string;
  toBeTransportedAt: null | string;
  transportOrderNo: string;
  unreceivedCount?: number;
}

export interface PendingTransportOrderPage {
  items: PendingTransportOrderItem[];
  page: number;
  size: number;
  total: number;
}

export interface SpecimenReceiptItemRequest {
  containerCount?: null | number;
  qualityCheckResult: string;
  qualityIssueCodes?: null | string[];
  reason?: null | string;
  receiptStatus: string;
  remarks?: null | string;
  specimenBarcode: string;
}

export interface SpecimenReceiptRequest {
  items: SpecimenReceiptItemRequest[];
  receivedByName: string;
  receivedByUserId?: null | string;
  terminalCode?: null | string;
  transportOrderId: string;
}

export interface DirectSpecimenReceiptRequest {
  items: SpecimenReceiptItemRequest[];
  receivedByName?: null | string;
  receivedByUserId?: null | string;
  terminalCode?: null | string;
}

export interface SpecimenReceiptResult {
  batchAbnormalFlag?: boolean;
  caseId: null | string;
  pathologyNo: null | string;
  receiptAbnormalSummary?: null | string;
  receiptStatus: string;
  reminderCount?: number;
  unreceivedCount: number;
}
