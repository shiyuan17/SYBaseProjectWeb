import { describe, expect, it } from 'vitest';

import {
  getWorkflowPageErrorMessage,
  mapWorkflowEnglishErrorMessage,
} from './error';

describe('getWorkflowPageErrorMessage', () => {
  it('prefers flat error payload messages', () => {
    expect(
      getWorkflowPageErrorMessage({
        error: '条码不存在',
      }),
    ).toBe('条码不存在');
  });

  it('maps unauthorized responses to login guidance', () => {
    expect(
      getWorkflowPageErrorMessage({
        response: {
          status: 401,
        },
      }),
    ).toBe('登录状态已失效，请重新登录后再继续操作。');
  });

  it('maps forbidden responses to permission guidance', () => {
    expect(
      getWorkflowPageErrorMessage({
        code: 'FORBIDDEN',
      }),
    ).toBe('当前账号没有访问该工作流页面或操作该功能的权限。');
  });

  it('falls back to error.message when present', () => {
    expect(getWorkflowPageErrorMessage(new Error('网络超时'))).toBe('网络超时');
  });

  it('maps duplicate removal confirmation to a chinese message', () => {
    expect(
      getWorkflowPageErrorMessage(
        new Error('Specimen already confirmed for removal'),
      ),
    ).toBe('该标本已完成离体确认，请勿重复操作。');
  });

  it('maps specimen not found messages to a chinese prompt', () => {
    expect(
      getWorkflowPageErrorMessage(new Error('Specimen specimenNo not found')),
    ).toBe('未找到对应标本，请确认标本ID是否正确。');
  });

  it('maps specimen workflow status conflicts to chinese prompts', () => {
    expect(
      getWorkflowPageErrorMessage(new Error('Specimen already checked in')),
    ).toBe('标本已完成入库，无需重复操作。');
    expect(
      getWorkflowPageErrorMessage(
        new Error('Specimen must complete verification before check-in'),
      ),
    ).toBe('标本尚未完成核对，不能入库。');
    expect(
      getWorkflowPageErrorMessage(
        new Error('Specimen must complete fixation before check-in'),
      ),
    ).toBe('标本尚未完成固定，不能入库。');
    expect(
      getWorkflowPageErrorMessage(
        new Error('Specimen must be confirmed before check-in'),
      ),
    ).toBe('标本尚未完成标本确认，不能入库。');
    expect(
      getWorkflowPageErrorMessage(
        new Error('Specimen already reached receipt terminal status'),
      ),
    ).toBe('标本已接收、拒收或退回，当前流程不可重复操作。');
  });

  it('maps application-wide check-in blocking errors to a chinese prompt', () => {
    expect(
      mapWorkflowEnglishErrorMessage(
        'All specimens of the application must complete verification, fixation, and confirmation before check-in',
      ),
    ).toBe('当前申请单下仍有标本未完成核对、固定或标本确认，不能入库。');
  });
});
