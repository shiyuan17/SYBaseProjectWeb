import type { PathologyScreenDashboardResponse } from '../types/pathology-screen';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPathologyDashboardSnapshotStorageKey,
  readPathologyDashboardSnapshot,
  writePathologyDashboardSnapshot,
} from './pathology-dashboard-cache';

function createDashboardResponse(): PathologyScreenDashboardResponse {
  return {
    diagnosisWorkloadRows: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    lastMonthWorkload: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    overallComplianceRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    reportRevisionRateTrend: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    structuredReportSummary: {
      reportCount: {
        label: '结构化报告工作量（例）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '32',
      },
      sourceNote: null,
      status: 'AVAILABLE',
      templateTypeCount: {
        label: '结构化报告类型（种）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '4',
      },
      topTemplates: [],
    },
    summaryCards: {
      annualCaseTotal: {
        label: '全年病例总数（例）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '128',
      },
      lastMonthCaseTotal: {
        label: '上月病例总数（例）',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '16',
      },
      lastMonthReportTimelinessRate: {
        label: '上月报告及时率',
        sourceNote: null,
        status: 'AVAILABLE',
        value: '98%',
      },
    },
    technicalQualificationRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    threeYearReportQualityRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
    threeYearTechnicalRates: {
      items: [],
      sourceNote: null,
      status: 'AVAILABLE',
    },
  };
}

describe('pathology-dashboard-cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  it('reads a fresh cached snapshot for the same user', () => {
    writePathologyDashboardSnapshot('USER-001', createDashboardResponse());

    const snapshot = readPathologyDashboardSnapshot('USER-001');

    expect(snapshot?.userId).toBe('USER-001');
    expect(snapshot?.dashboard.summaryCards.annualCaseTotal.value).toBe('128');
  });

  it('returns null once the cached snapshot is expired', () => {
    writePathologyDashboardSnapshot('USER-001', createDashboardResponse());

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(readPathologyDashboardSnapshot('USER-001')).toBeNull();
  });

  it('ignores malformed cached data and removes it from sessionStorage', () => {
    const key = buildPathologyDashboardSnapshotStorageKey('USER-001');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    sessionStorage.setItem(key, '{ invalid json }');

    expect(readPathologyDashboardSnapshot('USER-001')).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('keeps snapshots isolated per user', () => {
    writePathologyDashboardSnapshot('USER-001', createDashboardResponse());

    expect(readPathologyDashboardSnapshot('USER-002')).toBeNull();
  });
});
