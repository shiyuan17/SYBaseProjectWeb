import { describe, expect, it } from 'vitest';

import {
  completeFrozenGrossing,
  completeFrozenParaffinCompare,
  completeFrozenPhoneBack,
  completeFrozenReceive,
  completeFrozenRemainingTissue,
  completeFrozenSlicing,
  confirmFrozenReport,
  getFrozenSessionDetail,
  getFrozenTechnicalWorkbench,
  listFrozenReminders,
  listFrozenSessions,
  resetFrozenMockState,
  saveFrozenPreliminaryReport,
} from './frozen-workflow-service';

describe('frozen workflow service mock', () => {
  it('advances a frozen session from receive to slicing', async () => {
    resetFrozenMockState();

    await completeFrozenReceive('FS-001', {
      operatorName: '接收技师甲',
    });
    let detail = await getFrozenSessionDetail('FS-001');
    expect(detail.currentTaskType).toBe('GROSSING');
    expect(detail.receivedAt).toBeTruthy();

    await completeFrozenGrossing('FS-001', {
      operatorName: '取材技师甲',
    });
    detail = await getFrozenSessionDetail('FS-001');
    expect(detail.currentTaskType).toBe('SLICING');
    expect(detail.grossingCompletedAt).toBeTruthy();

    await completeFrozenSlicing('FS-001', {
      operatorName: '切片技师甲',
    });
    detail = await getFrozenSessionDetail('FS-001');
    expect(detail.currentTaskType).toBe('REPORT');
    expect(detail.slicingCompletedAt).toBeTruthy();
  });

  it('advances a frozen session from report to close', async () => {
    resetFrozenMockState();

    await completeFrozenReceive('FS-001', {
      operatorName: '接收技师甲',
    });
    await completeFrozenGrossing('FS-001', {
      operatorName: '取材技师甲',
    });
    await completeFrozenSlicing('FS-001', {
      operatorName: '切片技师甲',
    });

    await saveFrozenPreliminaryReport('FS-001', {
      operatorName: '报告医生甲',
      preliminaryResult: '考虑良性病变',
    });
    let detail = await getFrozenSessionDetail('FS-001');
    expect(detail.sessionStatus).toBe('DIAGNOSING');
    expect(detail.preliminaryResult).toBe('考虑良性病变');

    await completeFrozenPhoneBack('FS-001', {
      operatorName: '报告医生甲',
      preliminaryResult: '考虑良性病变',
    });
    detail = await getFrozenSessionDetail('FS-001');
    expect(detail.currentTaskType).toBe('COMPARE');
    expect(detail.intraoperativePhoneBack).toBe(true);

    await confirmFrozenReport('FS-001', {
      operatorName: '报告医生甲',
    });
    detail = await getFrozenSessionDetail('FS-001');
    expect(detail.finalConfirmedAt).toBeTruthy();

    await completeFrozenParaffinCompare('FS-001', {
      compareStatus: 'SIGNED_OFF',
      compareSummary: '冰石一致',
      operatorName: '复核医生乙',
    });
    detail = await getFrozenSessionDetail('FS-001');
    expect(detail.currentTaskType).toBe('REMAINING_TISSUE');
    expect(detail.compareStatus).toBe('SIGNED_OFF');

    await completeFrozenRemainingTissue('FS-001', {
      operatorName: '值班技师丙',
      remainingTissueStatus: 'DISPOSED',
    });
    detail = await getFrozenSessionDetail('FS-001');
    expect(detail.sessionStatus).toBe('CLOSED');
    expect(detail.remainingTissueStatus).toBe('DISPOSED');
  });

  it('filters frozen sessions and exposes reminder summary for smoke entry', async () => {
    resetFrozenMockState();

    const requestedPage = await listFrozenSessions({
      keyword: 'FS-20260527-01',
      page: 1,
      sessionStatus: 'REQUESTED',
      size: 10,
    });
    expect(requestedPage.items).toHaveLength(1);
    expect(requestedPage.items[0]?.sessionNo).toBe('FS-20260527-01');

    const reminders = await listFrozenReminders();
    expect(reminders.total).toBe(reminders.items.length);
    expect(reminders.redCount + reminders.orangeCount).toBeGreaterThanOrEqual(
      0,
    );

    const workbench = await getFrozenTechnicalWorkbench();
    expect(workbench.reminders.total).toBe(reminders.total);
    expect(workbench.sessions.length).toBeGreaterThan(0);
  });
});
