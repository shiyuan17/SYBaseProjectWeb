export interface WorkbenchLookupQuery {
  keyword: string;
}

export interface OperatingRoomOption {
  buildingId: string;
  cleanLevel: string;
  floor: number;
  roomId: string;
  roomName: string;
  roomType: string;
}

export interface OperatingBuildingOption {
  buildingId: string;
  buildingName: string;
  floors: number;
  location: string;
  operatingRooms: OperatingRoomOption[];
}

export interface SpecimenDictionaryPart {
  partId: string;
  partName: string;
  specimens: string[];
}

export interface SpecimenDictionaryGroup {
  subParts: SpecimenDictionaryPart[];
  systemId: string;
  systemName: string;
}

export interface SpecimenDictionaryEntryOption {
  partId: string;
  partName: string;
  searchKeywords: string[];
  specimenName: string;
  systemId: string;
  systemName: string;
}

export interface SpecimenPackageItem {
  quantity: number;
  specimenName: string;
  specimenSite: string;
  status: string;
}

export interface SpecimenPackageOption {
  applyDept: string;
  description: string;
  itemCount: number;
  items: SpecimenPackageItem[];
  packageId: string;
  packageName: string;
  searchKeywords: string[];
}

export interface WorkbenchSpecimenPrintContext {
  applyDept: string;
  gender: string;
  idNo: string;
  patientName: string;
  roomLabel: string;
  surgeryTime: string;
}

export interface WorkbenchContagiousSpecimen {
  hepatitis: boolean;
  hiv: boolean;
  isolation: boolean;
  syphilis: boolean;
  tuberculosis: boolean;
}

export interface WorkbenchSpecialConditions {
  abnormalBleeding: boolean;
  birthControl: boolean;
  hormoneReplacement: boolean;
  hysterectomy: boolean;
  iud: boolean;
  lactation: boolean;
  menopause: boolean;
  other: string;
  pregnancy: boolean;
  radiotherapy: boolean;
}

export interface WorkbenchGynecologyInfo {
  additionalNotes: string;
  hpvResult: null | string;
  lastMenstrualPeriod: null | string;
  menopause: boolean;
  previousCytology: string;
  previousTreatment: string;
  specialConditions: WorkbenchSpecialConditions;
}

export interface WorkbenchSpecimenItem {
  id: string;
  quantity: number;
  specimenName: string;
  specimenNo: string;
  specimenSite: string;
  status: string;
}

export interface WorkbenchPatientInfo {
  age: null | string;
  applicationDate: null | string;
  applicationNo: string;
  applyDept: string;
  applyDoctor: string;
  bedNo: null | string;
  checkItem: null | string;
  clinicalDiagnosis: null | string;
  clinicalHistory: null | string;
  deliveryRequirement: null | string;
  endoscopyDiagnosis: null | string;
  frozenReminder: boolean;
  gender: null | string;
  idNo: null | string;
  imagingResult: null | string;
  inpatientNo: null | string;
  patientName: string;
  patientVerified: boolean;
  phone: null | string;
  registrationStatus: null | string;
  remark: null | string;
  specimenType: null | string;
  wardName: null | string;
}

export interface WorkbenchSurgeryInfo {
  buildingId: null | string;
  clinicalFindings: null | string;
  fixativeType: null | string;
  fixationPerson: null | string;
  fixationTime: null | string;
  roomId: null | string;
  surgeryName: null | string;
}

export interface ApplicationRegistrationWorkbenchRecord {
  applicationId: string;
  contagiousSpecimen: WorkbenchContagiousSpecimen;
  gynecologyInfo: WorkbenchGynecologyInfo;
  patientInfo: WorkbenchPatientInfo;
  specimenItems: WorkbenchSpecimenItem[];
  surgeryInfo: WorkbenchSurgeryInfo;
}

export interface SaveApplicationRegistrationWorkbenchRequest {
  contagiousSpecimen: WorkbenchContagiousSpecimen;
  gynecologyInfo: WorkbenchGynecologyInfo;
  patientInfo: WorkbenchPatientInfo;
  specimenItems: Array<{
    quantity: number;
    specimenName: string;
    specimenNo: string;
    specimenSite: string;
    status: string;
  }>;
  surgeryInfo: WorkbenchSurgeryInfo;
}
