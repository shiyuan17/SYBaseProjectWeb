import type {
  ApplicationRegistrationWorkbenchRecord,
  OperatingBuildingOption,
  OperatingRoomOption,
  SpecimenDictionaryEntryOption,
  SpecimenDictionaryGroup,
  SpecimenPackageItem,
  SpecimenPackageOption,
  WorkbenchContagiousSpecimen,
  WorkbenchGynecologyInfo,
  WorkbenchLookupQuery,
  WorkbenchLookupType,
  WorkbenchSpecialConditions,
  WorkbenchSpecimenItem,
} from '../types/application-registration-workbench';
import {
  buildSearchKeywords,
  matchesSearchKeyword,
} from '../utils/specimen-dictionary-search';

import bbRaw from '../../../../../../mock_data/bb.json';
import bbtcRaw from '../../../../../../mock_data/bbtc.json';
import sqdRaw from '../../../../../../mock_data/sqd.json';
import sssRaw from '../../../../../../mock_data/sss.json';

type RawContagiousSpecimen = WorkbenchContagiousSpecimen;

type RawSpecialConditions = WorkbenchSpecialConditions;

type RawGynecologyInfo = {
  additionalNotes: string;
  hpvResult: null | string;
  lastMenstrualPeriod: null | string;
  menopause: boolean;
  previousCytology: string;
  previousTreatment: string;
  specialConditions: RawSpecialConditions;
};

type RawSpecimenItem = {
  quantity: number;
  specimenName: string;
  specimenNo: string;
  specimenSite: string;
  status: string;
};

type RawRecord = {
  applicationInfo: {
    age: string;
    applicationDate: string;
    applicationNo: string;
    applyDept: string;
    applyDoctor: string;
    bedNo: string;
    checkItem: string;
    clinicalDiagnosis: string;
    clinicalHistory: string;
    contagiousSpecimen: RawContagiousSpecimen;
    deliveryRequirement: string;
    endoscopyDiagnosis: string;
    frozenReminder: boolean;
    gender: string;
    idNo: string;
    imagingResult: string;
    inpatientNo: string;
    patientName: string;
    patientVerified: boolean;
    phone: string;
    registrationStatus: string;
    remark: string;
    specimenType: string;
    wardName: string;
  };
  gynecologyInfo: RawGynecologyInfo;
  specimenItems: RawSpecimenItem[];
  surgeryInfo: {
    buildingId: string;
    clinicalFindings: string;
    fixativeType: string;
    fixationPerson: string;
    fixationTime: string;
    roomId: string;
    specimenRemovalTime?: string;
    surgeryName: string;
  };
};

type RawBuilding = {
  buildingId: string;
  buildingName: string;
  floors: number;
  location: string;
  operatingRooms: Array<{
    cleanLevel: string;
    floor: number;
    roomId: string;
    roomName: string;
    roomType: string;
  }>;
};

type RawDictionaryGroup = {
  subParts: Array<{
    partId: string;
    partName: string;
    specimens: string[];
  }>;
  systemId: string;
  systemName: string;
};

type RawSpecimenPackage = {
  applyDept: string;
  description: string;
  items: SpecimenPackageItem[];
  packageId: string;
  packageName: string;
};

const rawRecords = sqdRaw as RawRecord[];
const rawBuildings = sssRaw as RawBuilding[];
const rawDictionaryGroups = bbRaw as RawDictionaryGroup[];
const rawSpecimenPackages = bbtcRaw as RawSpecimenPackage[];
const commonSpecimenKeywordLimit = 8;

function cloneSpecialConditions(
  conditions: RawSpecialConditions,
): WorkbenchSpecialConditions {
  return {
    abnormalBleeding: conditions.abnormalBleeding,
    birthControl: conditions.birthControl,
    hormoneReplacement: conditions.hormoneReplacement,
    hysterectomy: conditions.hysterectomy,
    iud: conditions.iud,
    lactation: conditions.lactation,
    menopause: conditions.menopause,
    other: conditions.other,
    pregnancy: conditions.pregnancy,
    radiotherapy: conditions.radiotherapy,
  };
}

function cloneGynecologyInfo(info: RawGynecologyInfo): WorkbenchGynecologyInfo {
  return {
    additionalNotes: info.additionalNotes,
    hpvResult: info.hpvResult,
    lastMenstrualPeriod: info.lastMenstrualPeriod,
    menopause: info.menopause,
    previousCytology: info.previousCytology,
    previousTreatment: info.previousTreatment,
    specialConditions: cloneSpecialConditions(info.specialConditions),
  };
}

function mapSpecimenItem(
  item: RawSpecimenItem,
  index: number,
  applicationNo: string,
): WorkbenchSpecimenItem {
  return {
    id: `${applicationNo}-${item.specimenNo}-${index}`,
    quantity: item.quantity,
    specimenName: item.specimenName,
    specimenNo: item.specimenNo,
    specimenSite: item.specimenSite,
    status: item.status,
  };
}

function mapRecord(record: RawRecord): ApplicationRegistrationWorkbenchRecord {
  const { applicationInfo, gynecologyInfo, specimenItems, surgeryInfo } = record;
  return {
    applicationId: applicationInfo.applicationNo || applicationInfo.inpatientNo,
    contagiousSpecimen: {
      hepatitis: applicationInfo.contagiousSpecimen.hepatitis,
      hiv: applicationInfo.contagiousSpecimen.hiv,
      isolation: applicationInfo.contagiousSpecimen.isolation,
      syphilis: applicationInfo.contagiousSpecimen.syphilis,
      tuberculosis: applicationInfo.contagiousSpecimen.tuberculosis,
    },
    gynecologyInfo: cloneGynecologyInfo(gynecologyInfo),
    patientInfo: {
      age: applicationInfo.age,
      applicationDate: applicationInfo.applicationDate,
      applicationNo: applicationInfo.applicationNo,
      applyDept: applicationInfo.applyDept,
      applyDoctor: applicationInfo.applyDoctor,
      bedNo: applicationInfo.bedNo,
      checkItem: applicationInfo.checkItem,
      clinicalDiagnosis: applicationInfo.clinicalDiagnosis,
      clinicalHistory: applicationInfo.clinicalHistory,
      deliveryRequirement: applicationInfo.deliveryRequirement,
      endoscopyDiagnosis: applicationInfo.endoscopyDiagnosis,
      frozenReminder: applicationInfo.frozenReminder,
      gender: applicationInfo.gender,
      idNo: applicationInfo.idNo,
      imagingResult: applicationInfo.imagingResult,
      inpatientNo: applicationInfo.inpatientNo,
      patientName: applicationInfo.patientName,
      patientVerified: applicationInfo.patientVerified,
      phone: applicationInfo.phone,
      registrationStatus: applicationInfo.registrationStatus,
      remark: applicationInfo.remark,
      specimenType: applicationInfo.specimenType,
      wardName: applicationInfo.wardName,
    },
    specimenItems: specimenItems.map((item, index) =>
      mapSpecimenItem(item, index, applicationInfo.applicationNo),
    ),
    surgeryInfo: {
      buildingId: surgeryInfo.buildingId,
      clinicalFindings: surgeryInfo.clinicalFindings,
      fixativeType: surgeryInfo.fixativeType,
      fixationPerson: surgeryInfo.fixationPerson,
      fixationTime: surgeryInfo.fixationTime,
      roomId: surgeryInfo.roomId,
      specimenRemovalTime: surgeryInfo.specimenRemovalTime ?? '',
      surgeryName: surgeryInfo.surgeryName,
    },
  };
}

function mapOperatingBuilding(building: RawBuilding): OperatingBuildingOption {
  return {
    buildingId: building.buildingId,
    buildingName: building.buildingName,
    floors: building.floors,
    location: building.location,
    operatingRooms: building.operatingRooms.map((room) => ({
      buildingId: building.buildingId,
      cleanLevel: room.cleanLevel,
      floor: room.floor,
      roomId: room.roomId,
      roomName: room.roomName,
      roomType: room.roomType,
    })),
  };
}

function cloneDictionaryGroups() {
  return rawDictionaryGroups.map((group) => ({
    subParts: group.subParts.map((part) => ({
      partId: part.partId,
      partName: part.partName,
      specimens: [...part.specimens],
    })),
    systemId: group.systemId,
    systemName: group.systemName,
  })) satisfies SpecimenDictionaryGroup[];
}

function flattenDictionaryEntryOptions() {
  return rawDictionaryGroups.flatMap((group) =>
    group.subParts.flatMap((part) =>
      part.specimens.map((specimenName) => ({
        partId: part.partId,
        partName: part.partName,
        searchKeywords: buildSearchKeywords([
          group.systemName,
          part.partName,
          specimenName,
          `${part.partName}${specimenName}`,
        ]),
        specimenName,
        systemId: group.systemId,
        systemName: group.systemName,
      })),
    ),
  ) satisfies SpecimenDictionaryEntryOption[];
}

const specimenDictionaryEntryOptions = flattenDictionaryEntryOptions();

function mapSpecimenPackage(rawPackage: RawSpecimenPackage): SpecimenPackageOption {
  return {
    applyDept: rawPackage.applyDept,
    description: rawPackage.description,
    itemCount: rawPackage.items.length,
    items: rawPackage.items.map((item) => ({ ...item })),
    packageId: rawPackage.packageId,
    packageName: rawPackage.packageName,
    searchKeywords: buildSearchKeywords([
      rawPackage.packageName,
      rawPackage.applyDept,
      rawPackage.description,
      ...rawPackage.items.flatMap((item) => [item.specimenName, item.specimenSite]),
    ]),
  };
}

export async function lookupApplicationRegistrationWorkbenchRecord(
  query: WorkbenchLookupQuery,
) {
  const normalizedKeyword = query.keyword.trim();
  const queryType: WorkbenchLookupType = query.queryType ?? 'INPATIENT_NO';
  if (!normalizedKeyword) {
    return null;
  }

  const matchedRecord = rawRecords.find((record) => {
    if (queryType === 'APPLICATION_NO') {
      return record.applicationInfo.applicationNo === normalizedKeyword;
    }
    if (queryType === 'PATIENT_NAME') {
      return record.applicationInfo.patientName.includes(normalizedKeyword);
    }
    if (queryType === 'AUTO') {
      return (
        record.applicationInfo.applicationNo === normalizedKeyword ||
        record.applicationInfo.inpatientNo === normalizedKeyword ||
        record.applicationInfo.patientName.includes(normalizedKeyword)
      );
    }
    return record.applicationInfo.inpatientNo === normalizedKeyword;
  });

  return matchedRecord ? mapRecord(matchedRecord) : null;
}

export async function listOperatingBuildingOptions() {
  return rawBuildings.map((building) => mapOperatingBuilding(building));
}

export async function listOperatingRoomOptions(
  buildingId: string,
): Promise<OperatingRoomOption[]> {
  const normalizedBuildingId = buildingId.trim();
  if (!normalizedBuildingId) {
    return [];
  }

  return rawBuildings
    .filter((building) => building.buildingId === normalizedBuildingId)
    .flatMap((building) => mapOperatingBuilding(building).operatingRooms);
}

export async function listSpecimenDictionaryGroups(keyword = '') {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    return cloneDictionaryGroups();
  }

  return rawDictionaryGroups
    .map((group) => {
      const filteredParts = group.subParts
        .map((part) => {
          const matchedSpecimens = part.specimens.filter((specimen) =>
            matchesSearchKeyword(
              normalizedKeyword,
              buildSearchKeywords([
                group.systemName,
                part.partName,
                specimen,
                `${part.partName}${specimen}`,
              ]),
            ),
          );

          if (
            !matchesSearchKeyword(
              normalizedKeyword,
              buildSearchKeywords([group.systemName, part.partName]),
            ) &&
            matchedSpecimens.length === 0
          ) {
            return null;
          }

          return {
            partId: part.partId,
            partName: part.partName,
            specimens:
              matchedSpecimens.length > 0 ? matchedSpecimens : [...part.specimens],
          };
        })
        .filter((part): part is SpecimenDictionaryGroup['subParts'][number] => Boolean(part));

      if (
        !matchesSearchKeyword(
          normalizedKeyword,
          buildSearchKeywords([group.systemName]),
        ) &&
        filteredParts.length === 0
      ) {
        return null;
      }

      return {
        subParts:
          filteredParts.length > 0
            ? filteredParts
            : cloneDictionaryGroups().find(
                (item) => item.systemId === group.systemId,
              )?.subParts ?? [],
        systemId: group.systemId,
        systemName: group.systemName,
      };
    })
    .filter((group): group is SpecimenDictionaryGroup => Boolean(group));
}

export async function listSpecimenDictionaryEntryOptions(keyword = '') {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    return specimenDictionaryEntryOptions.map((option) => ({ ...option }));
  }

  return specimenDictionaryEntryOptions
    .filter((option) =>
      matchesSearchKeyword(normalizedKeyword, option.searchKeywords),
    )
    .map((option) => ({ ...option }));
}

export async function listCommonSpecimenOptions() {
  return specimenDictionaryEntryOptions
    .slice(0, commonSpecimenKeywordLimit)
    .map((option) => ({ ...option }));
}

export async function listSpecimenPackageOptions(
  keyword = '',
  applyDept = '',
) {
  const normalizedKeyword = keyword.trim();
  const normalizedDept = applyDept.trim();

  return rawSpecimenPackages
    .map((item) => mapSpecimenPackage(item))
    .filter((item) => {
      const matchesDept =
        !normalizedDept ||
        item.applyDept === normalizedDept ||
        item.applyDept.includes(normalizedDept);
      const matchesKeyword =
        !normalizedKeyword ||
        matchesSearchKeyword(normalizedKeyword, item.searchKeywords);

      return matchesDept && matchesKeyword;
    });
}
