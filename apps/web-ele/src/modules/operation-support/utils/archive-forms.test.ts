import type { ArchiveCabinetView } from '../types/operation-support';

import { describe, expect, it } from 'vitest';

import {
  buildArchiveApplicationFormRequest,
  buildArchiveEmbeddingBoxRequest,
  buildArchiveSlideRequest,
  buildArchiveSpecimenRequest,
  buildBatchArchiveObjectRequest,
  buildBatchArchiveSpecimenRequest,
  buildBatchCreateCabinetRequest,
  buildCreateCabinetNodeRequest,
  buildCreateCabinetRequest,
  buildCreateMaterialLoanRequest,
  buildReturnMaterialLoanRequest,
  buildUpdateCabinetNodeRequest,
  buildUpdateCabinetRequest,
  createArchiveFormDefaults,
  createBatchCabinetFormDefaults,
  createCabinetFormDefaults,
  createCabinetFormStateFromCabinet,
  createCabinetFormStateFromNode,
  createLoanFormDefaults,
  createReturnFormDefaults,
  validateArchiveForm,
  validateBatchArchiveForm,
  validateBatchCabinetForm,
  validateCabinetForm,
  validateLoanForm,
  validateReturnForm,
} from './archive-forms';

const operator = {
  operatorName: 'Alice',
  operatorUserId: 'USER-1',
};

function createCabinet(overrides: Partial<ArchiveCabinetView> = {}) {
  return {
    cabinetCode: 'CAB-01',
    cabinetName: 'Cabinet 1',
    cabinetStatus: 'ACTIVE',
    cabinetType: 'STANDARD',
    capacity: 20,
    id: 'CABINET-1',
    layerCount: 2,
    locationDescription: 'Room A',
    remarks: 'Ready',
    slotCountPerLayer: 10,
    ...overrides,
  };
}

describe('archive form helpers', () => {
  it('creates form defaults with current operator information', () => {
    expect(createCabinetFormDefaults(operator)).toEqual(
      expect.objectContaining({
        cabinetStatus: 'ACTIVE',
        cabinetType: 'APPLICATION_FORM',
        nodeType: 'CABINET',
        operatorName: 'Alice',
        slotCountPerLayer: 10,
      }),
    );
    expect(createBatchCabinetFormDefaults(operator)).toEqual(
      expect.objectContaining({
        cabinetType: 'APPLICATION_FORM',
        count: 1,
        numberWidth: 3,
        operatorName: 'Alice',
        startNo: 1,
      }),
    );
    expect(createArchiveFormDefaults(operator)).toEqual(
      expect.objectContaining({
        objectType: 'APPLICATION_FORM',
        operatorUserId: 'USER-1',
      }),
    );
    expect(createLoanFormDefaults(operator)).toEqual(
      expect.objectContaining({
        materialType: 'SLIDE',
        operatorName: 'Alice',
      }),
    );
    expect(createReturnFormDefaults(operator)).toEqual(
      expect.objectContaining(operator),
    );
  });

  it('maps an existing cabinet to edit form state', () => {
    expect(
      createCabinetFormStateFromCabinet(
        createCabinet({
          locationDescription: null,
          remarks: null,
        }),
        operator,
      ),
    ).toEqual(
      expect.objectContaining({
        cabinetCode: 'CAB-01',
        locationDescription: '',
        operatorName: 'Alice',
        remarks: '',
        terminalCode: '',
      }),
    );
  });

  it('maps an existing cabinet node to node edit form state', () => {
    expect(
      createCabinetFormStateFromNode(
        {
          cabinetId: 'CABINET-1',
          cabinetType: 'SLIDE',
          capacity: 20,
          id: 'NODE-1',
          nodeCode: 'CAB-01',
          nodeType: 'CABINET',
          parentId: 'AREA-1',
          pathLocation: '2F',
          remainingCapacity: 18,
          remarks: null,
        },
        operator,
      ),
    ).toEqual(
      expect.objectContaining({
        capacity: 20,
        cabinetType: 'SLIDE',
        nodeCode: 'CAB-01',
        nodeType: 'CABINET',
        parentId: 'AREA-1',
        pathLocation: '2F',
        remainingCapacity: 18,
        remarks: '',
      }),
    );
  });

  it('validates required cabinet and archive fields', () => {
    const cabinetForm = createCabinetFormDefaults(operator);

    expect(validateCabinetForm(cabinetForm, 'create')).toBeTruthy();

    cabinetForm.nodeCode = ' CAB-01 ';
    cabinetForm.capacity = 10;
    cabinetForm.operatorName = '';
    expect(validateCabinetForm(cabinetForm, 'create')).toBe('');
    expect(validateCabinetForm(cabinetForm, 'edit')).toBe('请填写操作人。');
    cabinetForm.operatorName = 'Alice';

    cabinetForm.nodeType = 'DRAWER';
    cabinetForm.parentId = '';
    expect(validateCabinetForm(cabinetForm, 'create')).toBe(
      '抽屉节点必须选择父柜子。',
    );

    const batchForm = createBatchCabinetFormDefaults(operator);
    expect(validateBatchCabinetForm(batchForm)).toBeTruthy();
    Object.assign(batchForm, {
      cabinetCodePrefix: ' CAB-B ',
      cabinetNamePrefix: ' 批量柜 ',
      count: 2,
      layerCount: 1,
      slotCountPerLayer: 10,
      startNo: 1,
    });
    expect(validateBatchCabinetForm(batchForm)).toBe('');

    const archiveForm = createArchiveFormDefaults(operator);

    expect(
      validateArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedPosition: true,
        permissionWarning: '',
      }),
    ).toBeTruthy();

    archiveForm.caseId = 'CASE-1';
    expect(
      validateArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedPosition: true,
        permissionWarning: '',
        selectedApplicationFormRecordCount: 1,
      }),
    ).toBe('');

    archiveForm.objectType = 'SPECIMEN';
    archiveForm.caseId = '';
    expect(
      validateArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedPosition: true,
        permissionWarning: '',
      }),
    ).toBe('标本归档必须填写标本 ID。');

    archiveForm.specimenId = 'SPECIMEN-1';
    expect(
      validateArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedPosition: true,
        permissionWarning: '',
      }),
    ).toBe('');
  });

  it('validates loan and return permissions before required fields', () => {
    const loanForm = createLoanFormDefaults(operator);

    expect(validateLoanForm(loanForm, false)).toBeTruthy();

    loanForm.materialId = 'SLIDE-1';
    loanForm.borrowedByName = 'Bob';
    expect(validateLoanForm(loanForm, true)).toBe('');

    expect(
      validateReturnForm({
        canReturnLoan: true,
        form: createReturnFormDefaults(operator),
        hasReturningLoan: false,
      }),
    ).toBeTruthy();
  });

  it('builds trimmed cabinet requests with blank optional values omitted', () => {
    const cabinetForm = createCabinetFormDefaults(operator);
    Object.assign(cabinetForm, {
      cabinetCode: ' CAB-01 ',
      cabinetName: ' Cabinet 1 ',
      nodeCode: ' CAB-01 ',
      layerCount: 2,
      locationDescription: ' ',
      remarks: ' Ready ',
      slotCountPerLayer: 10,
      terminalCode: ' TERM-1 ',
    });

    expect(buildCreateCabinetRequest(cabinetForm)).toEqual({
      cabinetCode: 'CAB-01',
      cabinetName: 'Cabinet 1',
      cabinetType: 'APPLICATION_FORM',
      layerCount: 2,
      locationDescription: undefined,
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
      remarks: 'Ready',
      slotCountPerLayer: 10,
      terminalCode: 'TERM-1',
    });
    expect(buildUpdateCabinetRequest(cabinetForm)).toEqual(
      expect.objectContaining({
        cabinetName: 'Cabinet 1',
        cabinetStatus: 'ACTIVE',
        remarks: 'Ready',
      }),
    );
    expect(buildCreateCabinetNodeRequest(cabinetForm)).toEqual({
      cabinetType: 'APPLICATION_FORM',
      capacity: 10,
      nodeCode: 'CAB-01',
      nodeType: 'CABINET',
      parentId: undefined,
      pathLocation: undefined,
      remarks: 'Ready',
      terminalCode: 'TERM-1',
    });
    expect(buildUpdateCabinetNodeRequest(cabinetForm)).toEqual({
      cabinetType: 'APPLICATION_FORM',
      capacity: 10,
      nodeCode: 'CAB-01',
      pathLocation: undefined,
      remarks: 'Ready',
      terminalCode: 'TERM-1',
    });

    const batchForm = createBatchCabinetFormDefaults(operator);
    Object.assign(batchForm, {
      cabinetCodePrefix: ' CAB-B ',
      cabinetNamePrefix: ' 批量柜 ',
      locationDescription: ' 2F ',
      parentId: ' AREA-1 ',
      remarks: ' ',
      terminalCode: ' TERM-B ',
    });
    expect(buildBatchCreateCabinetRequest(batchForm)).toEqual({
      cabinetCodePrefix: 'CAB-B',
      cabinetNamePrefix: '批量柜',
      cabinetType: 'APPLICATION_FORM',
      count: 1,
      layerCount: 1,
      locationDescription: '2F',
      numberWidth: 3,
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
      parentId: 'AREA-1',
      remarks: undefined,
      slotCountPerLayer: 10,
      startNo: 1,
      terminalCode: 'TERM-B',
    });
  });

  it('builds archive, loan, and return requests without changing api contracts', () => {
    const archiveForm = createArchiveFormDefaults(operator);
    Object.assign(archiveForm, {
      caseId: ' CASE-1 ',
      embeddingBoxId: ' BOX-1 ',
      fileName: ' scan.pdf ',
      fileUrl: ' ',
      remarks: ' Stored ',
      slideId: ' SLIDE-1 ',
      specimenId: ' SPECIMEN-1 ',
    });

    expect(
      buildArchiveApplicationFormRequest(archiveForm, 'POSITION-1'),
    ).toEqual({
      archivePositionId: 'POSITION-1',
      caseId: 'CASE-1',
      fileName: 'scan.pdf',
      fileUrl: undefined,
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
      remarks: 'Stored',
      terminalCode: undefined,
    });
    expect(buildArchiveEmbeddingBoxRequest(archiveForm, 'POSITION-1')).toEqual(
      expect.objectContaining({
        archivePositionId: 'POSITION-1',
        embeddingBoxId: 'BOX-1',
      }),
    );
    expect(buildArchiveSlideRequest(archiveForm, 'POSITION-1')).toEqual(
      expect.objectContaining({
        archivePositionId: 'POSITION-1',
        slideId: 'SLIDE-1',
      }),
    );
    expect(buildArchiveSpecimenRequest(archiveForm, 'POSITION-1')).toEqual(
      expect.objectContaining({
        archivePositionId: 'POSITION-1',
        specimenId: 'SPECIMEN-1',
      }),
    );

    const loanForm = createLoanFormDefaults(operator);
    Object.assign(loanForm, {
      borrowPurpose: ' Review ',
      borrowedByName: ' Bob ',
      borrowedByUserId: ' ',
      materialId: ' SLIDE-1 ',
    });

    expect(buildCreateMaterialLoanRequest(loanForm)).toEqual(
      expect.objectContaining({
        borrowedByName: 'Bob',
        borrowedByUserId: undefined,
        borrowPurpose: 'Review',
        materialId: 'SLIDE-1',
      }),
    );
    expect(
      buildReturnMaterialLoanRequest(createReturnFormDefaults(operator)),
    ).toEqual({
      archivePositionId: undefined,
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
      remarks: undefined,
      terminalCode: undefined,
    });
  });

  it('validates and builds physical batch archive requests', () => {
    const archiveForm = createArchiveFormDefaults(operator);
    Object.assign(archiveForm, {
      archiveCabinetId: ' CABINET-1 ',
      archiveExpiresAt: '2026-06-30T18:00:00',
      archiveReminderDays: 1,
      objectType: 'SPECIMEN',
      remarks: ' 标本批量归档 ',
      terminalCode: ' TERM-1 ',
    });

    expect(
      validateBatchArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedCabinet: false,
        objectType: 'SPECIMEN',
        permissionWarning: '',
        selectedRecordCount: 1,
      }),
    ).toBe('请选择归档框编号。');

    archiveForm.archiveReminderDays = -1;
    expect(
      validateBatchArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedCabinet: true,
        objectType: 'SPECIMEN',
        permissionWarning: '',
        selectedRecordCount: 1,
      }),
    ).toBe('剩余几天提醒不能小于 0。');

    archiveForm.archiveReminderDays = 1;
    expect(
      validateBatchArchiveForm({
        canArchiveObjectType: true,
        canQueryCabinets: true,
        form: archiveForm,
        hasSelectedCabinet: true,
        objectType: 'SPECIMEN',
        permissionWarning: '',
        selectedRecordCount: 1,
      }),
    ).toBe('');

    expect(
      buildBatchArchiveObjectRequest(
        [{ objectId: ' BOX-1 ' }, { objectId: ' BOX-2 ' }],
        archiveForm,
        'CABINET-1',
      ),
    ).toEqual({
      archiveCabinetId: 'CABINET-1',
      objectIds: ['BOX-1', 'BOX-2'],
      remarks: '标本批量归档',
      terminalCode: 'TERM-1',
    });
    expect(
      buildBatchArchiveSpecimenRequest(
        [{ objectId: ' SPECIMEN-1 ' }],
        archiveForm,
        'CABINET-1',
      ),
    ).toEqual({
      archiveCabinetId: 'CABINET-1',
      archiveExpiresAt: '2026-06-30T18:00:00',
      archiveReminderDays: 1,
      objectIds: ['SPECIMEN-1'],
      remarks: '标本批量归档',
      terminalCode: 'TERM-1',
    });
  });
});
