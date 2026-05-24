import type {
  SpecimenTrackingSummary,
  TrackingEventView,
} from '../types/specimen-workflow';

export interface OverallTimelineGroup {
  eventStatus: null | string;
  eventTime: null | string;
  eventType: null | string;
  events: TrackingEventView[];
  key: string;
  nodeCode: null | string;
  operatorNames: string[];
  sourceTerminals: string[];
  specimenCount: number;
  specimenIds: string[];
  specimenLabels: string[];
}

export interface TrackingTimelineData {
  overallTimelineGroups: OverallTimelineGroup[];
  publicEvents: TrackingEventView[];
  specimenTimelineMap: Record<string, TrackingEventView[]>;
}

const SPECIMEN_SCOPED_EVENT_TYPES = new Set([
  'COMPLETED',
  'DIRECT_RECEIVE',
  'HANDED_OVER',
  'ORDER_CREATED',
  'PRINTED',
  'RECEIVED',
  'REGISTERED',
  'REJECTED',
  'RETRY',
  'RETURNED',
  'STARTED',
]);

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

function normalizeTimelineSecond(value?: null | string) {
  const normalized = normalizeText(value).replace(' ', 'T');
  return normalized ? normalized.slice(0, 19) : '';
}

function pushUnique(target: string[], value?: null | string) {
  const normalized = normalizeText(value);
  if (!normalized || target.includes(normalized)) {
    return;
  }
  target.push(normalized);
}

export function getSpecimenTimelineLabel(
  specimen: Pick<SpecimenTrackingSummary, 'barcode' | 'id' | 'specimenNo'>,
) {
  return normalizeText(specimen.specimenNo)
    || normalizeText(specimen.barcode)
    || specimen.id;
}

export function buildTrackingTimelineData(
  events: TrackingEventView[],
  specimens: SpecimenTrackingSummary[],
): TrackingTimelineData {
  const overallTimelineGroups: OverallTimelineGroup[] = [];
  const overallTimelineGroupMap = new Map<string, OverallTimelineGroup>();
  const publicEvents: TrackingEventView[] = [];
  const specimenTimelineMap: Record<string, TrackingEventView[]> = {};
  const fallbackSpecimenAssignmentCountMap = new Map<string, number>();
  const specimenLabelMap = Object.fromEntries(
    specimens.map((specimen) => [specimen.id, getSpecimenTimelineLabel(specimen)]),
  );
  const orderedSpecimens = specimens.map((specimen) => ({
    id: specimen.id,
  }));

  for (const event of events) {
    const specimenId = resolveEventSpecimenId(
      event,
      orderedSpecimens,
      fallbackSpecimenAssignmentCountMap,
    );
    const groupKey = [
      normalizeTimelineSecond(event.eventTime),
      normalizeText(event.nodeCode),
      normalizeText(event.eventType),
      normalizeText(event.eventStatus),
    ].join('|');

    let group = overallTimelineGroupMap.get(groupKey);
    if (!group) {
      group = {
        eventStatus: event.eventStatus,
        eventTime: event.eventTime,
        eventType: event.eventType,
        events: [],
        key: groupKey,
        nodeCode: event.nodeCode,
        operatorNames: [],
        sourceTerminals: [],
        specimenCount: 0,
        specimenIds: [],
        specimenLabels: [],
      };
      overallTimelineGroupMap.set(groupKey, group);
      overallTimelineGroups.push(group);
    }

    group.events.push(event);
    pushUnique(group.operatorNames, event.operatorName);
    pushUnique(group.sourceTerminals, event.sourceTerminal);

    if (specimenId) {
      specimenTimelineMap[specimenId] ??= [];
      specimenTimelineMap[specimenId].push(event);
      if (!group.specimenIds.includes(specimenId)) {
        group.specimenIds.push(specimenId);
        group.specimenCount = group.specimenIds.length;
      }
      pushUnique(
        group.specimenLabels,
        specimenLabelMap[specimenId]
          ?? event.specimenNo
          ?? event.specimenBarcode,
      );
      continue;
    }

    publicEvents.push(event);
  }

  return {
    overallTimelineGroups,
    publicEvents,
    specimenTimelineMap,
  };
}

function resolveEventSpecimenId(
  event: TrackingEventView,
  specimens: Array<{ id: string }>,
  fallbackSpecimenAssignmentCountMap: Map<string, number>,
) {
  const directSpecimenId = normalizeText(event.specimenId);
  if (directSpecimenId) {
    return directSpecimenId;
  }

  const eventType = normalizeText(event.eventType);
  if (!eventType || !SPECIMEN_SCOPED_EVENT_TYPES.has(eventType)) {
    return '';
  }

  if (specimens.length === 1) {
    return specimens[0]?.id ?? '';
  }

  const fallbackKey = [
    normalizeText(event.nodeCode),
    eventType,
    normalizeText(event.eventStatus),
  ].join('|');
  const assignmentIndex = fallbackSpecimenAssignmentCountMap.get(fallbackKey) ?? 0;
  fallbackSpecimenAssignmentCountMap.set(fallbackKey, assignmentIndex + 1);

  return specimens[assignmentIndex]?.id ?? '';
}
