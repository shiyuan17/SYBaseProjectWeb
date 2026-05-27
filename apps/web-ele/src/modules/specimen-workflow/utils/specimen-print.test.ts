import { describe, expect, it } from 'vitest';

import { buildSpecimenPrintDocument } from './specimen-print';

describe('buildSpecimenPrintDocument', () => {
  it('renders the label fields and qrcode into a printable html document', async () => {
    const documentHtml = await buildSpecimenPrintDocument({
      context: {
        applyDept: '急诊科',
        gender: '女',
        idNo: '34734663',
        patientName: '潘姐',
        roomLabel: '手术室2',
        surgeryTime: '2026-05-27 11:02:00',
      },
      item: {
        id: 'item-1',
        quantity: 1,
        specimenName: '右侧胫骨感染病灶',
        specimenNo: '22498',
        specimenSite: '骨髓炎',
        status: '标本确认',
      },
    });

    expect(documentHtml).toContain('34734663');
    expect(documentHtml).toContain('急诊科');
    expect(documentHtml).toContain('潘姐（女）');
    expect(documentHtml).toContain('26-05-27 11:02  手术室2');
    expect(documentHtml).toContain('右侧胫骨感染病灶');
    expect(documentHtml).toContain('https://api.qrserver.com/v1/create-qr-code/');
    expect(documentHtml).toContain('window.print()');
  });
});
