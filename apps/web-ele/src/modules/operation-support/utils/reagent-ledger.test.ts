import type { ReagentStockView, ReagentView } from '../types/operation-support';

import { describe, expect, it } from 'vitest';

import {
  buildCreateReagentRequest,
  buildCreateReagentStockRequest,
  buildUpdateReagentRequest,
  buildUpdateReagentStockRequest,
  createDraftReagentStockView,
  createDraftReagentView,
  createReagentFormDefaults,
  createReagentFormStateFromRow,
  createReagentStockFormDefaults,
  createReagentStockFormStateFromRow,
  getReagentWarningTagType,
  getStockStatusTagType,
  validateReagentForm,
  validateReagentStockForm,
} from './reagent-ledger';

function createReagent(overrides: Partial<ReagentView> = {}): ReagentView {
  return {
    defaultLowStockThreshold: '5',
    defaultNearExpiryDays: 30,
    enabled: true,
    id: 'REAGENT-1',
    manufacturer: 'Maker',
    reagentCode: 'RG-1',
    reagentName: 'Hematoxylin',
    remarks: 'Ready',
    specification: '500ml',
    unit: 'bottle',
    ...overrides,
  };
}

function createStock(
  overrides: Partial<ReagentStockView> = {},
): ReagentStockView {
  return {
    batchNo: 'BATCH-1',
    expiryDate: '2027-01-01',
    id: 'STOCK-1',
    lowStockThreshold: '3',
    nearExpiryDays: 15,
    reagentCode: 'RG-1',
    reagentId: 'REAGENT-1',
    reagentName: 'Hematoxylin',
    remarks: 'Cold',
    stockQuantity: '20',
    stockStatus: 'ACTIVE',
    storageLocation: 'A1',
    ...overrides,
  };
}

describe('reagent ledger helpers', () => {
  it('creates default and draft reagent states', () => {
    expect(createReagentFormDefaults('Alice')).toEqual(
      expect.objectContaining({
        enabled: true,
        operatorName: 'Alice',
        reagentCode: '',
      }),
    );
    expect(createDraftReagentView()).toEqual(
      expect.objectContaining({
        enabled: true,
        id: '',
        reagentCode: '',
      }),
    );
    expect(createReagentStockFormDefaults('Alice')).toEqual(
      expect.objectContaining({
        operatorName: 'Alice',
        stockStatus: 'ACTIVE',
      }),
    );
    expect(createDraftReagentStockView()).toEqual(
      expect.objectContaining({
        batchNo: '',
        id: '',
        stockStatus: 'ACTIVE',
      }),
    );
  });

  it('maps existing rows into edit form states', () => {
    expect(createReagentFormStateFromRow(createReagent(), 'Alice')).toEqual(
      expect.objectContaining({
        defaultLowStockThreshold: 5,
        operatorName: 'Alice',
        reagentCode: 'RG-1',
      }),
    );
    expect(createReagentStockFormStateFromRow(createStock(), 'Alice')).toEqual(
      expect.objectContaining({
        lowStockThreshold: 3,
        operatorName: 'Alice',
        stockQuantity: 20,
      }),
    );
  });

  it('validates reagent and stock forms before submit', () => {
    const reagentForm = createReagentFormDefaults('Alice');

    expect(validateReagentForm(reagentForm, true)).toBeTruthy();
    Object.assign(reagentForm, {
      reagentCode: 'RG-1',
      reagentName: 'Hematoxylin',
    });
    expect(validateReagentForm(reagentForm, true)).toBe('');
    reagentForm.defaultLowStockThreshold = -1;
    expect(validateReagentForm(reagentForm, true)).toBeTruthy();

    const stockForm = createReagentStockFormDefaults('Alice');
    expect(validateReagentStockForm(stockForm, true)).toBeTruthy();
    Object.assign(stockForm, {
      batchNo: 'BATCH-1',
      reagentId: 'REAGENT-1',
    });
    expect(validateReagentStockForm(stockForm, true)).toBe('');
    stockForm.stockQuantity = -1;
    expect(validateReagentStockForm(stockForm, true)).toBeTruthy();
  });

  it('builds create and update reagent requests with optional fields omitted', () => {
    const form = createReagentFormDefaults('Alice');
    Object.assign(form, {
      defaultNearExpiryDays: 30,
      manufacturer: '',
      reagentCode: 'RG-1',
      reagentName: 'Hematoxylin',
      remarks: 'Ready',
    });

    expect(buildCreateReagentRequest(form)).toEqual({
      defaultLowStockThreshold: undefined,
      defaultNearExpiryDays: 30,
      enabled: true,
      manufacturer: undefined,
      operatorName: 'Alice',
      remarks: 'Ready',
      reagentCode: 'RG-1',
      reagentName: 'Hematoxylin',
      specification: undefined,
      unit: undefined,
    });
    expect(buildUpdateReagentRequest(form)).toEqual(
      expect.not.objectContaining({
        reagentCode: 'RG-1',
      }),
    );
  });

  it('builds create and update stock requests with stable field sets', () => {
    const form = createReagentStockFormDefaults('Alice');
    Object.assign(form, {
      batchNo: 'BATCH-1',
      expiryDate: '2027-01-01',
      reagentId: 'REAGENT-1',
      stockQuantity: 20,
      storageLocation: '',
    });

    expect(buildCreateReagentStockRequest(form)).toEqual({
      batchNo: 'BATCH-1',
      expiryDate: '2027-01-01',
      lowStockThreshold: undefined,
      nearExpiryDays: undefined,
      operatorName: 'Alice',
      reagentId: 'REAGENT-1',
      remarks: undefined,
      stockQuantity: 20,
      stockStatus: 'ACTIVE',
      storageLocation: undefined,
    });
    expect(buildUpdateReagentStockRequest(form)).toEqual(
      expect.not.objectContaining({
        batchNo: 'BATCH-1',
        reagentId: 'REAGENT-1',
      }),
    );
  });

  it('keeps tag type mappings stable', () => {
    expect(getStockStatusTagType('ACTIVE')).toBe('success');
    expect(getStockStatusTagType('EXPIRED')).toBe('danger');
    expect(getReagentWarningTagType('LOW_STOCK')).toBe('warning');
    expect(getReagentWarningTagType('NEAR_EXPIRY')).toBe('danger');
  });
});
