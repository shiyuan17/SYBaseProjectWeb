import { describe, expect, it } from 'vitest';

import {
  formatMedicalOrderCategoryCode,
  formatMedicalOrderExecutionScope,
  formatMedicalOrderType,
  formatNumberingRuleBizType,
  formatNumberingRuleResetPolicy,
  formatNumberingRuleScopeType,
} from './format';

describe('system-management format utils', () => {
  it('formats medical order dictionary known codes as Chinese labels', () => {
    expect(formatMedicalOrderCategoryCode('ROUTINE')).toBe('常规医嘱');
    expect(formatMedicalOrderCategoryCode('SPECIAL')).toBe('特检医嘱');
    expect(formatMedicalOrderType('ROUTINE')).toBe('常规医嘱');
    expect(formatMedicalOrderType('SPECIAL')).toBe('特检医嘱');
    expect(formatMedicalOrderExecutionScope('TECHNICIAN')).toBe('技师执行');
    expect(formatMedicalOrderExecutionScope('GLOBAL')).toBe('全院可用');
  });

  it('keeps unknown medical order dictionary codes unchanged', () => {
    expect(formatMedicalOrderCategoryCode('CUSTOM_CATEGORY')).toBe(
      'CUSTOM_CATEGORY',
    );
    expect(formatMedicalOrderType('CUSTOM_TYPE')).toBe('CUSTOM_TYPE');
    expect(formatMedicalOrderExecutionScope('CUSTOM_SCOPE')).toBe(
      'CUSTOM_SCOPE',
    );
  });

  it('formats empty medical order dictionary codes as placeholder', () => {
    expect(formatMedicalOrderCategoryCode('')).toBe('-');
    expect(formatMedicalOrderType(null)).toBe('-');
    expect(formatMedicalOrderExecutionScope(undefined)).toBe('-');
  });

  it('formats numbering rule known codes as Chinese labels', () => {
    expect(formatNumberingRuleBizType('APPLICATION_NO')).toBe('申请单号');
    expect(formatNumberingRuleBizType('BODY_PART_CODE')).toBe('部位编码');
    expect(formatNumberingRuleBizType('TRANSPORT_ORDER_NO')).toBe('转运单号');
    expect(formatNumberingRuleResetPolicy('NONE')).toBe('不重置');
    expect(formatNumberingRuleResetPolicy('DAILY')).toBe('每日重置');
    expect(formatNumberingRuleResetPolicy('MONTHLY')).toBe('每月重置');
    expect(formatNumberingRuleResetPolicy('YEARLY')).toBe('每年重置');
    expect(formatNumberingRuleScopeType('GLOBAL')).toBe('全局');
    expect(formatNumberingRuleScopeType('CASE')).toBe('按病例');
    expect(formatNumberingRuleScopeType('DEPARTMENT')).toBe('按科室');
    expect(formatNumberingRuleScopeType('LAB')).toBe('按实验室');
  });

  it('normalizes numbering rule code casing and surrounding spaces', () => {
    expect(formatNumberingRuleBizType(' body_part_code ')).toBe('部位编码');
    expect(formatNumberingRuleResetPolicy(' daily ')).toBe('每日重置');
    expect(formatNumberingRuleScopeType(' global ')).toBe('全局');
  });

  it('keeps unknown numbering rule codes unchanged', () => {
    expect(formatNumberingRuleBizType('CUSTOM_NO')).toBe('CUSTOM_NO');
    expect(formatNumberingRuleResetPolicy('WEEKLY')).toBe('WEEKLY');
    expect(formatNumberingRuleScopeType('TENANT')).toBe('TENANT');
  });

  it('formats empty numbering rule codes as placeholder', () => {
    expect(formatNumberingRuleBizType('')).toBe('-');
    expect(formatNumberingRuleResetPolicy(null)).toBe('-');
    expect(formatNumberingRuleScopeType(undefined)).toBe('-');
  });
});
