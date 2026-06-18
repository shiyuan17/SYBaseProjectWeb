import type { FrozenSessionDetail } from '#/modules/frozen-workflow/types/frozen-workflow';

import { createApp, h, nextTick, type SetupContext } from 'vue';

import { describe, expect, it, vi } from 'vitest';

type SlotContext = Pick<SetupContext, 'slots'>;
type EmitContext = { emit: (event: string, ...args: unknown[]) => void };

vi.mock('element-plus', () => ({
  ElButton: {
    emits: ['click'],
    inheritAttrs: false,
    setup(
      _: Record<string, never>,
      { emit, slots }: EmitContext & SlotContext,
    ) {
      return () =>
        h(
          'button',
          {
            'data-testid': 'frozen-report-close',
            onClick: () => emit('click'),
            type: 'button',
          },
          slots.default?.(),
        );
    },
  },
  ElDescriptions: {
    setup(_: Record<string, never>, { slots }: SlotContext) {
      return () =>
        h('div', { 'data-testid': 'frozen-report-desc' }, slots.default?.());
    },
  },
  ElDescriptionsItem: {
    props: ['label'],
    setup(props: { label?: string }, { slots }: SlotContext) {
      return () =>
        h(
          'div',
          {
            'data-label': props.label ?? '',
            'data-testid': 'frozen-report-item',
          },
          slots.default?.(),
        );
    },
  },
  ElDialog: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    setup(
      props: { modelValue?: boolean },
      { emit, slots }: EmitContext & SlotContext,
    ) {
      return () =>
        props.modelValue
          ? h(
              'div',
              {
                'data-testid': 'frozen-report-dialog',
                onClick: () => emit('update:modelValue', false),
              },
              [slots.default?.(), slots.footer?.()],
            )
          : null;
    },
  },
  ElEmpty: {
    props: ['description'],
    setup(props: { description?: string }) {
      return () =>
        h(
          'div',
          { 'data-testid': 'frozen-report-empty' },
          props.description ?? '',
        );
    },
  },
  ElTag: {
    setup(_: Record<string, never>, { slots }: SlotContext) {
      return () =>
        h('span', { 'data-testid': 'frozen-report-tag' }, slots.default?.());
    },
  },
}));

import FrozenReportPreviewDialog from './FrozenReportPreviewDialog.vue';

function buildDetail(): FrozenSessionDetail {
  return {
    applicationId: 'APP-FR-001',
    applicationNo: 'SQD-FS-20260527-001',
    autoPrintSlides: true,
    caseId: 'CASE-FR-001',
    compareStatus: 'SIGNED_OFF',
    compareSummary: '冰石一致',
    currentTaskType: 'COMPARE',
    finalConfirmedAt: '2026-05-27T10:30:00',
    finalDiagnosis: '良性病变',
    frozenPathologyNo: 'F260527001',
    grossingCompletedAt: '2026-05-27T09:15:00',
    grossingDescription: '取材完成',
    grossingStartedAt: '2026-05-27T09:00:00',
    handoverComment: '正常交接',
    hasRegularCaseLinked: false,
    id: 'FS-001',
    intraoperativePhoneBack: true,
    nextAction: '完成冰石对比',
    patientName: '张敏',
    phoneBackAt: '2026-05-27T10:00:00',
    preliminaryResult: '初步诊断良性',
    receivedAt: '2026-05-27T08:30:00',
    reminders: [],
    remainingTissueStatus: 'PENDING',
    reportConfirmedAt: '2026-05-27T10:30:00',
    requestedAt: '2026-05-27T08:20:00',
    requestDoctorName: '陈医生',
    sessionNo: 'FS-20260527-01',
    sessionStatus: 'CONFIRMED',
    slicingCompletedAt: '2026-05-27T09:30:00',
    slicingStartedAt: '2026-05-27T09:20:00',
    tasks: [],
    timeline: [],
    timeoutLevel: 'NONE',
  };
}

function mountDialog(props: {
  detail: FrozenSessionDetail | null;
  modelValue: boolean;
}) {
  const container = document.createElement('div');
  document.body.append(container);
  const events: Array<{ event: string; payload: unknown }> = [];
  const app = createApp({
    setup() {
      return () =>
        h(FrozenReportPreviewDialog, {
          detail: props.detail,
          modelValue: props.modelValue,
          'onUpdate:modelValue': (value: boolean) => {
            events.push({ event: 'update:modelValue', payload: value });
          },
        });
    },
  });
  app.mount(container);
  return { app, container, events };
}

describe('FrozenReportPreviewDialog', () => {
  it('renders empty placeholder when detail is null', () => {
    const { app, container } = mountDialog({ detail: null, modelValue: true });
    const empty = container.querySelector(
      '[data-testid="frozen-report-empty"]',
    );
    expect(empty).not.toBeNull();
    expect(empty?.textContent).toContain('暂无冰冻报告数据');
    expect(
      container.querySelector('[data-testid="frozen-report-item"]'),
    ).toBeNull();
    app.unmount();
    container.remove();
  });

  it('renders key fields when detail provided', () => {
    const { app, container } = mountDialog({
      detail: buildDetail(),
      modelValue: true,
    });
    const items = [
      ...container.querySelectorAll('[data-testid="frozen-report-item"]'),
    ];
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(
        (item as HTMLElement).dataset.label ?? '',
        (item.textContent ?? '').trim(),
      );
    }
    expect(map.get('申请单号')).toContain('SQD-FS-20260527-001');
    expect(map.get('患者姓名')).toContain('张敏');
    expect(map.get('冰冻病理号')).toContain('F260527001');
    expect(map.get('报告确认时间')).toContain('2026-05-27T10:30:00');
    expect(map.get('最终诊断')).toContain('良性病变');
    expect(map.get('会话状态')).toContain('报告已发布');
    app.unmount();
    container.remove();
  });

  it('emits update:modelValue when close button clicked', async () => {
    const { app, container, events } = mountDialog({
      detail: buildDetail(),
      modelValue: true,
    });
    const closeButton = container.querySelector(
      '[data-testid="frozen-report-close"]',
    ) as HTMLButtonElement | null;
    expect(closeButton).not.toBeNull();
    closeButton?.click();
    await nextTick();
    expect(events).toContainEqual({
      event: 'update:modelValue',
      payload: false,
    });
    app.unmount();
    container.remove();
  });
});
