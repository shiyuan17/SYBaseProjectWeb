import type { ReagentStockView, ReagentView } from '../types/operation-support';

import { describe, expect, it } from 'vitest';

import {
  applyReagentTemplateToStockForm,
  buildCreateReagentRequest,
  buildCreateReagentStockRequest,
  buildReagentTemplateTree,
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
    defaultStockThreshold: 5,
    enabled: true,
    id: 'REAGENT-1',
    manufacturer: 'Maker',
    orderDictItemId: 'ODI_IHC_CK',
    orderItemName: 'CK',
    reagentType: 'IMMUNO_WORKING_SOLUTION',
    reagentCode: 'RG-1',
    reagentName: 'Hematoxylin',
    stainCapacity: 100,
    remarks: 'Ready',
    specification: '500ml',
    templateStatus: 'ENABLED',
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
    initialQuantity: '20',
    lowStockThreshold: '3',
    nearExpiryDays: 15,
    remainingQuantity: '18',
    reagentCode: 'RG-1',
    reagentId: 'REAGENT-1',
    reagentName: 'Hematoxylin',
    reagentType: 'IMMUNO_WORKING_SOLUTION',
    remarks: 'Cold',
    stockQuantity: '20',
    stockStatus: 'IN_USE',
    storageLocation: 'A1',
    ...overrides,
  };
}

describe('reagent ledger helpers', () => {
  it('creates default and draft reagent states', () => {
    expect(createReagentFormDefaults()).toEqual(
      expect.objectContaining({
        reagentCode: '',
        templateStatus: 'ENABLED',
      }),
    );
    expect(createDraftReagentView()).toEqual(
      expect.objectContaining({
        enabled: true,
        id: '',
        reagentCode: '',
      }),
    );
    expect(createReagentStockFormDefaults()).toEqual(
      expect.objectContaining({
        stockStatus: 'IN_STOCK',
      }),
    );
    expect(createDraftReagentStockView()).toEqual(
      expect.objectContaining({
        batchNo: '',
        id: '',
        stockStatus: 'IN_STOCK',
      }),
    );
  });

  it('maps existing rows into edit form states', () => {
    expect(createReagentFormStateFromRow(createReagent())).toEqual(
      expect.objectContaining({
        defaultLowStockThreshold: 5,
        orderDictItemId: 'ODI_IHC_CK',
        reagentCode: 'RG-1',
        reagentType: 'IMMUNO_WORKING_SOLUTION',
      }),
    );
    expect(createReagentStockFormStateFromRow(createStock())).toEqual(
      expect.objectContaining({
        initialQuantity: 20,
        lowStockThreshold: 3,
        remainingQuantity: 18,
      }),
    );
  });

  it('validates reagent and stock forms before submit', () => {
    const reagentForm = createReagentFormDefaults();

    expect(validateReagentForm(reagentForm, true)).toBeTruthy();
    Object.assign(reagentForm, {
      reagentCode: 'RG-1',
      reagentName: 'Hematoxylin',
    });
    expect(validateReagentForm(reagentForm, true)).toBe('');
    reagentForm.defaultLowStockThreshold = -1;
    expect(validateReagentForm(reagentForm, true)).toBeTruthy();

    const stockForm = createReagentStockFormDefaults();
    expect(validateReagentStockForm(stockForm, true)).toBeTruthy();
    Object.assign(stockForm, {
      batchNo: 'BATCH-1',
      reagentId: 'REAGENT-1',
    });
    expect(validateReagentStockForm(stockForm, true)).toBe('');
    stockForm.remainingQuantity = -1;
    expect(validateReagentStockForm(stockForm, true)).toBeTruthy();
  });

  it('builds create and update reagent requests without legacy operator fields', () => {
    const form = createReagentFormDefaults();
    Object.assign(form, {
      defaultNearExpiryDays: 30,
      manufacturer: '',
      orderDictItemId: 'ODI_IHC_CK',
      reagentCode: 'RG-1',
      reagentName: 'Hematoxylin',
      reagentType: 'IMMUNO_WORKING_SOLUTION',
      remarks: 'Ready',
    });

    expect(buildCreateReagentRequest(form)).toEqual({
      defaultLowStockThreshold: undefined,
      defaultNearExpiryDays: 30,
      enabled: true,
      manufacturer: undefined,
      orderDictItemId: 'ODI_IHC_CK',
      reagentType: 'IMMUNO_WORKING_SOLUTION',
      templateStatus: 'ENABLED',
      remarks: 'Ready',
      reagentCode: 'RG-1',
      reagentName: 'Hematoxylin',
      specification: undefined,
      unit: undefined,
    });
    expect(buildUpdateReagentRequest(form)).toEqual(
      expect.not.objectContaining({
        operatorName: 'Alice',
        reagentCode: 'RG-1',
      }),
    );
  });

  it('builds create and update stock requests with stable field sets', () => {
    const form = createReagentStockFormDefaults();
    Object.assign(form, {
      batchNo: 'BATCH-1',
      expiryDate: '2027-01-01',
      initialQuantity: 20,
      remainingQuantity: 18,
      reagentId: 'REAGENT-1',
      storageLocation: '',
    });

    expect(buildCreateReagentStockRequest(form)).toEqual({
      batchNo: 'BATCH-1',
      expiryDate: '2027-01-01',
      initialQuantity: 20,
      lowStockThreshold: undefined,
      nearExpiryDays: undefined,
      reagentId: 'REAGENT-1',
      remainingQuantity: 18,
      remarks: undefined,
      stockStatus: 'IN_STOCK',
      storageLocation: undefined,
    });
    expect(buildUpdateReagentStockRequest(form)).toEqual(
      expect.not.objectContaining({
        batchNo: 'BATCH-1',
        operatorName: 'Alice',
        reagentId: 'REAGENT-1',
      }),
    );
  });

  it('builds grouped template trees and filters by keyword', () => {
    const reagents = [
      createReagent(),
      createReagent({
        id: 'REAGENT-2',
        orderItemName: 'CD22',
        reagentCode: 'RG-2',
        reagentName: 'CD22浓缩液',
        reagentType: 'IMMUNO_CONCENTRATE',
      }),
    ];
    const tree = buildReagentTemplateTree(reagents);

    expect(tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          children: [
            expect.objectContaining({
              id: 'REAGENT-2',
              label: 'CD22浓缩液',
            }),
          ],
          id: 'IMMUNO_CONCENTRATE',
          label: '免疫组化浓缩液',
        }),
        expect.objectContaining({
          children: [
            expect.objectContaining({
              id: 'REAGENT-1',
              label: 'Hematoxylin',
            }),
          ],
          id: 'IMMUNO_WORKING_SOLUTION',
          label: '免疫组化工作液',
        }),
      ]),
    );

    expect(buildReagentTemplateTree(reagents, 'CD22')).toEqual([
      expect.objectContaining({
        children: [
          expect.objectContaining({
            label: 'CD22浓缩液',
          }),
        ],
      }),
    ]);
  });

  it('applies template defaults without overwriting filled stock fields', () => {
    const form = createReagentStockFormDefaults();
    const reagent = createReagent({
      applicationDilution: '1:100',
      recommendedDilution: '1:200',
      stainCapacity: 120,
      stainThreshold: 8,
      validityDays: 365,
    });

    applyReagentTemplateToStockForm(form, reagent, {
      overwriteEmptyOnly: true,
    });

    expect(form).toEqual(
      expect.objectContaining({
        applicationDilution: '1:100',
        recommendedDilution: '1:200',
        reagentId: 'REAGENT-1',
        stainCapacity: 120,
        stainThreshold: 8,
        validityDays: 365,
      }),
    );

    Object.assign(form, {
      applicationDilution: 'manual-app',
      recommendedDilution: 'manual-rec',
      stainCapacity: 20,
      stainThreshold: 2,
      validityDays: 90,
    });
    applyReagentTemplateToStockForm(
      form,
      createReagent({
        applicationDilution: '1:400',
        id: 'REAGENT-2',
        recommendedDilution: '1:500',
        stainCapacity: 999,
        stainThreshold: 99,
        validityDays: 730,
      }),
      {
        overwriteEmptyOnly: true,
      },
    );

    expect(form).toEqual(
      expect.objectContaining({
        applicationDilution: 'manual-app',
        recommendedDilution: 'manual-rec',
        reagentId: 'REAGENT-2',
        stainCapacity: 20,
        stainThreshold: 2,
        validityDays: 90,
      }),
    );
  });

  it('keeps tag type mappings stable', () => {
    expect(getStockStatusTagType('IN_STOCK')).toBe('info');
    expect(getStockStatusTagType('IN_USE')).toBe('success');
    expect(getStockStatusTagType('FINISHED')).toBe('danger');
    expect(getReagentWarningTagType('LOW_STOCK')).toBe('warning');
    expect(getReagentWarningTagType('NEAR_EXPIRY')).toBe('danger');
  });
});
