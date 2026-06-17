import { describe, expect, it } from 'vitest';

import {
  formatArchiveObjectStatus,
  formatArchiveStorageStatus,
  formatEquipmentCategory,
  formatEquipmentStatus,
  formatMaterialLoanStatus,
} from './format';

describe('operation-support format helpers', () => {
  it('formats archive storage status with unarchived fallback', () => {
    expect(formatArchiveStorageStatus(null)).toBe('未归档');
    expect(formatArchiveStorageStatus(undefined)).toBe('未归档');
    expect(formatArchiveStorageStatus('')).toBe('未归档');
    expect(formatArchiveStorageStatus('NOT_ARCHIVED')).toBe('未归档');
    expect(formatArchiveStorageStatus('IN_STORAGE')).toBe('在库');
    expect(formatArchiveStorageStatus('BORROWED')).toBe('已借出');
  });

  it('formats material loan status without leaking backend enum text', () => {
    expect(formatMaterialLoanStatus('NONE')).toBe('未借阅');
    expect(formatMaterialLoanStatus('BORROWED')).toBe('借出中');
    expect(formatMaterialLoanStatus('RETURNED')).toBe('已归还');
  });

  it('formats archive object status without leaking active enum text', () => {
    expect(formatArchiveObjectStatus('ACTIVE')).toBe('启用');
    expect(formatArchiveObjectStatus(undefined)).toBe('-');
  });

  it('formats equipment status and category with legacy dialog labels', () => {
    expect(formatEquipmentStatus('ACTIVE')).toBe('正常');
    expect(formatEquipmentStatus('DISABLED')).toBe('禁用');
    expect(formatEquipmentStatus('SCRAPPED')).toBe('报废报损');
    expect(formatEquipmentCategory('免疫组化仪')).toBe('免疫组化仪');
    expect(formatEquipmentCategory('临床检验分析仪器')).toBe(
      '临床检验分析仪器',
    );
  });
});
