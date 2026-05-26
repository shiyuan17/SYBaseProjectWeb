import { describe, expect, it } from 'vitest';

import {
  canViewIntegrationPage,
  canViewStatisticsPage,
  getBillingManagementCapabilities,
  getHistoryManagementCapabilities,
  getM6EntryPath,
} from './access';
import { M6_PERMISSION_CODES } from './constants';

describe('m6 access helpers', () => {
  it('routes integration-only users into integration management', () => {
    const accessCodes = [M6_PERMISSION_CODES.INTEGRATION_TASK_QUERY];

    expect(getM6EntryPath(accessCodes)).toBe('/m6/integration');
    expect(canViewIntegrationPage(accessCodes)).toBe(true);

    const billingCapabilities = getBillingManagementCapabilities(accessCodes);
    expect(billingCapabilities.canViewPage).toBe(false);
    expect(billingCapabilities.canRetryBilling).toBe(false);

    const historyCapabilities = getHistoryManagementCapabilities(accessCodes);
    expect(historyCapabilities.canViewPage).toBe(false);
    expect(historyCapabilities.canImportHistory).toBe(false);
  });

  it('grants billing actions to billing manager permissions', () => {
    const accessCodes = [
      M6_PERMISSION_CODES.BILLING_QUERY,
      M6_PERMISSION_CODES.BILLING_RECEIPT,
      M6_PERMISSION_CODES.BILLING_RETRY,
      M6_PERMISSION_CODES.BILLING_RECONCILE,
    ];

    expect(getM6EntryPath(accessCodes)).toBe('/m6/billing');

    const capabilities = getBillingManagementCapabilities(accessCodes);
    expect(capabilities.canViewPage).toBe(true);
    expect(capabilities.canQueryBilling).toBe(true);
    expect(capabilities.canReceiveReceipt).toBe(true);
    expect(capabilities.canRetryBilling).toBe(true);
    expect(capabilities.canReconcile).toBe(true);
  });

  it('allows history import-only users into history page', () => {
    const accessCodes = [M6_PERMISSION_CODES.HISTORY_IMPORT];

    expect(getM6EntryPath(accessCodes)).toBe('/m6/history');

    const capabilities = getHistoryManagementCapabilities(accessCodes);
    expect(capabilities.canViewPage).toBe(true);
    expect(capabilities.canImportHistory).toBe(true);
    expect(capabilities.canQueryHistory).toBe(false);
  });

  it('keeps statistics as fallback entry when only statistics permissions exist', () => {
    const accessCodes = [M6_PERMISSION_CODES.STAT_REPORT_QUERY];

    expect(getM6EntryPath(accessCodes)).toBe('/m6/statistics');
    expect(canViewStatisticsPage(accessCodes)).toBe(true);
  });
});
