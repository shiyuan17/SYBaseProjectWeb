import { describe, expect, it } from 'vitest';

import type {
  SpecimenTrackingSummary,
  TrackingEventView,
} from '../types/specimen-workflow';

import {
  buildTrackingTimelineData,
  getSpecimenTimelineLabel,
} from './tracking-timeline';

function createSpecimen(
  overrides: Partial<SpecimenTrackingSummary> = {},
): SpecimenTrackingSummary {
  return {
    abnormalReason: null,
    barcode: 'BC-001',
    clinicalSymptom: null,
    collectionMode: null,
    containerCount: 1,
    containerName: 'Bottle',
    fixationStatus: 'FIXING',
    id: 'SPEC-001',
    labelPrintStatus: 'SUCCESS',
    specimenCount: 1,
    specimenName: 'Specimen A',
    specimenNo: 'SP-001',
    specimenSite: '胃',
    specimenStatus: 'REGISTERED',
    specimenType: 'ROUTINE',
    ...overrides,
  };
}

function createEvent(
  overrides: Partial<TrackingEventView> = {},
): TrackingEventView {
  return {
    eventContent: 'event',
    eventStatus: 'SUCCESS',
    eventTime: '2026-05-24T08:00:00',
    eventType: 'REGISTER',
    nodeCode: 'SPECIMEN_COLLECTION',
    operatorName: 'operator-a',
    sourceTerminal: 'TERMINAL-1',
    ...overrides,
  };
}

describe('tracking-timeline', () => {
  it('uses specimen number first for tab labels', () => {
    expect(getSpecimenTimelineLabel(createSpecimen())).toBe('SP-001');
    expect(
      getSpecimenTimelineLabel(
        createSpecimen({ barcode: 'BC-002', specimenNo: ' ' }),
      ),
    ).toBe('BC-002');
  });

  it('builds a single overall group and specimen timeline for a single event', () => {
    const data = buildTrackingTimelineData(
      [createEvent({ specimenId: 'SPEC-001', specimenNo: 'SP-001' })],
      [createSpecimen()],
    );

    expect(data.publicEvents).toEqual([]);
    expect(data.overallTimelineGroups).toHaveLength(1);
    expect(data.overallTimelineGroups[0]).toMatchObject({
      specimenCount: 1,
      specimenIds: ['SPEC-001'],
      specimenLabels: ['SP-001'],
    });
    expect(data.specimenTimelineMap['SPEC-001']).toHaveLength(1);
  });

  it('aggregates multi-specimen events that share second, node, type and status', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          operatorName: 'operator-a',
          specimenBarcode: 'BC-001',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
        createEvent({
          operatorName: 'operator-b',
          sourceTerminal: 'TERMINAL-2',
          specimenBarcode: 'BC-002',
          specimenId: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
      ],
      [
        createSpecimen(),
        createSpecimen({ barcode: 'BC-002', id: 'SPEC-002', specimenNo: 'SP-002' }),
      ],
    );

    expect(data.overallTimelineGroups).toHaveLength(1);
    expect(data.overallTimelineGroups[0]).toMatchObject({
      operatorNames: ['operator-a', 'operator-b'],
      sourceTerminals: ['TERMINAL-1', 'TERMINAL-2'],
      specimenCount: 2,
      specimenIds: ['SPEC-001', 'SPEC-002'],
      specimenLabels: ['SP-001', 'SP-002'],
    });
    expect(data.specimenTimelineMap['SPEC-001']).toHaveLength(1);
    expect(data.specimenTimelineMap['SPEC-002']).toHaveLength(1);
  });

  it('does not merge same-second events when the event type differs', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          eventType: 'REGISTER',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
        createEvent({
          eventType: 'ORDER_CREATED',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
      ],
      [createSpecimen()],
    );

    expect(data.overallTimelineGroups).toHaveLength(2);
  });

  it('keeps public events only in the overall timeline data', () => {
    const publicEvent = createEvent({
      eventType: 'ORDER_PRINTED',
      operatorName: 'operator-public',
      sourceTerminal: 'TERMINAL-PUBLIC',
      specimenId: null,
      specimenNo: null,
    });
    const data = buildTrackingTimelineData(
      [publicEvent],
      [createSpecimen()],
    );

    expect(data.publicEvents).toEqual([publicEvent]);
    expect(data.specimenTimelineMap).toEqual({});
    expect(data.overallTimelineGroups).toHaveLength(1);
    expect(data.overallTimelineGroups[0]).toMatchObject({
      specimenCount: 0,
      specimenIds: [],
      specimenLabels: [],
    });
  });

  it('falls back to specimen-order assignment for legacy specimen-scoped events without specimen ids', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          eventStatus: 'SUCCESS',
          eventTime: '2026-05-24T08:00:00',
          eventType: 'REGISTERED',
          nodeCode: 'SPECIMEN_COLLECTION',
          specimenId: null,
          specimenNo: null,
        }),
        createEvent({
          eventStatus: 'SUCCESS',
          eventTime: '2026-05-24T08:00:01',
          eventType: 'REGISTERED',
          nodeCode: 'SPECIMEN_COLLECTION',
          specimenId: null,
          specimenNo: null,
        }),
        createEvent({
          eventStatus: 'SUCCESS',
          eventTime: '2026-05-24T08:00:02',
          eventType: 'REGISTERED',
          nodeCode: 'SPECIMEN_COLLECTION',
          specimenId: null,
          specimenNo: null,
        }),
      ],
      [
        createSpecimen(),
        createSpecimen({ barcode: 'BC-002', id: 'SPEC-002', specimenNo: 'SP-002' }),
        createSpecimen({ barcode: 'BC-003', id: 'SPEC-003', specimenNo: 'SP-003' }),
      ],
    );

    expect(data.publicEvents).toEqual([]);
    expect(data.specimenTimelineMap['SPEC-001']).toHaveLength(1);
    expect(data.specimenTimelineMap['SPEC-002']).toHaveLength(1);
    expect(data.specimenTimelineMap['SPEC-003']).toHaveLength(1);
    expect(data.overallTimelineGroups).toHaveLength(3);
    expect(data.overallTimelineGroups[0]).toMatchObject({
      specimenCount: 1,
      specimenIds: ['SPEC-001'],
      specimenLabels: ['SP-001'],
    });
  });

  it('still treats order-printed events without specimen ids as public events', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          eventStatus: 'SUCCESS',
          eventType: 'ORDER_PRINTED',
          nodeCode: 'TRANSPORT',
          specimenId: null,
          specimenNo: null,
        }),
      ],
      [
        createSpecimen(),
        createSpecimen({ barcode: 'BC-002', id: 'SPEC-002', specimenNo: 'SP-002' }),
      ],
    );

    expect(data.publicEvents).toHaveLength(1);
    expect(data.specimenTimelineMap).toEqual({});
    expect(data.overallTimelineGroups[0]).toMatchObject({
      specimenCount: 0,
      specimenIds: [],
    });
  });
});
