import type { ArchiveCabinetView } from '../types/operation-support';

import { describe, expect, it } from 'vitest';

import {
  buildArchiveApplicationFormRequest,
  buildArchiveEmbeddingBoxRequest,
  buildArchiveSlideRequest,
  buildArchiveSpecimenRequest,
  buildBatchCreateCabinetRequest,
  buildCreateCabinetRequest,
  buildCreateMaterialLoanRequest,
  buildReturnMaterialLoanRequest,
  buildUpdateCabinetRequest,
  createArchiveFormDefaults,
  createBatchCabinetFormDefaults,
  createCabinetFormDefaults,
  createCabinetFormStateFromCabinet,
  createLoanFormDefaults,
  createReturnFormDefaults,
  validateArchiveForm,
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
        cabinetType: 'STANDARD',
        operatorName: 'Alice',
        slotCountPerLayer: 10,
      }),
    );
    expect(createBatchCabinetFormDefaults(operator)).toEqual(
      expect.objectContaining({
        cabinetType: 'STANDARD',
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

  it('validates required cabinet and archive fields', () => {
    const cabinetForm = createCabinetFormDefaults(operator);

    expect(validateCabinetForm(cabinetForm, 'create')).toBeTruthy();

    cabinetForm.cabinetCode = ' CAB-01 ';
    cabinetForm.cabinetName = ' Cabinet 1 ';
    expect(validateCabinetForm(cabinetForm, 'create')).toBe('');

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
      layerCount: 2,
      locationDescription: ' ',
      remarks: ' Ready ',
      slotCountPerLayer: 10,
      terminalCode: ' TERM-1 ',
    });

    expect(buildCreateCabinetRequest(cabinetForm)).toEqual({
      cabinetCode: 'CAB-01',
      cabinetName: 'Cabinet 1',
      cabinetType: 'STANDARD',
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

    const batchForm = createBatchCabinetFormDefaults(operator);
    Object.assign(batchForm, {
      cabinetCodePrefix: ' CAB-B ',
      cabinetNamePrefix: ' 批量柜 ',
      locationDescription: ' 2F ',
      remarks: ' ',
      terminalCode: ' TERM-B ',
    });
    expect(buildBatchCreateCabinetRequest(batchForm)).toEqual({
      cabinetCodePrefix: 'CAB-B',
      cabinetNamePrefix: '批量柜',
      cabinetType: 'STANDARD',
      count: 1,
      layerCount: 1,
      locationDescription: '2F',
      numberWidth: 3,
      operatorName: 'Alice',
      operatorUserId: 'USER-1',
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
});
