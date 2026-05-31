import type { DashboardDomainData } from '../types/dashboard';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockAccessStore,
  mockLoadDoctorDomainData,
  mockLoadNotificationSummary,
  mockLoadOperationDomainData,
  mockLoadSpecimenDomainData,
  mockLoadTechnicalDomainData,
  mockLoadQualityDomainData,
} = vi.hoisted(() => ({
  mockAccessStore: {
    accessCodes: [] as string[],
  },
  mockLoadDoctorDomainData: vi.fn(),
  mockLoadNotificationSummary: vi.fn(),
  mockLoadOperationDomainData: vi.fn(),
  mockLoadQualityDomainData: vi.fn(),
  mockLoadSpecimenDomainData: vi.fn(),
  mockLoadTechnicalDomainData: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useAccessStore: () => mockAccessStore,
}));

vi.mock('../api/dashboard-service', () => ({
  loadDoctorDomainData: mockLoadDoctorDomainData,
  loadNotificationSummary: mockLoadNotificationSummary,
  loadOperationDomainData: mockLoadOperationDomainData,
  loadQualityDomainData: mockLoadQualityDomainData,
  loadSpecimenDomainData: mockLoadSpecimenDomainData,
  loadTechnicalDomainData: mockLoadTechnicalDomainData,
}));

import { useRoleWorkspaceDashboard } from './useRoleWorkspaceDashboard';

function createDomainData(
  overrides: Partial<DashboardDomainData>,
): DashboardDomainData {
  return {
    alerts: [],
    cards: [],
    id: 'specimen',
    quickEntries: [],
    title: 'Specimen',
    ...overrides,
  };
}

function createHarnessState() {
  let state: null | ReturnType<typeof useRoleWorkspaceDashboard> = null;

  const Harness = defineComponent({
    setup() {
      state = useRoleWorkspaceDashboard();
      return () => h('div');
    },
  });

  return {
    Harness,
    getState: () => state,
  };
}

async function flush() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}

describe('useRoleWorkspaceDashboard', () => {
  beforeEach(() => {
    mockAccessStore.accessCodes = ['PERM_M2_SPECIMEN_RECEIVE'];

    mockLoadSpecimenDomainData.mockResolvedValue(
      createDomainData({
        cards: [
          {
            description: 'Pending applications',
            id: 'specimen-applications',
            route: '/workflow/submission-registration',
            title: 'Applications',
            tone: 'warning',
            value: '4',
          },
        ],
        id: 'specimen',
        quickEntries: [
          {
            description: 'Open application registration',
            id: 'specimen-entry-1',
            route: '/workflow/submission-registration',
            title: 'Registration',
          },
        ],
        title: 'Specimen',
      }),
    );
    mockLoadTechnicalDomainData.mockResolvedValue(
      createDomainData({
        alerts: [
          {
            description: 'Timeout risk',
            id: 'technical-alert-1',
            route: '/technical-workflow/tasks',
            severity: 'danger',
            source: 'Technical',
            title: 'Technical task',
          },
        ],
        cards: [
          {
            description: '3 pending and 1 in progress',
            id: 'technical-grossing',
            route: '/technical-workflow/grossing',
            title: 'Grossing',
            tone: 'danger',
            value: '4',
          },
        ],
        id: 'technical',
        quickEntries: [
          {
            description: 'Open technical task pool',
            id: 'technical-entry-1',
            route: '/technical-workflow/tasks',
            title: 'Task pool',
          },
        ],
        title: 'Technical',
      }),
    );
    mockLoadDoctorDomainData.mockResolvedValue(null);
    mockLoadOperationDomainData.mockResolvedValue(null);
    mockLoadQualityDomainData.mockResolvedValue(null);
    mockLoadNotificationSummary.mockResolvedValue({
      items: [
        {
          actionRoute: '/notifications',
          category: 'SYSTEM',
          createdAt: '2026-05-30T09:00:00',
          id: 'notice-1',
          query: {},
          status: 'UNREAD',
          summary: 'Review reminder',
          title: 'System notice',
          topicCode: 'SYSTEM_NOTICE',
        },
      ],
      unreadCount: 2,
    });
  });

  afterEach(() => {
    mockAccessStore.accessCodes = [];
    mockLoadDoctorDomainData.mockReset();
    mockLoadNotificationSummary.mockReset();
    mockLoadOperationDomainData.mockReset();
    mockLoadQualityDomainData.mockReset();
    mockLoadSpecimenDomainData.mockReset();
    mockLoadTechnicalDomainData.mockReset();
    document.body.innerHTML = '';
  });

  it('loads workspace sections and notification summary together', async () => {
    const { Harness, getState } = createHarnessState();
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp(Harness);
    app.mount(root);

    await flush();

    const state = getState();
    expect(state).toBeTruthy();
    expect(state?.domainData.value.map((item) => item.id)).toEqual([
      'specimen',
      'technical',
    ]);
    expect(state?.visibleDomainTitles.value).toBe('Specimen / Technical');
    expect(state?.notificationSummary.value.unreadCount).toBe(2);
    expect(state?.quickEntryGroups.value).toHaveLength(2);
    expect(state?.visualSummary.value.heroCard?.id).toBe('technical-grossing');
    expect(mockLoadSpecimenDomainData).toHaveBeenCalledWith([
      'PERM_M2_SPECIMEN_RECEIVE',
    ]);
    expect(mockLoadTechnicalDomainData).toHaveBeenCalledWith([
      'PERM_M2_SPECIMEN_RECEIVE',
    ]);
    expect(mockLoadNotificationSummary).toHaveBeenCalledTimes(1);

    app.unmount();
    root.remove();
  });
});
