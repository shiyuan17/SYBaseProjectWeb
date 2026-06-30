import { expect, test } from 'playwright/test';

import { openRolePage } from '../helpers/session';
import { FixationTransportPage } from './fixation-transport';
import { createWorkflowRunData } from './helpers/test-data';
import { PathologyReceiptPage } from './pathology-receipt';
import { SubmissionRegistrationPage } from './submission-registration';
import { TrackingExceptionPage } from './tracking-exception';

const m2WorkflowOperatorRole = 'creator' as const;

test.setTimeout(420_000);

test('abnormal receipt: reject one specimen and expose abnormal tracking', async ({
  browser,
}) => {
  const runData = createWorkflowRunData();
  const rejectReason = 'broken-container-e2e';
  let specimenIdentifiers: [string, string] | undefined;
  let rejectedIdentifier: string | undefined;

  console.log(`[e2e-abnormal] applicationNo=${runData.applicationNo}`);

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
      const registrationResult =
        await submissionPage.registerSpecimens(runData);
      specimenIdentifiers = [
        registrationResult.specimens[0]?.barcode ??
          registrationResult.specimens[0]?.specimenNo ??
          '',
        registrationResult.specimens[1]?.barcode ??
          registrationResult.specimens[1]?.specimenNo ??
          '',
      ];
      rejectedIdentifier = specimenIdentifiers[1] ?? '';
      console.log(`[e2e-abnormal] rejectedIdentifier=${rejectedIdentifier}`);
    } finally {
      await context.close();
    }
  }

  {
    const { context, page } = await openRolePage(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/fixation-verify',
    );

    try {
      const workflowPage = new FixationTransportPage(page);
      await workflowPage.gotoVerification();
      await workflowPage.confirmRemoval(specimenIdentifiers?.[0] ?? '');
      await workflowPage.confirmRemoval(specimenIdentifiers?.[1] ?? '');
      await workflowPage.gotoFixation();
      await workflowPage.startFixation(specimenIdentifiers?.[0] ?? '');
      await workflowPage.completeFixation(specimenIdentifiers?.[0] ?? '');
      await workflowPage.startFixation(specimenIdentifiers?.[1] ?? '');
      await workflowPage.completeFixation(specimenIdentifiers?.[1] ?? '');
      await workflowPage.gotoConfirmation();
      await workflowPage.confirmSpecimens(specimenIdentifiers?.[0] ?? '');
      await workflowPage.confirmSpecimens(specimenIdentifiers?.[1] ?? '');
      await workflowPage.gotoCheckIn();
      await workflowPage.checkInSpecimens(specimenIdentifiers?.[0] ?? '');
      await workflowPage.checkInSpecimens(specimenIdentifiers?.[1] ?? '');
      await workflowPage.gotoTransport();
      const transportOrder = await workflowPage.createTransportOrder([
        ...(specimenIdentifiers ?? []),
      ]);
      expect(transportOrder.transportOrderNo).toBeTruthy();
      console.log(
        `[e2e-abnormal] transportOrderNo=${transportOrder.transportOrderNo}`,
      );
    } finally {
      await context.close();
    }
  }

  {
    const { context, page } = await openRolePage(
      browser,
      m2WorkflowOperatorRole,
      '/workflow/pathology-receipt',
    );

    try {
      const receiptPage = new PathologyReceiptPage(page);
      await receiptPage.goto();
      const receivedResult = await receiptPage.receiveOneSpecimen(
        specimenIdentifiers?.[0] ?? '',
      );
      expect(receivedResult.receiptStatus).toBe('PARTIALLY_RECEIVED');
      expect(receivedResult.unreceivedCount).toBe(1);

      const receiptResult = await receiptPage.rejectOneSpecimen(
        rejectedIdentifier ?? '',
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
      m2WorkflowOperatorRole,
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
        rejectedIdentifier ?? '',
        rejectReason,
      );
      await trackingPage.openSpecimenTracking(rejectedIdentifier ?? '');
    } finally {
      await context.close();
    }
  }
});
