import { describe, expect, it } from 'vitest';

import { getDoctorWorkflowPageErrorMessage } from './error';

describe('doctor workflow error utils', () => {
  it('maps print-before-release business errors into Chinese guidance', () => {
    expect(
      getDoctorWorkflowPageErrorMessage({
        response: {
          data: {
            code: 'OPERATION_NOT_ALLOWED',
            message: 'Medical order must be printed before completed',
          },
          status: 409,
        },
      }),
    ).toBe('请先打印玻片后再出片。');
  });
});
