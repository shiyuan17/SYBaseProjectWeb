import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildRoutineOrderApplicationLabelPrintDocument,
  openRoutineOrderApplicationLabelPrintWindow,
} from './routine-order-label-print';

function readPrintableText(documentHtml: string) {
  return documentHtml.replaceAll(/<[^>]+>/g, '').replaceAll(/\s+/g, ' ');
}

describe('routine-order-label-print', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders key medical-order fields in the print document', () => {
    const document = buildRoutineOrderApplicationLabelPrintDocument([
      {
        applicationNo: 'APP-001',
        checkItem: 'HE 染色',
        doctorTime: '2026-06-23 09:30:00',
        doctorUser: '开单医生甲',
        pathologyNo: 'BL-001',
        patientName: '林晓芸',
      },
    ]);

    const printableText = readPrintableText(document);

    expect(printableText).toContain('申请单号：APP-001');
    expect(printableText).toContain('病理号：BL-001');
    expect(printableText).toContain('患者姓名：林晓芸');
    expect(printableText).toContain('检查项目：HE 染色');
    expect(printableText).toContain('开单时间：2026-06-23 09:30:00');
    expect(printableText).toContain('开单医生：开单医生甲');
  });

  it('keeps one print section per selected row without deduplicating application numbers', () => {
    const document = buildRoutineOrderApplicationLabelPrintDocument([
      {
        applicationNo: 'APP-001',
        checkItem: 'HE 染色',
        doctorTime: '2026-06-23 09:30:00',
        doctorUser: '开单医生甲',
        pathologyNo: 'BL-001',
        patientName: '林晓芸',
      },
      {
        applicationNo: 'APP-001',
        checkItem: 'PAS',
        doctorTime: '2026-06-23 10:00:00',
        doctorUser: '开单医生乙',
        pathologyNo: 'BL-002',
        patientName: '周小燕',
      },
    ]);

    expect(document.match(/class="routine-order-label"/g)).toHaveLength(2);
    const printableText = readPrintableText(document);
    expect(printableText).toContain('检查项目：HE 染色');
    expect(printableText).toContain('检查项目：PAS');
  });

  it('opens a print window and writes the generated document', () => {
    const documentOpen = vi.fn();
    const documentWrite = vi.fn();
    const documentClose = vi.fn();
    const printWindow = {
      document: {
        close: documentClose,
        open: documentOpen,
        write: documentWrite,
      },
    } as const;

    vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);

    const opened = openRoutineOrderApplicationLabelPrintWindow([
      {
        applicationNo: 'APP-001',
        checkItem: 'HE 染色',
        doctorTime: '2026-06-23 09:30:00',
        doctorUser: '开单医生甲',
        pathologyNo: 'BL-001',
        patientName: '林晓芸',
      },
    ]);

    expect(opened).toBe(true);
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(documentOpen).toHaveBeenCalledTimes(1);
    expect(documentWrite).toHaveBeenCalledWith(
      expect.stringContaining('APP-001'),
    );
    expect(documentClose).toHaveBeenCalledTimes(1);
  });
});
