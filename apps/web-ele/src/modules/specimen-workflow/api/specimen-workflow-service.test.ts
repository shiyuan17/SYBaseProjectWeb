import { beforeEach, describe, expect, it } from 'vitest';

import {
  bindSpecimenBarcode,
  checkInSpecimen,
  completeFixation,
  completeSpecimenVerification,
  confirmSpecimen,
  createTransportOrder,
  getApplicationDetail,
  getApplicationTrackingByApplicationNo,
  getLatestRegistrationResult,
  getSpecimenTrackingByBarcode,
  handoverTransportOrder,
  listApplications,
  listPendingFixations,
  listPendingReceipts,
  listPendingTransportOrders,
  listSpecimenVerificationRecords,
  lookupApplicationForRegistration,
  printTransportOrder,
  receiveSpecimens,
  registerSpecimens,
  reprintApplicationForm,
  resetMockState,
  retryLabelPrint,
  rebindSpecimenBarcode,
  startFixation,
  startSpecimenVerification,
} from './specimen-workflow-service';

describe('specimen-workflow-service mock flow', () => {
  beforeEach(() => {
    resetMockState();
  });

  it('loads seeded application list and abnormal detail context', async () => {
    const page = await listApplications({
      page: 1,
      size: 20,
    });

    expect(page.total).toBeGreaterThanOrEqual(8);
    expect(page.items[0]?.applicationNo).toBeTruthy();

    const detail = await getApplicationDetail('APP-007');
    expect(detail.specimens).toHaveLength(2);
    expect(detail.receiptAbnormalSummary).toContain('退回');
    expect(detail.unreceivedCount).toBe(2);
  });

  it('runs the full mock flow: register -> verify -> fix -> confirm -> check-in -> transport', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      collectionScene: '病房',
      items: [
        {
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃窦黏膜',
        },
      ],
      operatorName: '登记员甲',
      operatorUserId: 'USR-REG-01',
      printerCode: 'PRN-NEW',
      remarks: '补登记',
      terminalCode: 'TERM-NEW',
    });

    const barcode = registerResult.specimens[0]?.barcode ?? '';
    expect(barcode).toBeTruthy();
    expect(registerResult.specimens[0]?.verificationStatus).toBe('UNVERIFIED');

    await startSpecimenVerification({
      operatorName: '核对员甲',
      operatorUserId: 'USR-VRF-01',
      specimenBarcode: barcode,
      terminalCode: 'TERM-VRF-01',
    });

    await completeSpecimenVerification({
      operatorName: '核对员甲',
      operatorUserId: 'USR-VRF-01',
      specimenBarcode: barcode,
      terminalCode: 'TERM-VRF-01',
    });

    await startFixation({
      operatorName: '固定员甲',
      operatorUserId: 'USR-FIX-01',
      specimenBarcode: barcode,
      terminalCode: 'TERM-FIX-01',
    });

    await completeFixation({
      operatorName: '固定员甲',
      operatorUserId: 'USR-FIX-01',
      specimenBarcode: barcode,
      terminalCode: 'TERM-FIX-01',
    });

    await confirmSpecimen(barcode, {
      operatorName: '确认员甲',
      operatorUserId: 'USR-CFM-01',
      remarks: '转运前确认',
      terminalCode: 'TERM-CFM-01',
    });

    await checkInSpecimen(barcode, {
      operatorName: '入库员甲',
      operatorUserId: 'USR-CI-01',
      remarks: '入库完成',
      specimenBarcode: barcode,
      terminalCode: 'TERM-CI-01',
    });

    const detail = await getApplicationDetail('APP-001');
    expect(detail.currentNode).toBe('CHECK_IN');
    expect(detail.specimens[0]?.verificationStatus).toBe('VERIFIED');
    expect(detail.specimens[0]?.fixationStatus).toBe('COMPLETED');
    expect(detail.specimens[0]?.specimenConfirmedAt).toBeTruthy();
    expect(detail.specimens[0]?.checkInStatus).toBe('CHECKED_IN');

    const order = await createTransportOrder({
      applicationId: 'APP-001',
      handoverDepartmentId: 'DEP-WK',
      handoverDepartmentName: '外科',
      handoverUserId: 'DOC-001',
      handoverUserName: '李医生',
      receiverDepartmentId: 'DEP-PA',
      receiverDepartmentName: '病理科',
      specimenBarcodes: [barcode],
      terminalCode: 'TERM-TR-NEW',
    });
    expect(order.status).toBe('PENDING');

    const printedOrder = await printTransportOrder(order.id, {
      operatorName: '李医生',
      operatorUserId: 'DOC-001',
      terminalCode: 'TERM-TR-NEW',
    });
    expect(printedOrder.status).toBe('PRINTED');

    const handedOrder = await handoverTransportOrder(order.id, {
      receiverUserId: 'USR-PA-01',
      receiverUserName: '接收员甲',
      terminalCode: 'TERM-TR-NEW',
    });
    expect(handedOrder.status).toBe('HANDED_OVER');
  });

  it('enforces the new sequence gates before fixation, check-in, and transport creation', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃体黏膜',
        },
      ],
      operatorName: '登记员乙',
    });
    const barcode = registerResult.specimens[0]?.barcode ?? '';

    await expect(
      startFixation({
        operatorName: '固定员甲',
        specimenBarcode: barcode,
      }),
    ).rejects.toThrow('尚未完成核对');

    await startSpecimenVerification({
      operatorName: '核对员甲',
      specimenBarcode: barcode,
    });
    await completeSpecimenVerification({
      operatorName: '核对员甲',
      specimenBarcode: barcode,
    });
    await startFixation({
      operatorName: '固定员甲',
      specimenBarcode: barcode,
    });
    await completeFixation({
      operatorName: '固定员甲',
      specimenBarcode: barcode,
    });

    await expect(
      checkInSpecimen(barcode, {
        operatorName: '入库员甲',
        specimenBarcode: barcode,
      }),
    ).rejects.toThrow('需在确认后才能入库');

    await confirmSpecimen(barcode, {
      operatorName: '确认员甲',
      terminalCode: 'TERM-CFM-02',
    });

    await expect(
      createTransportOrder({
        applicationId: 'APP-001',
        handoverDepartmentName: '外科',
        handoverUserName: '李医生',
        receiverDepartmentName: '病理科',
        specimenBarcodes: [barcode],
      }),
    ).rejects.toThrow('尚未完成标本入库');
  });

  it('supports barcode bind/rebind and verification record query', async () => {
    const rebound = await rebindSpecimenBarcode('BC-004-01-R', {
      operatorName: '护士甲',
      operatorUserId: 'USR-004',
      remarks: '再次修正条码',
      targetBarcode: 'BC-004-01-R2',
      terminalCode: 'TERM-REG-03',
    });

    expect(rebound.barcode).toBe('BC-004-01-R2');
    expect(rebound.barcodeBindingStatus).toBe('BOUND');

    const tracking = await getSpecimenTrackingByBarcode('BC-004-01-R2');
    expect(tracking.specimens.some((item) => item.barcode === 'BC-004-01-R2')).toBe(true);

    const records = await listSpecimenVerificationRecords('BC-004-01-R2');
    expect(records[0]?.verificationType).toBe('BARCODE_REBIND');

    const reboundAgain = await bindSpecimenBarcode('SPEC-004-1', {
      operatorName: '护士乙',
      operatorUserId: 'USR-005',
      remarks: '补充绑定记录',
      targetBarcode: 'BC-004-01-R3',
      terminalCode: 'TERM-REG-04',
    });
    expect(reboundAgain.barcode).toBe('BC-004-01-R3');
  });

  it('returns pending receipt batches and updates abnormal summary after receive', async () => {
    const pendingReceipts = await listPendingReceipts({
      page: 1,
      size: 20,
    });
    expect(pendingReceipts.items.some((item) => item.transportOrderId === 'TO-006')).toBe(true);
    expect(pendingReceipts.items.some((item) => item.batchAbnormalFlag)).toBe(true);

    const receiptResult = await receiveSpecimens({
      items: [
        {
          containerCount: 2,
          qualityCheckResult: 'PASSED',
          receiptStatus: 'RECEIVED',
          specimenBarcode: 'BC-006-01',
        },
      ],
      receivedByName: '接收员甲',
      receivedByUserId: 'USR-PA-01',
      terminalCode: 'TERM-REC-01',
      transportOrderId: 'TO-006',
    });

    expect(receiptResult.receiptStatus).toBe('RECEIVED');
    expect(receiptResult.unreceivedCount).toBe(0);

    const tracking = await getApplicationTrackingByApplicationNo('M2-20260526-006');
    expect(tracking.status).toBe('RECEIVED');
    expect(tracking.specimens[0]?.receiptStatus).toBe('RECEIVED');
  });

  it('blocks binding, confirmation, check-in, and transport creation after receipt terminal statuses', async () => {
    await expect(
      rebindSpecimenBarcode('BC-007-01', {
        operatorName: '护士甲',
        operatorUserId: 'USR-007',
        remarks: '异常后尝试重绑',
        targetBarcode: 'BC-007-01-R',
        terminalCode: 'TERM-007',
      }),
    ).rejects.toThrow('已进入接收结果');

    await expect(
      confirmSpecimen('BC-008-01', {
        operatorName: '确认员甲',
        operatorUserId: 'USR-CFM-02',
        remarks: '异常后尝试确认',
        terminalCode: 'TERM-CFM-02',
      }),
    ).rejects.toThrow('已进入接收结果');

    await expect(
      checkInSpecimen('BC-008-01', {
        operatorName: '入库员甲',
        operatorUserId: 'USR-CI-02',
        specimenBarcode: 'BC-008-01',
        terminalCode: 'TERM-CI-02',
      }),
    ).rejects.toThrow('已进入接收结果');

    await expect(
      createTransportOrder({
        applicationId: 'APP-007',
        handoverDepartmentId: 'DEP-WK',
        handoverDepartmentName: '外科',
        handoverUserId: 'DOC-007',
        handoverUserName: '赵医生',
        receiverDepartmentId: 'DEP-PA',
        receiverDepartmentName: '病理科',
        specimenBarcodes: ['BC-007-01'],
        terminalCode: 'TERM-TR-007',
      }),
    ).rejects.toThrow('已进入接收结果');
  });

  it('keeps lookup, latest result retry, and reprint actions runnable in mock mode', async () => {
    const application = await lookupApplicationForRegistration('M2-20260526-007');
    expect(application.id).toBe('APP-007');

    const latest = await getLatestRegistrationResult('APP-007');
    expect(latest.labelPrintSuccess).toBe(false);

    const retryResult = await retryLabelPrint(latest.labelPrintBatchNo ?? '', {
      operatorName: '打印员甲',
      operatorUserId: 'USR-PRN-01',
      printerCode: 'PRN-007',
      terminalCode: 'TERM-PRN-01',
    });
    expect(retryResult.allSuccessful).toBe(true);

    const reprintEvent = await reprintApplicationForm('APP-006', {
      operatorName: '接收员甲',
      operatorUserId: 'USR-PA-01',
      remarks: '病理接收页补打',
      terminalCode: 'TERM-REC-01',
    });
    expect(reprintEvent.eventContent).toBe('补打印申请单');

    const transportOrders = await listPendingTransportOrders({
      page: 1,
      size: 20,
    });
    expect(transportOrders.items.some((item) => item.transportOrderNo === 'TR-20260526-007')).toBe(true);
  });

  it('keeps verification and fixation lists queryable with the new fields', async () => {
    const list = await listPendingFixations({
      page: 1,
      size: 20,
      verificationStatus: 'VERIFIED',
    });

    expect(list.items.every((item) => item.verificationStatus === 'VERIFIED')).toBe(true);
  });
});
