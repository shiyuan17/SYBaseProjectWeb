import { expect, test } from 'playwright/test';

import { openRolePage } from '../helpers/session';
import { FixationTransportPage } from './fixation-transport';
import { createWorkflowRunData } from './helpers/test-data';
import { PathologyReceiptPage } from './pathology-receipt';
import { SubmissionRegistrationPage } from './submission-registration';
import { TrackingExceptionPage } from './tracking-exception';

test('abnormal receipt: reject one specimen and expose abnormal tracking', async ({
  browser,
}) => {
  const runData = createWorkflowRunData();
  const rejectReason = 'broken-container-e2e';
  let transportOrderId: string | undefined;
  let transportOrderNo: string | undefined;

  console.log(`[e2e-abnormal] applicationNo=${runData.applicationNo}`);
  console.log(`[e2e-abnormal] rejectedBarcode=${runData.barcodes[1]}`);

  {
    const { context, page } = await openRolePage(
      browser,
      'creator',
      '/workflow/submission-registration',
    );

    try {
      const submissionPage = new SubmissionRegistrationPage(page);
      await submissionPage.goto();
      await submissionPage.createApplicationAndOpenRegistration(runData);
      await submissionPage.registerSpecimens(runData);
    } finally {
      await context.close();
    }
  }

  {
    const { context, page } = await openRolePage(
      browser,
      'fixation',
      '/workflow/fixation-verify',
    );

    try {
      const workflowPage = new FixationTransportPage(page);
      await workflowPage.gotoFixation();
      await workflowPage.startFixation(runData.barcodes[0]);
      await workflowPage.completeFixation(runData.barcodes[0]);
      await workflowPage.startFixation(runData.barcodes[1]);
      await workflowPage.completeFixation(runData.barcodes[1]);

      const transportOrder = await workflowPage.createTransportOrder([
        ...runData.barcodes,
      ]);
      transportOrderId = transportOrder.id;
      transportOrderNo = transportOrder.transportOrderNo;
      console.log(`[e2e-abnormal] transportOrderNo=${transportOrderNo}`);
    } finally {
      await context.close();
    }
  }

  {
    const { context, page } = await openRolePage(
      browser,
      'transport',
      '/workflow/transport-handover',
    );

    try {
      const workflowPage = new FixationTransportPage(page);
      await workflowPage.gotoTransport();
      await workflowPage.printTransportOrder(transportOrderNo ?? '');
      const handoverResult = await workflowPage.handoverTransportOrder(
        transportOrderNo ?? '',
      );
      expect(handoverResult.status).toBe('HANDED_OVER');
    } finally {
      await context.close();
    }
  }

  {
    const { context, page } = await openRolePage(
      browser,
      'receive',
      '/workflow/pathology-receipt',
    );

    try {
      const receiptPage = new PathologyReceiptPage(page);
      await receiptPage.goto();
      const receiptResult = await receiptPage.rejectOneSpecimen(
        transportOrderId ?? '',
        rejectReason,
      );
      expect(receiptResult.receiptStatus).toBe('PARTIALLY_RECEIVED');
      expect(receiptResult.unreceivedCount).toBe(1);
    } finally {
      await context.close();
    }
  }

  {
    const { context, page } = await openRolePage(
      browser,
      'tracking',
      '/workflow/tracking-exception',
    );

    try {
      const trackingPage = new TrackingExceptionPage(page);
      await trackingPage.goto();
      const trackingPayload = await trackingPage.openApplicationTracking(
        runData.applicationNo,
      );
      await trackingPage.assertAbnormalPath(
        trackingPayload,
        runData.barcodes[1],
        rejectReason,
      );
      await trackingPage.openSpecimenTracking(runData.barcodes[1]);
    } finally {
      await context.close();
    }
  }
});
