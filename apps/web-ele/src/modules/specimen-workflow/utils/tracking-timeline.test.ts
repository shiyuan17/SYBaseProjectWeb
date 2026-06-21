import type {
  SpecimenTrackingSummary,
  TrackingEventView,
} from '../types/specimen-workflow';

import { describe, expect, it } from 'vitest';

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

  it('keeps different specimen scopes in separate overall groups', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          operatorIp: '10.0.0.1',
          operatorName: 'operator-a',
          specimenBarcode: 'BC-001',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
        createEvent({
          operatorIp: '10.0.0.2',
          operatorName: 'operator-b',
          sourceTerminal: 'TERMINAL-2',
          specimenBarcode: 'BC-002',
          specimenId: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
      ],
      [
        createSpecimen(),
        createSpecimen({
          barcode: 'BC-002',
          id: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
      ],
    );

    expect(data.overallTimelineGroups).toHaveLength(2);
    expect(data.overallTimelineGroups[0]).toMatchObject({
      eventContents: ['流程事件'],
      operatorIps: ['10.0.0.1'],
      operatorNames: ['operator-a'],
      sourceTerminals: ['TERMINAL-1'],
      specimenCount: 1,
      specimenIds: ['SPEC-001'],
      specimenLabels: ['SP-001'],
    });
    expect(data.overallTimelineGroups[1]).toMatchObject({
      eventContents: ['流程事件'],
      operatorIps: ['10.0.0.2'],
      operatorNames: ['operator-b'],
      sourceTerminals: ['TERMINAL-2'],
      specimenCount: 1,
      specimenIds: ['SPEC-002'],
      specimenLabels: ['SP-002'],
    });
    expect(data.specimenTimelineMap['SPEC-001']).toHaveLength(1);
    expect(data.specimenTimelineMap['SPEC-002']).toHaveLength(1);
  });

  it('merges same-node events for the same specimen scope even when event types differ', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          eventContent: null,
          eventType: 'START',
          nodeCode: 'FIXATION',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
        createEvent({
          eventContent: null,
          eventType: 'COMPLETE',
          nodeCode: 'FIXATION',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
      ],
      [createSpecimen()],
    );

    expect(data.overallTimelineGroups).toHaveLength(1);
    expect(data.overallTimelineGroups[0]).toMatchObject({
      eventContents: ['开始固定', '完成固定'],
      eventStatus: 'SUCCESS',
      nodeCode: 'FIXATION',
      specimenIds: ['SPEC-001'],
      specimenLabels: ['SP-001'],
    });
  });

  it('does not merge events from different nodes or specimen scopes', () => {
    const data = buildTrackingTimelineData(
      [
        createEvent({
          eventContent: null,
          eventType: 'START',
          nodeCode: 'FIXATION',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
        createEvent({
          eventContent: null,
          eventType: 'COMPLETE',
          nodeCode: 'FIXATION',
          specimenId: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
        createEvent({
          eventContent: null,
          eventType: 'UPLOAD_MEDIA',
          nodeCode: 'GROSSING',
          specimenId: 'SPEC-001',
          specimenNo: 'SP-001',
        }),
      ],
      [
        createSpecimen(),
        createSpecimen({
          barcode: 'BC-002',
          id: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
      ],
    );

    expect(data.overallTimelineGroups).toHaveLength(3);
    expect(
      data.overallTimelineGroups.map((group) => group.specimenIds),
    ).toEqual([['SPEC-001'], ['SPEC-002'], ['SPEC-001']]);
  });

  it('keeps public events only in the overall timeline data', () => {
    const publicEvent = createEvent({
      eventType: 'ORDER_PRINTED',
      operatorName: 'operator-public',
      sourceTerminal: 'TERMINAL-PUBLIC',
      specimenId: null,
      specimenNo: null,
    });
    const data = buildTrackingTimelineData([publicEvent], [createSpecimen()]);

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
        createSpecimen({
          barcode: 'BC-002',
          id: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
        createSpecimen({
          barcode: 'BC-003',
          id: 'SPEC-003',
          specimenNo: 'SP-003',
        }),
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
        createSpecimen({
          barcode: 'BC-002',
          id: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
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
