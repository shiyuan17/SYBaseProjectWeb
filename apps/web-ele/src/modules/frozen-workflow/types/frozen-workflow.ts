export type FrozenSessionStatus =
  | 'CANCELLED'
  | 'CLOSED'
  | 'CONFIRMED'
  | 'DIAGNOSING'
  | 'GROSSING'
  | 'PARAFFIN_REVIEWED'
  | 'RECEIVED'
  | 'REPORTED'
  | 'REQUESTED'
  | 'SLICING';

export type FrozenTaskType =
  | 'APPOINTMENT'
  | 'COMPARE'
  | 'GROSSING'
  | 'HANDOVER'
  | 'PHONE_BACK'
  | 'RECEIVE'
  | 'REMAINING_TISSUE'
  | 'REPORT'
  | 'SLICING';

export interface FrozenActionPayload {
  operatorName: string;
  operatorUserId?: null | string;
  remarks?: null | string;
  terminalCode?: null | string;
}

export interface FrozenSessionTask {
  completedAt: null | string;
  id: string;
  operatorName: null | string;
  remarks: null | string;
  startedAt: null | string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  taskType: FrozenTaskType;
  timeoutLevel: 'NONE' | 'ORANGE' | 'RED';
}

export interface FrozenTimelineEvent {
  eventContent: string;
  eventTime: string;
  eventType: string;
  id: string;
  nodeCode: string;
  operatorName: null | string;
}

export interface FrozenSession {
  applicationId: string;
  applicationNo: string;
  autoPrintSlides: boolean;
  caseId: string;
  compareStatus: null | 'MISMATCH' | 'PENDING' | 'SIGNED_OFF';
  compareSummary: null | string;
  currentTaskType: FrozenTaskType;
  finalConfirmedAt: null | string;
  finalDiagnosis: null | string;
  frozenPathologyNo: string;
  grossingCompletedAt: null | string;
  grossingDescription: null | string;
  grossingStartedAt: null | string;
  handoverComment: null | string;
  hasRegularCaseLinked: boolean;
  id: string;
  intraoperativePhoneBack: boolean;
  nextAction: string;
  patientName: string;
  phoneBackAt: null | string;
  preliminaryResult: null | string;
  receivedAt: null | string;
  remainingTissueStatus: 'DISPOSED' | 'PENDING' | 'RETAINED';
  reportConfirmedAt: null | string;
  requestedAt: string;
  requestDoctorName: string;
  sessionNo: string;
  sessionStatus: FrozenSessionStatus;
  slicingCompletedAt: null | string;
  slicingStartedAt: null | string;
  timeoutLevel: 'NONE' | 'ORANGE' | 'RED';
}

export interface FrozenSessionDetail extends FrozenSession {
  reminders: string[];
  tasks: FrozenSessionTask[];
  timeline: FrozenTimelineEvent[];
}

export interface FrozenSessionListQuery {
  keyword?: null | string;
  page: number;
  sessionStatus?: null | string;
  size: number;
  timeoutLevel?: null | string;
}

export interface FrozenSessionListPage {
  items: FrozenSession[];
  page: number;
  size: number;
  total: number;
}

export interface FrozenReminderItem {
  caseId: string;
  currentTaskType: FrozenTaskType;
  frozenPathologyNo: string;
  id: string;
  nextAction: string;
  patientName: string;
  requestedAt: string;
  sessionId: string;
  sessionNo: string;
  timeoutLevel: 'NONE' | 'ORANGE' | 'RED';
  title: string;
}

export interface FrozenReminderSummary {
  items: FrozenReminderItem[];
  orangeCount: number;
  redCount: number;
  total: number;
}

export interface FrozenTechnicalWorkbenchView {
  reminders: FrozenReminderSummary;
  sessions: FrozenSession[];
}

export interface FrozenPhoneBackRequest extends FrozenActionPayload {
  preliminaryResult: string;
}

export interface FrozenParaffinCompareRequest extends FrozenActionPayload {
  compareStatus: 'MISMATCH' | 'SIGNED_OFF';
  compareSummary: string;
}

export interface FrozenRemainingTissueRequest extends FrozenActionPayload {
  remainingTissueStatus: 'DISPOSED' | 'RETAINED';
}
