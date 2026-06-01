import type {
  ApplicationListItem,
  ApplicationListQuery,
  SpecimenTrackingSummary,
  TrackingEventView,
  TrackingQueryView as WorkflowTrackingQueryView,
} from '../types/specimen-workflow';
import type { TrackingTimelineData } from './tracking-timeline';

import { getSpecimenTimelineLabel } from './tracking-timeline';

export type TrackingApplicationListFilters = {
  applicationNo: string;
  dateRange: string[];
  page: number;
  patientName: string;
  size: number;
};

export type SpecimenTimelineTab = {
  events: TrackingEventView[];
  id: string;
  label: string;
};

export function buildTrackingApplicationListQuery(
  filters: TrackingApplicationListFilters,
): ApplicationListQuery {
  return {
    applicationNo: filters.applicationNo.trim() || undefined,
    dateFrom: filters.dateRange[0] || undefined,
    dateTo: filters.dateRange[1] || undefined,
    page: filters.page,
    patientName: filters.patientName.trim() || undefined,
    size: filters.size,
  };
}

export function resolveDetailRecentEvents(
  detailTracking: null | WorkflowTrackingQueryView,
): TrackingEventView[] {
  return detailTracking?.recentEvents ?? [];
}

export function resolveDetailSpecimens(
  detailTracking: null | WorkflowTrackingQueryView,
): SpecimenTrackingSummary[] {
  return detailTracking?.specimens ?? [];
}

export function buildSpecimenTimelineTabs(
  detailSpecimens: SpecimenTrackingSummary[],
  trackingTimelineData: TrackingTimelineData,
): SpecimenTimelineTab[] {
  return detailSpecimens.map((specimen) => ({
    events: trackingTimelineData.specimenTimelineMap[specimen.id] ?? [],
    id: specimen.id,
    label: getSpecimenTimelineLabel(specimen),
  }));
}

export function formatAggregateContext(
  values: string[],
  multipleLabel: string,
) {
  if (values.length === 0) {
    return '-';
  }
  if (values.length === 1) {
    return values[0];
  }
  return `${multipleLabel}（${values.join('、')}）`;
}

export function buildInitialApplicationMatch(
  applicationId: string,
  items: ApplicationListItem[],
): null | string {
  const normalizedApplicationId = applicationId.trim();
  if (!normalizedApplicationId) {
    return null;
  }

  const matchedItem = items.find((item) => item.id === normalizedApplicationId);
  return matchedItem?.id ?? normalizedApplicationId;
}
