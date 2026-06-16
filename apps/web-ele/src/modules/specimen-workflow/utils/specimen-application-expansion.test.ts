import type {
  SpecimenManagementListItem,
  SpecimenManagementListQuery,
} from '../types/specimen-workflow';

import { describe, expect, it, vi } from 'vitest';

import {
  loadSpecimensWithApplicationExpansion,
  resolveExactSpecimenMatches,
  resolveSingleExactSpecimenMatch,
} from './specimen-application-expansion';

function createRowFixture(
  overrides: Partial<SpecimenManagementListItem> = {},
): SpecimenManagementListItem {
  return {
    abnormalFlag: false,
    applicationId: 'APP-001',
    applicationNo: 'AP-001',
    barcode: 'BC-001',
    containerCount: 1,
    containerName: '福尔马林瓶',
    fixationStatus: 'PENDING',
    labelPrintBatchNo: null,
    labelPrintStatus: 'SUCCESS',
    latestTrackingAt: null,
    patientName: 'Alice',
    registeredAt: '2026-06-02 09:00:00',
    specimenCount: 1,
    specimenId: 'SPEC-001',
    specimenName: '右臂组织',
    specimenNo: 'SP-001',
    specimenSite: '右臂',
    specimenStatus: 'REGISTERED',
    specimenType: '常规',
    submittingDepartmentId: null,
    submittingDepartmentName: null,
    verificationStatus: 'PENDING',
    ...overrides,
  } as SpecimenManagementListItem;
}

describe('specimen application expansion helpers', () => {
  it('finds exact matches by specimen identifiers', () => {
    const rows = [
      createRowFixture(),
      createRowFixture({
        barcode: 'BC-002',
        specimenId: 'SPEC-002',
        specimenNo: 'SP-002',
      }),
    ];

    expect(resolveExactSpecimenMatches(rows, 'SP-001')).toHaveLength(1);
    expect(resolveExactSpecimenMatches(rows, 'SPEC-002')).toHaveLength(1);
    expect(resolveSingleExactSpecimenMatch(rows, 'BC-001')?.specimenId).toBe(
      'SPEC-001',
    );
  });

  it('keeps the initial result when keyword is not a single exact match', async () => {
    const listSpecimens = vi.fn(async () => ({
      items: [
        createRowFixture(),
        createRowFixture({
          barcode: 'BC-001',
          specimenId: 'SPEC-002',
          specimenNo: 'SP-002',
        }),
      ],
      page: 1,
      size: 100,
      summary: {
        abnormalCount: 0,
        labelPrintedCount: 0,
        pendingLabelCount: 0,
        totalCount: 2,
        unboundCount: 0,
      },
      total: 2,
    }));

    const result = await loadSpecimensWithApplicationExpansion({
      keyword: 'BC-001',
      listSpecimens,
      maxQuerySize: 100,
    });

    expect(result.mode).toBe('default');
    expect(result.items).toHaveLength(2);
    expect(listSpecimens).toHaveBeenCalledTimes(1);
  });

  it('expands to the whole application after a single exact match', async () => {
    const firstRow = createRowFixture();
    const siblingRow = createRowFixture({
      barcode: 'BC-002',
      specimenId: 'SPEC-002',
      specimenNo: 'SP-002',
      specimenName: '左臂组织',
    });
    const listSpecimens = vi.fn(async (params: SpecimenManagementListQuery) => {
      if (params.applicationNo) {
        return {
          items: [firstRow, siblingRow],
          page: 1,
          size: 100,
          summary: {
            abnormalCount: 0,
            labelPrintedCount: 0,
            pendingLabelCount: 0,
            totalCount: 2,
            unboundCount: 0,
          },
          total: 2,
        };
      }

      return {
        items: [firstRow],
        page: 1,
        size: 100,
        summary: {
          abnormalCount: 0,
          labelPrintedCount: 0,
          pendingLabelCount: 0,
          totalCount: 1,
          unboundCount: 0,
        },
        total: 1,
      };
    });

    const result = await loadSpecimensWithApplicationExpansion({
      keyword: 'SP-001',
      listSpecimens,
      maxQuerySize: 100,
    });

    expect(result.mode).toBe('expanded');
    expect(result.applicationNo).toBe('AP-001');
    expect(result.items).toHaveLength(2);
    expect(listSpecimens).toHaveBeenCalledTimes(2);
    expect(listSpecimens).toHaveBeenLastCalledWith({
      applicationNo: 'AP-001',
      page: 1,
      size: 100,
    });
  });
});
