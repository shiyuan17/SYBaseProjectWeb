import { beforeEach, describe, expect, it } from 'vitest';

import { getMockState } from './specimen-workflow-mock-core';
import {
  bindSpecimenBarcode,
  checkInSpecimen,
  completeFixation,
  completeSpecimenVerification,
  confirmSpecimen,
  confirmSpecimenRemovalByIdentifier,
  createApplication,
  createTransportOrder,
  deleteApplication,
  getApplicationDetail,
  getApplicationTrackingByApplicationNo,
  getLatestRegistrationResult,
  getSpecimenTrackingByBarcode,
  handoverTransportOrder,
  listApplications,
  listPendingFixations,
  listPendingReceipts,
  listPendingSpecimenRemovals,
  listPendingTransportOrders,
  listSpecimenOutbounds,
  listSpecimens,
  listSpecimenVerificationRecords,
  lookupApplicationForRegistration,
  lookupApplicationPatientByIdentifier,
  mapPendingSpecimenPageResponse,
  mapSpecimenRemovalPageResponse,
  outboundTransportOrder,
  printTransportOrder,
  quickOutboundSpecimen,
  rebindSpecimenBarcode,
  receiveSpecimens,
  registerSpecimens,
  reprintApplicationForm,
  resetMockState,
  retryLabelPrint,
  startFixation,
  startSpecimenVerification,
  unbindSpecimenBarcode,
  updateApplication,
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

  it('filters the mock application list by pathology number', async () => {
    const firstApplication = getMockState().applications[0];
    firstApplication.pathologyNo = 'BL202606030001';

    const page = await listApplications({
      page: 1,
      pathologyNo: 'BL202606030001',
      size: 20,
    });

    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe(firstApplication.id);
    expect(page.items[0]?.pathologyNo).toBe('BL202606030001');
  });

  it('looks up patient info by identifier in mock mode', async () => {
    const patient = await lookupApplicationPatientByIdentifier('P-001');

    expect(patient).toEqual({
      patientAge: expect.any(String),
      patientGender: expect.any(String),
      patientId: 'P-001',
      patientIdentifier: 'P-001',
      patientName: expect.any(String),
    });
  });

  it('updates and logically deletes applications before downstream starts', async () => {
    const created = await createApplication({
      applicationDate: '2026-05-28',
      applicationType: 'ROUTINE',
      clinicalDiagnosis: '胃镜活检',
      patientName: '待编辑患者',
      sourceHospitalName: '协作医院',
      specimenRemovalTime: '2026-05-28T09:00:00',
      specimenSite: '胃窦',
      submissionDate: '2026-05-28',
      submittingDepartmentId: 'DEP-TEST',
      submittingDepartmentName: '消化科',
      submittingDoctorName: '测试医生',
      submittingDoctorUserId: 'DOC-TEST',
    });

    await updateApplication(created.id, {
      applicationDate: '2026-05-28',
      applicationNo: 'M2-EDIT-001',
      applicationType: 'FROZEN',
      clinicalDiagnosis: '术中冰冻',
      patientName: '已编辑患者',
      sourceHospitalName: '协作医院',
      specimenRemovalTime: '2026-05-28T09:30:00',
      specimenSite: '甲状腺左叶',
      submissionDate: '2026-05-28',
      submittingDepartmentId: 'DEP-TEST',
      submittingDepartmentName: '普外科',
      submittingDoctorName: '编辑医生',
      submittingDoctorUserId: 'DOC-EDIT',
    });

    const updated = await getApplicationDetail(created.id);
    expect(updated.applicationNo).toBe('M2-EDIT-001');
    expect(updated.patientName).toBe('已编辑患者');
    expect(updated.editable).toBe(true);
    expect(updated.deletable).toBe(true);

    await deleteApplication(created.id);
    const defaultPage = await listApplications({ page: 1, size: 200 });
    expect(defaultPage.items.some((item) => item.id === created.id)).toBe(
      false,
    );

    const voidedPage = await listApplications({
      applicationFormStatus: 'VOIDED',
      page: 1,
      size: 200,
    });
    const voided = voidedPage.items.find((item) => item.id === created.id);
    expect(voided?.voided).toBe(true);
    expect(voided?.editable).toBe(false);
    expect(voided?.currentNode).toBe('VOIDED');
  });

  it('blocks logical delete after downstream workflow starts', async () => {
    await expect(deleteApplication('APP-007')).rejects.toThrow('下游流程');
  });

  it('runs the full mock flow: register -> verify -> fix -> confirm -> check-in -> transport', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      collectionScene: '病房',
      items: [
        {
          barcode: 'BC-MOCK-FLOW-001',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃窦黏膜',
        },
      ],
      printerCode: 'PRN-NEW',
      remarks: '补登记',
      terminalCode: 'TERM-NEW',
    });

    const barcode = registerResult.specimens[0]?.barcode ?? '';
    expect(barcode).toBeTruthy();
    expect(registerResult.specimens[0]?.verificationStatus).toBe('UNVERIFIED');

    await startSpecimenVerification({
      specimenBarcode: barcode,
      terminalCode: 'TERM-VRF-01',
    });

    await completeSpecimenVerification({
      specimenBarcode: barcode,
      terminalCode: 'TERM-VRF-01',
    });

    await startFixation({
      specimenBarcode: barcode,
      terminalCode: 'TERM-FIX-01',
    });

    await completeFixation({
      specimenBarcode: barcode,
      terminalCode: 'TERM-FIX-01',
    });

    await confirmSpecimen(barcode, {
      operatorName: '确认员甲',
      operatorUserId: 'USER-CFM-01',
      remarks: '转运前确认',
      terminalCode: 'TERM-CFM-01',
    });

    await checkInSpecimen(barcode, {
      operatorName: '入库员甲',
      operatorUserId: 'USER-CI-01',
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

    const confirmedList = await listSpecimens({
      keyword: barcode,
      page: 1,
      size: 20,
    });
    expect(confirmedList.items[0]?.specimenConfirmedByName).toBe('确认员甲');
    expect(confirmedList.items[0]?.checkedInByName).toBe('入库员甲');

    const specimenId = confirmedList.items[0]?.specimenId ?? '';
    expect(specimenId).toBeTruthy();
    const specimenIdList = await listSpecimens({
      keyword: specimenId,
      page: 1,
      size: 20,
    });
    expect(specimenIdList.items[0]?.specimenId).toBe(specimenId);

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
      terminalCode: 'TERM-TR-NEW',
    });
    expect(printedOrder.status).toBe('PRINTED');

    const handedOrder = await handoverTransportOrder(order.id, {
      receiverUserId: 'USR-PA-01',
      receiverUserName: '接收员甲',
      terminalCode: 'TERM-TR-NEW',
    });
    expect(handedOrder.status).toBe('HANDED_OVER');
    expect(handedOrder.outboundUserName).toBe('当前登录用户');
  });

  it('keeps mock registrations unbound until barcode binding', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃窦黏膜',
        },
      ],
    });

    const specimen = registerResult.specimens[0];
    expect(registerResult.labelPrintSuccess).toBe(false);
    expect(specimen?.barcode).toBeNull();
    expect(specimen?.barcodeBindingStatus).toBe('UNBOUND');
    expect(specimen?.labelPrintStatus).toBe('PENDING');

    const specimenId = specimen?.id ?? '';
    const bound = await bindSpecimenBarcode(specimenId, {
      targetBarcode: 'BC-MOCK-BIND-001',
    });
    expect(bound.barcode).toBe('BC-MOCK-BIND-001');
    expect(bound.barcodeBindingStatus).toBe('BOUND');

    const list = await listSpecimens({
      keyword: 'BC-MOCK-BIND-001',
      page: 1,
      size: 20,
    });
    expect(list.items[0]).toMatchObject({
      barcode: 'BC-MOCK-BIND-001',
      barcodeBindingStatus: 'BOUND',
    });
  });

  it('supports direct outbound by selected outbound operator in mock mode', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          barcode: 'BC-MOCK-OUTBOUND-001',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃窦黏膜',
        },
      ],
    });
    const specimen = registerResult.specimens[0];
    const barcode = specimen?.barcode ?? '';
    const specimenNo = specimen?.specimenNo ?? '';

    await startSpecimenVerification({ specimenBarcode: barcode });
    await completeSpecimenVerification({ specimenBarcode: barcode });
    await completeFixation({ specimenBarcode: barcode });
    await confirmSpecimen(barcode, {
      operatorName: '确认员乙',
      operatorUserId: 'USER-CFM-02',
    });
    await checkInSpecimen(barcode, {
      operatorName: '入库员乙',
      operatorUserId: 'USER-CI-02',
      specimenBarcode: barcode,
    });

    const order = await createTransportOrder({
      applicationId: 'APP-001',
      handoverDepartmentName: '外科',
      handoverUserName: '李医生',
      receiverDepartmentName: '病理科',
      specimenBarcodes: [barcode],
    });
    await printTransportOrder(order.id, {});

    const outbound = await outboundTransportOrder(order.id, {
      outboundUserId: 'USER-OUT-01',
      outboundUserName: '出库员甲',
      remarks: '扫码直接出库',
      terminalCode: 'TERM-OUT-01',
    });

    expect(outbound.status).toBe('HANDED_OVER');
    expect(outbound.outboundUserName).toBe('出库员甲');
    expect(outbound.handedOverAt).toBeTruthy();

    const transportOrders = await listPendingTransportOrders({
      page: 1,
      size: 20,
      specimenNo,
    });
    expect(transportOrders.items[0]?.outboundUserName).toBe('出库员甲');
  });

  it('auto-creates a transport order and outbounds immediately when specimen is checked in but has no order', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          barcode: 'BC-MOCK-QUICK-OUT-001',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃窦黏膜',
        },
      ],
    });
    const specimen = registerResult.specimens[0];
    const barcode = specimen?.barcode ?? '';
    const specimenNo = specimen?.specimenNo ?? '';

    await startSpecimenVerification({ specimenBarcode: barcode });
    await completeSpecimenVerification({ specimenBarcode: barcode });
    await completeFixation({ specimenBarcode: barcode });
    await confirmSpecimen(barcode, {
      operatorName: '确认员丙',
      operatorUserId: 'USER-CFM-03',
    });
    await checkInSpecimen(barcode, {
      operatorName: '入库员丙',
      operatorUserId: 'USER-CI-03',
      specimenBarcode: barcode,
    });

    const outbound = await quickOutboundSpecimen({
      identifier: specimenNo,
      identifierType: 'SPECIMEN_NO',
      outboundUserId: 'USER-OUT-02',
      outboundUserName: '出库员乙',
      remarks: '自动补建并出库',
      terminalCode: 'TERM-OUT-QUICK-01',
    });

    expect(outbound.status).toBe('HANDED_OVER');
    expect(outbound.outboundUserName).toBe('出库员乙');
    expect(outbound.handedOverAt).toBeTruthy();

    const outbounds = await listSpecimenOutbounds({
      page: 1,
      size: 20,
      specimenNo,
    });
    expect(outbounds.items).toHaveLength(1);
    expect(outbounds.items[0]?.transportOrderId).toBe(outbound.id);
    expect(outbounds.items[0]?.outboundUserName).toBe('出库员乙');
    expect(outbounds.items[0]?.outboundAt).toBeTruthy();
  });

  it('enforces the new sequence gates before fixation, check-in, and transport creation', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          barcode: 'BC-MOCK-GATE-001',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃体黏膜',
        },
      ],
    });
    const barcode = registerResult.specimens[0]?.barcode ?? '';

    await expect(
      startFixation({
        specimenBarcode: barcode,
      }),
    ).rejects.toThrow('尚未完成核对');

    await startSpecimenVerification({
      specimenBarcode: barcode,
    });
    await completeSpecimenVerification({
      specimenBarcode: barcode,
    });
    await startFixation({
      specimenBarcode: barcode,
    });
    await completeFixation({
      specimenBarcode: barcode,
    });

    await expect(
      checkInSpecimen(barcode, {
        specimenBarcode: barcode,
      }),
    ).rejects.toThrow('需在确认后才能入库');

    await confirmSpecimen(barcode, {
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
      remarks: '再次修正条码',
      targetBarcode: 'BC-004-01-R2',
      terminalCode: 'TERM-REG-03',
    });

    expect(rebound.barcode).toBe('BC-004-01-R2');
    expect(rebound.barcodeBindingStatus).toBe('BOUND');

    const tracking = await getSpecimenTrackingByBarcode('BC-004-01-R2');
    expect(
      tracking.specimens.some((item) => item.barcode === 'BC-004-01-R2'),
    ).toBe(true);

    const records = await listSpecimenVerificationRecords('BC-004-01-R2');
    expect(records[0]?.verificationType).toBe('BARCODE_REBIND');

    const reboundAgain = await bindSpecimenBarcode('SPEC-004-1', {
      remarks: '补充绑定记录',
      targetBarcode: 'BC-004-01-R3',
      terminalCode: 'TERM-REG-04',
    });
    expect(reboundAgain.barcode).toBe('BC-004-01-R3');

    const unbound = await unbindSpecimenBarcode('SPEC-004-1', {
      remarks: '恢复未绑定',
      terminalCode: 'TERM-REG-05',
    });
    expect(unbound.barcodeBindingStatus).toBe('UNBOUND');
  });

  it('returns pending receipt batches and updates abnormal summary after receive', async () => {
    const pendingReceipts = await listPendingReceipts({
      page: 1,
      size: 20,
    });
    expect(
      pendingReceipts.items.some((item) => item.transportOrderId === 'TO-006'),
    ).toBe(true);
    expect(pendingReceipts.items.some((item) => item.batchAbnormalFlag)).toBe(
      true,
    );

    const receiptResult = await receiveSpecimens({
      items: [
        {
          containerCount: 2,
          qualityCheckResult: 'PASSED',
          receiptStatus: 'RECEIVED',
          specimenBarcode: 'BC-006-01',
        },
      ],
      logisticsStaffName: '物流员甲',
      receivedByName: '接收员甲',
      receivedByUserId: 'USR-PA-01',
      terminalCode: 'TERM-REC-01',
      transportOrderId: 'TO-006',
    });

    expect(receiptResult.receiptStatus).toBe('RECEIVED');
    expect(receiptResult.unreceivedCount).toBe(0);

    const tracking =
      await getApplicationTrackingByApplicationNo('M2-20260526-006');
    expect(tracking.status).toBe('RECEIVED');
    expect(tracking.specimens[0]?.receiptStatus).toBe('RECEIVED');
  });

  it('blocks binding, confirmation, check-in, and transport creation after receipt terminal statuses', async () => {
    await expect(
      rebindSpecimenBarcode('BC-007-01', {
        remarks: '异常后尝试重绑',
        targetBarcode: 'BC-007-01-R',
        terminalCode: 'TERM-007',
      }),
    ).rejects.toThrow('已进入接收结果');

    await expect(
      confirmSpecimen('BC-008-01', {
        remarks: '异常后尝试确认',
        terminalCode: 'TERM-CFM-02',
      }),
    ).rejects.toThrow('已进入接收结果');

    await expect(
      checkInSpecimen('BC-008-01', {
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
    const application =
      await lookupApplicationForRegistration('M2-20260526-007');
    expect(application.id).toBe('APP-007');

    const latest = await getLatestRegistrationResult('APP-007');
    expect(latest.labelPrintSuccess).toBe(false);

    const retryResult = await retryLabelPrint(latest.labelPrintBatchNo ?? '', {
      printerCode: 'PRN-007',
      terminalCode: 'TERM-PRN-01',
    });
    expect(retryResult.allSuccessful).toBe(true);

    const reprintEvent = await reprintApplicationForm('APP-006', {
      remarks: '标本接收页补打',
      terminalCode: 'TERM-REC-01',
    });
    expect(reprintEvent.eventContent).toBe('补打印申请单');

    const transportOrders = await listPendingTransportOrders({
      page: 1,
      size: 20,
    });
    expect(
      transportOrders.items.some(
        (item) => item.transportOrderNo === 'TR-20260526-007',
      ),
    ).toBe(true);
  });

  it('keeps verification, fixation, and transport lists queryable with specimenNo', async () => {
    const fixationList = await listPendingFixations({
      page: 1,
      size: 20,
      specimenNo: 'SP-002-01',
      verificationStatus: 'VERIFIED',
    });

    expect(fixationList.items).toHaveLength(1);
    expect(fixationList.items[0]?.specimenNo).toBe('SP-002-01');
    expect(
      fixationList.items.every(
        (item) => item.verificationStatus === 'VERIFIED',
      ),
    ).toBe(true);

    const transportOrders = await listPendingTransportOrders({
      page: 1,
      size: 20,
      specimenNo: 'SP-007-01',
    });

    expect(transportOrders.items).toHaveLength(1);
    expect(transportOrders.items[0]?.transportOrderNo).toBe('TR-20260526-007');
  });

  it('falls back to unverified when pending fixation items omit verification fields', () => {
    const page = mapPendingSpecimenPageResponse({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-FALLBACK',
          applicationNo: 'AP-FALLBACK',
          barcode: 'BC-FALLBACK',
          containerCount: 1,
          containerName: 'Bottle',
          fixationStatus: 'PENDING',
          latestTrackingAt: null,
          patientName: 'Alice',
          registeredAt: null,
          specimenId: 'SPEC-FALLBACK',
          specimenNo: 'SP-FALLBACK',
          specimenStatus: 'REGISTERED',
          submittingDepartmentId: 'DEPT-001',
          submittingDepartmentName: 'Pathology',
          transportOrderId: null,
          verificationCompletedAt: null,
          verificationStartedAt: null,
          verificationStatus: null,
        },
      ],
      page: 1,
      size: 20,
      total: 1,
    });

    expect(page.items[0]?.verificationStatus).toBe('UNVERIFIED');
  });

  it('fills removal summary and operator fallback fields when removal page data is partial', async () => {
    const page = mapSpecimenRemovalPageResponse({
      items: [
        {
          abnormalFlag: false,
          applicationId: 'APP-REMOVAL',
          applicationNo: 'AP-REMOVAL',
          barcode: 'BC-REMOVAL',
          containerCount: null,
          containerName: null,
          inpatientNo: null,
          latestTrackingAt: null,
          patientGender: null,
          patientName: 'Alice',
          registeredAt: null,
          registeredByName: '导入用户',
          specimenId: 'SPEC-REMOVAL',
          specimenName: '胃体组织',
          specimenNo: 'SP-REMOVAL',
          specimenRemovalAt: null,
          specimenRemovalOperatorName: null,
          specimenStatus: 'REGISTERED',
          specimenType: '常规',
          surgeryName: null,
        },
      ],
      page: 1,
      size: 20,
      summary: {
        confirmedCount: 1,
      },
      total: 1,
    });

    expect(page.items[0]?.specimenRemovalOperatorName).toBeNull();
    expect(page.summary.totalCount).toBe(0);
    expect(page.summary.confirmedCount).toBe(1);
    expect(page.summary.pendingCount).toBe(0);
    expect(page.summary.abnormalCount).toBe(0);

    const removalList = await listPendingSpecimenRemovals({
      page: 1,
      size: 20,
    });
    expect(removalList.summary.totalCount).toBeGreaterThan(0);
  });

  it('supports quick removal confirmation by barcode and specimenNo', async () => {
    const removalList = await listPendingSpecimenRemovals({
      page: 1,
      size: 20,
    });
    const quickConfirmBarcode =
      removalList.items.find((item) => !item.specimenRemovalAt)?.barcode ?? '';

    const byBarcode = await confirmSpecimenRemovalByIdentifier({
      identifier: quickConfirmBarcode,
      identifierType: 'BARCODE',
      remarks: '离体确认',
    });
    expect(byBarcode.barcode).toBe(quickConfirmBarcode);
    const confirmedSpecimens = await listSpecimens({
      keyword: quickConfirmBarcode,
      page: 1,
      size: 20,
    });
    expect(confirmedSpecimens.items[0]?.verificationStatus).toBe('VERIFIED');

    await expect(
      confirmSpecimenRemovalByIdentifier({
        identifier: quickConfirmBarcode,
        identifierType: 'BARCODE',
      }),
    ).rejects.toThrow('已完成离体确认');

    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          barcode: 'BC-REMOVAL-QUICK-001',
          collectionMode: 'SURGERY',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃体组织',
          specimenSite: '胃体',
          specimenType: 'ROUTINE',
        },
      ],
      printerCode: 'P-01',
    });
    const specimenNo = registerResult.specimens[0]?.specimenNo ?? '';

    const bySpecimenNo = await confirmSpecimenRemovalByIdentifier({
      identifier: specimenNo,
      identifierType: 'SPECIMEN_NO',
    });
    expect(bySpecimenNo.barcode).toBe('BC-REMOVAL-QUICK-001');
    const directFixation = await completeFixation({
      fixationLiquidType: 'FORMALIN',
      specimenBarcode: bySpecimenNo.barcode,
    });
    expect(directFixation).toMatchObject({
      barcode: bySpecimenNo.barcode,
      fixationLiquidType: 'FORMALIN',
      fixationStatus: 'COMPLETED',
      operatorName: expect.any(String),
    });
    expect(directFixation.fixationCompletedAt).toBeTruthy();
    const fixedSpecimens = await listSpecimens({
      keyword: bySpecimenNo.barcode,
      page: 1,
      size: 20,
    });
    expect(fixedSpecimens.items[0]).toMatchObject({
      fixationLiquidType: 'FORMALIN',
      fixationOperatorName: '当前登录用户',
      fixationStatus: 'COMPLETED',
      specimenStatus: 'FIXED',
    });
  });

  it('rejects quick removal confirmation when specimenNo matches multiple records', async () => {
    const registerResult = await registerSpecimens({
      applicationId: 'APP-001',
      items: [
        {
          barcode: 'BC-REMOVAL-DUP-001',
          collectionMode: 'SURGERY',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃体组织',
          specimenSite: '胃体',
          specimenType: 'ROUTINE',
        },
      ],
      printerCode: 'P-01',
    });
    const targetSpecimenNo = registerResult.specimens[0]?.specimenNo ?? '';

    await registerSpecimens({
      applicationId: 'APP-002',
      items: [
        {
          barcode: 'BC-REMOVAL-DUP-002',
          collectionMode: 'SURGERY',
          containerCount: 1,
          containerName: '福尔马林瓶',
          specimenCount: 1,
          specimenNameStandardized: '胃窦组织',
          specimenNo: targetSpecimenNo,
          specimenSite: '胃窦',
          specimenType: 'ROUTINE',
        } as any,
      ],
      printerCode: 'P-01',
    });

    await expect(
      confirmSpecimenRemovalByIdentifier({
        identifier: targetSpecimenNo,
        identifierType: 'SPECIMEN_NO',
      }),
    ).rejects.toThrow('标本流水号对应多条记录，无法自动确认');

    await expect(
      confirmSpecimenRemovalByIdentifier({
        identifier: 'NOT-FOUND',
        identifierType: 'BARCODE',
      }),
    ).rejects.toThrow('未找到对应标本');
  });
});
