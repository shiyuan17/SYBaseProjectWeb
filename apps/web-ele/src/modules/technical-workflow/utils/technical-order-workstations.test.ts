import type {
  TechnicalWorkbenchColumn,
  TechnicalWorkbenchRow,
} from '../types/technical-workbench';

import { describe, expect, it } from 'vitest';

import { IHC_WORKSTATION_CONFIG } from './technical-order-workstations';

function createRow(
  overrides: Partial<TechnicalWorkbenchRow> = {},
): TechnicalWorkbenchRow {
  return {
    id: 'ROW-001',
    searchableText: '',
    ...overrides,
  };
}

function getIhcColumn(key: string): TechnicalWorkbenchColumn {
  const column = IHC_WORKSTATION_CONFIG.columns.find(
    (item) => item.key === key,
  );
  expect(column).toBeDefined();
  return column!;
}

describe('IHC_WORKSTATION_CONFIG', () => {
  it('prefers patientIdDisplay and hides internal UUID patient ids', () => {
    const patientIdColumn = getIhcColumn('patientId');

    expect(
      patientIdColumn.formatter?.(
        createRow({
          patientId: '946db168-2158-4a78-8fe2-4de5a14650a',
          patientIdDisplay: '08305',
        }),
        0,
      ),
    ).toBe('08305');

    expect(
      patientIdColumn.formatter?.(
        createRow({
          patientId: '946db168-2158-4a78-8fe2-4de5a14650a',
        }),
        0,
      ),
    ).toBe('-');
  });

  it('removes the legacy ihc columns the workstation no longer shows', () => {
    const labels = IHC_WORKSTATION_CONFIG.columns.map((column) => column.label);

    expect(labels).not.toContain('病理号');
    expect(labels).not.toContain('玻片序号');
    expect(labels).not.toContain('打印指令回传结果');
  });
});
