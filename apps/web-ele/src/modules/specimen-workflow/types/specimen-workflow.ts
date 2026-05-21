export interface ApplicationCreateRequest {
  applicationDate?: null | string;
  applicationNo?: null | string;
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
  specimenSite: string;
  status?: null | string;
  submissionDate?: null | string;
  submittingDepartmentId: string;
  submittingDepartmentName: string;
  submittingDoctorName: string;
  submittingDoctorUserId: string;
  thirdPartySource?: null | string;
}

export interface ApplicationCreateResult {
  id: string;
}

export interface TrackingEventView {
  eventContent: null | string;
  eventStatus: null | string;
  eventTime: null | string;
  eventType: null | string;
  nodeCode: null | string;
  operatorName: null | string;
  sourceTerminal: null | string;
}

export interface SpecimenTrackingSummary {
  barcode: string;
  fixationStatus: null | string;
  id: string;
  labelPrintStatus: null | string;
  specimenCount: null | number;
  specimenName: string;
  specimenNo: string;
  specimenSite: null | string;
  specimenStatus: null | string;
  specimenType: null | string;
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
  externalOrderNo: null | string;
  id: string;
  patientAge: null | string;
  patientGender: null | string;
  patientId: null | string;
  patientName: null | string;
  recentEvents: TrackingEventView[];
  remarks: null | string;
  sourceHospitalId: null | string;
  sourceHospitalName: null | string;
  specimenSite: null | string;
  specimens: SpecimenTrackingSummary[];
  status: null | string;
  submissionDate: null | string;
  submittingDepartmentId: null | string;
  submittingDepartmentName: null | string;
  submittingDoctorName: null | string;
  submittingDoctorUserId: null | string;
  thirdPartySource: null | string;
  updatedAt: null | string;
}

export type TrackingQueryView = ApplicationDetailView;

export interface SpecimenRegisterItemRequest {
  barcode?: null | string;
  clinicalSymptom?: null | string;
  collectionMode?: null | string;
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

export interface PendingSpecimenQuery {
  applicationId?: null | string;
  dateFrom?: null | string;
  dateTo?: null | string;
  departmentId?: null | string;
  page: number;
  size: number;
}

export interface PendingSpecimenItem {
  abnormalFlag: boolean;
  applicationId: string;
  applicationNo: string;
  barcode: string;
  fixationStatus: null | string;
  latestTrackingAt: null | string;
  patientName: null | string;
  registeredAt: null | string;
  specimenId: string;
  specimenNo: string;
  specimenStatus: null | string;
  submittingDepartmentId: null | string;
  submittingDepartmentName: null | string;
  transportOrderId: null | string;
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
  handedOverAt: null | string;
  handoverDepartmentName: null | string;
  id: string;
  patientName: null | string;
  receiverDepartmentName: null | string;
  specimenBarcodes: string[];
  status: string;
  toBeTransportedAt: null | string;
  transportOrderNo: string;
}

export interface PendingTransportOrderPage {
  items: PendingTransportOrderItem[];
  page: number;
  size: number;
  total: number;
}

export interface SpecimenReceiptItemRequest {
  containerCount?: null | number;
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
  caseId: null | string;
  pathologyNo: null | string;
  receiptStatus: string;
  unreceivedCount: number;
}
