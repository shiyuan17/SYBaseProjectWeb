import type { CaseLifecycleTrackingView } from '../../doctor-workflow/types/doctor-workflow';

import { describe, expect, it } from 'vitest';

import { buildTrackingLifecycleStages } from './tracking-lifecycle-timeline';

function createLifecycleTracking(): CaseLifecycleTrackingView {
  return {
    applicationForm: null,
    caseSummary: {
      caseId: 'CASE-001',
      hasPendingRevision: false,
      pathologyNo: 'BL202605220001',
    },
    overallTimeline: [
      {
        nodes: [
          {
            keyFacts: [
              { label: '登记状态', value: 'COMPLETED' },
              { label: '登记时间', value: '2026-05-22T08:00:00' },
              { label: '登记人', value: '登记员甲' },
              { label: '送检类型', value: 'ROUTINE' },
              { label: '标本名称', value: '胃组织' },
              { label: '不应显示', value: '隐藏值' },
            ],
            nodeCode: 'SPECIMEN_REGISTRATION',
            occurredAt: '2026-05-22T08:00:00',
            operatorName: '登记员甲',
            stageCode: 'SPECIMEN',
            status: 'COMPLETED',
            title: '标本登记',
          },
          {
            keyFacts: [
              { label: '离体操作人', value: '离体员甲' },
              { label: '离体时间', value: '2026-05-22T07:30:00' },
            ],
            nodeCode: 'SPECIMEN_REMOVAL',
            occurredAt: '2026-05-22T07:30:00',
            operatorName: '离体员甲',
            stageCode: 'SPECIMEN',
            status: 'COMPLETED',
            title: '离体确认',
          },
        ],
        stageCode: 'SPECIMEN',
        stageTitle: '临床送检',
      },
      {
        nodes: [
          {
            keyFacts: [
              { label: '复核人', value: '复核医生甲' },
              { label: '复核时间', value: '2026-05-22T11:00:00' },
            ],
            nodeCode: 'REPORT_REVIEW',
            occurredAt: '2026-05-22T11:00:00',
            stageCode: 'REPORT',
            status: 'REVIEWED',
            title: '复核',
          },
          {
            keyFacts: [
              { label: '初步阅片人', value: '初诊医生甲' },
              { label: '初步阅片时间', value: '2026-05-22T10:00:00' },
            ],
            nodeCode: 'PRIMARY_READING',
            occurredAt: '2026-05-22T10:00:00',
            stageCode: 'REPORT',
            status: 'SUBMITTED',
            title: '初步阅片',
          },
          {
            keyFacts: [
              { label: '详情报告', value: '最终诊断内容' },
              { label: '不应显示', value: '报告隐藏值' },
            ],
            nodeCode: 'REPORT_DETAIL',
            occurredAt: '2026-05-22T11:30:00',
            stageCode: 'REPORT',
            status: 'SIGNED',
            title: '详情报告',
          },
        ],
        stageCode: 'REPORT',
        stageTitle: '报告',
      },
    ],
    reportLifecycle: {
      consultations: [],
      currentReport: null,
      diagnosticTasks: [],
      medicalOrders: [],
      revisions: [],
      versions: [],
    },
    specimens: [],
  };
}

describe('tracking-lifecycle-timeline', () => {
  it('builds clinical and production stages with fixed node and field order', () => {
    const stages = buildTrackingLifecycleStages(createLifecycleTracking());

    expect(stages.map((stage) => stage.title)).toEqual([
      '临床送检',
      '制片管理',
    ]);
    expect(stages[0]?.nodes.map((node) => node.title)).toEqual([
      '离体确认',
    ]);
    expect(stages[1]?.nodes.map((node) => node.title)).toEqual([
      '标本登记',
      '报告',
    ]);
    expect(stages[1]?.nodes[0]?.facts.map((fact) => fact.label)).toEqual([
      '登记状态',
      '登记时间',
      '登记人',
      '送检类型',
      '标本名称',
      '类型',
      '来源部位',
      '标本大小',
      '核对状态',
      '评价',
      '登记影像',
    ]);
    expect(stages[1]?.nodes[0]?.facts.map((fact) => fact.value)).toContain(
      '-',
    );
    expect(
      stages[1]?.nodes[0]?.facts.some((fact) => fact.label === '不应显示'),
    ).toBe(false);
  });

  it('merges report lifecycle facts into one report node by the requested field order', () => {
    const stages = buildTrackingLifecycleStages(createLifecycleTracking());
    const reportNode = stages[1]?.nodes.find((node) => node.title === '报告');

    expect(reportNode?.facts.map((fact) => fact.label)).toEqual([
      '初步阅片人',
      '初步阅片时间',
      '复核人',
      '复核时间',
      '签发人',
      '签发时间',
      '详情报告',
      '驳回状态',
      '驳回时间',
      '驳回人',
      '发布人',
      '发布时间',
      '修订时间',
      '修订人',
    ]);
    expect(reportNode?.facts).toEqual(
      expect.arrayContaining([
        { isDateTime: false, label: '初步阅片人', value: '初诊医生甲' },
        {
          isDateTime: true,
          label: '初步阅片时间',
          value: '2026-05-22T10:00:00',
        },
        { isDateTime: false, label: '复核人', value: '复核医生甲' },
        { isDateTime: false, label: '详情报告', value: '最终诊断内容' },
      ]),
    );
  });
});
