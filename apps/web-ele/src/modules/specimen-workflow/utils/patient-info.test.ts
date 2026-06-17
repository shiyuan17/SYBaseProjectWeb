import { describe, expect, it } from 'vitest';

import { resolvePatientIdLabel } from './patient-info';

describe('patient-info', () => {
  it('prefers workbench idNo over application detail patientId for removal display', () => {
    expect(
      resolvePatientIdLabel(
        {
          patientId: '1d857986-392a-4620-bc10-bf2c900001a8',
        },
        {
          applicationDetail: {
            patientId: '1d857986-392a-4620-bc10-bf2c900001a8',
          } as any,
          patientId: '1d857986-392a-4620-bc10-bf2c900001a8',
          workbenchRecord: {
            patientInfo: {
              idNo: '08305',
            },
          } as any,
        },
      ),
    ).toBe('08305');
  });
});
