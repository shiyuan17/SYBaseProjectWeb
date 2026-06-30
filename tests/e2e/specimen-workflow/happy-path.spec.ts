import { expect, test } from 'playwright/test';

import { openRolePage } from '../helpers/session';
import { FixationTransportPage } from './fixation-transport';
import { createWorkflowRunData } from './helpers/test-data';
import { PathologyReceiptPage } from './pathology-receipt';
import { SubmissionRegistrationPage } from './submission-registration';
import { TrackingExceptionPage } from './tracking-exception';

const m2WorkflowOperatorRole = 'creator' as const;

test.setTimeout(420_000);

test('happy path: create, register, fix, transport, receive and track specimens', async ({
  browser,
}) => {
  const runData = createWorkflowRunData();
  let specimenIdentifiers: [string, string] | undefined;

  console.log(`[e2e] applicationNo=${runData.applicationNo}`);

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
      specimenIdentifiers = [
        registrationResult.specimens[0]?.barcode ??
          registrationResult.specimens[0]?.specimenNo ??
          '',
        registrationResult.specimens[1]?.barcode ??
          registrationResult.specimens[1]?.specimenNo ??
          '',
      ];
      expect(specimenIdentifiers[0]).toBeTruthy();
      expect(specimenIdentifiers[1]).toBeTruthy();
      console.log(
        `[e2e] labelPrintBatchNo=${registrationResult.labelPrintBatchNo}`,
      );
      console.log(`[e2e] identifiers=${specimenIdentifiers.join(',')}`);
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
      expect(transportOrder.id).toBeTruthy();
      expect(transportOrder.transportOrderNo).toBeTruthy();
      console.log(`[e2e] transportOrderId=${transportOrder.id}`);
      console.log(`[e2e] transportOrderNo=${transportOrder.transportOrderNo}`);
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
      const receiptResult = await receiptPage.receiveAll(
        specimenIdentifiers?.[0] ?? '',
      );
      expect(receiptResult.receiptStatus).toBe('RECEIVED');
      expect(receiptResult.unreceivedCount).toBe(0);
      expect(receiptResult.caseId).toBeTruthy();
      expect(receiptResult.pathologyNo).toBeFalsy();
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
      await trackingPage.assertHappyPath(trackingPayload, [
        ...(specimenIdentifiers ?? []),
      ]);
      await trackingPage.openSpecimenTracking(specimenIdentifiers?.[0] ?? '');
    } finally {
      await context.close();
    }
  }
});
