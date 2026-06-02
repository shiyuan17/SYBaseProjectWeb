import { describe, expect, it } from 'vitest';

import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';

import {
  isTechnicalRegistrationPathologyNoPreview,
  resolveTechnicalRegistrationApplicationType,
  resolveTechnicalRegistrationPathologyNo,
} from './specimen-registration-application';

describe('specimen registration application helpers', () => {
  it('contains all application types from the legacy receive checklist', () => {
    expect(APPLICATION_TYPE_OPTIONS.map((item) => item.label)).toEqual([
      '常规',
      '冰冻',
      '会诊',
      '免疫组化',
      'HPV',
      '妇科液基DNA',
      '快速',
      '细胞学会诊',
      '二代测序',
      '疑难会诊',
      '分子病理',
      '基因检测',
      '妇科液基细胞学',
      '妇科液基HPV',
      '补充报告',
      '科研',
      '穿刺活检',
      '细胞学',
      '免疫荧光',
      'FISH',
      '非妇科液基细胞学',
      '细胞学刮片',
      '技术医嘱',
      '电镜',
      '肝穿',
    ]);
  });

  it('keeps the backend pathology no when the selected type matches', () => {
    expect(
      resolveTechnicalRegistrationPathologyNo({
        applicationType: 'ROUTINE',
        existingPathologyNo: 'BL202606010007',
        referenceDate: '2026-06-01',
        sourceApplicationType: 'ROUTINE',
      }),
    ).toBe('BL202606010007');
    expect(
      isTechnicalRegistrationPathologyNoPreview({
        applicationType: 'ROUTINE',
        existingPathologyNo: 'BL202606010007',
        sourceApplicationType: 'ROUTINE',
      }),
    ).toBe(false);
  });

  it('derives the supplemental report default number from the selected type', () => {
    expect(
      resolveTechnicalRegistrationPathologyNo({
        applicationType: 'SUPPLEMENTAL_REPORT',
        existingPathologyNo: 'BL202606010007',
        referenceDate: '2026-06-01',
        sourceApplicationType: 'ROUTINE',
      }),
    ).toBe('MS2600007');
    expect(
      isTechnicalRegistrationPathologyNoPreview({
        applicationType: 'SUPPLEMENTAL_REPORT',
        existingPathologyNo: 'BL202606010007',
        sourceApplicationType: 'ROUTINE',
      }),
    ).toBe(true);
  });

  it('keeps previewing a default number when the existing number belongs to another type', () => {
    expect(
      resolveTechnicalRegistrationPathologyNo({
        applicationType: 'SUPPLEMENTAL_REPORT',
        existingPathologyNo: 'BL202606010007',
        referenceDate: '2026-06-01',
        sourceApplicationType: 'SUPPLEMENTAL_REPORT',
      }),
    ).toBe('MS2600007');
    expect(
      isTechnicalRegistrationPathologyNoPreview({
        applicationType: 'SUPPLEMENTAL_REPORT',
        existingPathologyNo: 'BL202606010007',
        sourceApplicationType: 'SUPPLEMENTAL_REPORT',
      }),
    ).toBe(true);
  });

  it('normalizes application type labels before generating defaults', () => {
    expect(resolveTechnicalRegistrationApplicationType('补充报告')).toBe(
      'SUPPLEMENTAL_REPORT',
    );
    expect(
      resolveTechnicalRegistrationPathologyNo({
        applicationType: '冰冻',
        existingPathologyNo: 'BL202606010008',
        referenceDate: '2026-06-01',
        sourceApplicationType: '常规',
      }),
    ).toBe('BD202606010008');
  });
});
