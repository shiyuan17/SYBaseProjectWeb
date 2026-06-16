import { expect, test } from 'playwright/test';

import { openRolePage } from '../helpers/session';
import { FixationTransportPage } from './fixation-transport';
import { createWorkflowRunData } from './helpers/test-data';
import { PathologyReceiptPage } from './pathology-receipt';
import { SubmissionRegistrationPage } from './submission-registration';
import { TrackingExceptionPage } from './tracking-exception';

test('happy path: create, register, fix, transport, receive and track specimens', async ({
  browser,
}) => {
  const runData = createWorkflowRunData();
  let transportOrderId: string | undefined;
  let transportOrderNo: string | undefined;

  console.log(`[e2e] applicationNo=${runData.applicationNo}`);
  console.log(`[e2e] barcodes=${runData.barcodes.join(',')}`);

  {
    const { context, page } = await openRolePage(
      browser,
      'creator',
      '/workflow/submission-registration',
    );

    try {
      const submissionPage = new SubmissionRegistrationPage(page);
      await submissionPage.goto();

      const application =
        await submissionPage.createApplicationAndOpenRegistration(runData);
      console.log(`[e2e] applicationId=${application.id}`);

      const registrationResult =
        await submissionPage.registerSpecimens(runData);
      expect(registrationResult.specimens).toHaveLength(2);
      console.log(
        `[e2e] labelPrintBatchNo=${registrationResult.labelPrintBatchNo}`,
      );
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
      console.log(`[e2e] transportOrderId=${transportOrderId}`);
      console.log(`[e2e] transportOrderNo=${transportOrderNo}`);
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
      const printResult = await workflowPage.printTransportOrder(
        transportOrderNo ?? '',
      );
      expect(printResult.status).toBe('PRINTED');

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
      const receiptResult = await receiptPage.receiveAll(
        transportOrderId ?? '',
      );
      expect(receiptResult.receiptStatus).toBe('RECEIVED');
      expect(receiptResult.unreceivedCount).toBe(0);
      expect(receiptResult.caseId).toBeTruthy();
      expect(receiptResult.pathologyNo).toBeFalsy();
      await expect(page.getByText(receiptResult.caseId)).toBeVisible();
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
      await trackingPage.assertHappyPath(trackingPayload, [
        ...runData.barcodes,
      ]);
      await trackingPage.openSpecimenTracking(runData.barcodes[0]);
    } finally {
      await context.close();
    }
  }
});
