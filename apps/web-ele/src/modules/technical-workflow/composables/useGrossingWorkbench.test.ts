import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCompleteGrossing,
  mockMessageSuccess,
  mockMessageWarning,
  mockOnSubmitted,
} = vi.hoisted(() => ({
  mockCompleteGrossing: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageWarning: vi.fn(),
  mockOnSubmitted: vi.fn(),
}));

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      realName: '当前取材员',
      userId: 'USER-GROSSING',
    },
  }),
}));

vi.mock('element-plus', () => ({
  ElMessage: {
    success: mockMessageSuccess,
    warning: mockMessageWarning,
  },
}));

vi.mock('#/modules/system-management/api/system-management-service', () => ({
  listBodyParts: vi.fn(),
  listSamplingTemplates: vi.fn(),
}));

vi.mock('#/modules/system-management/api/workflow-reference-service', () => ({
  createEmptyWorkflowReferenceOptions: () => ({
    clinicalSymptoms: [],
    collectionModes: [],
    containerNames: [],
    cutSurfaceFeatures: [],
    embeddingRemarks: [],
    fixationLiquidTypes: [],
    marginMarkings: [],
    specimenImageSizes: [],
    specimenTypes: [],
  }),
  loadWorkflowReferenceOptionsSafely: vi.fn(),
}));

vi.mock('../api/technical-workflow-service', () => ({
  completeGrossing: mockCompleteGrossing,
  getGrossingWorkbenchContext: vi.fn(),
  uploadGrossingMediaAsset: vi.fn(),
}));

import { useGrossingWorkbench } from './useGrossingWorkbench';

describe('useGrossingWorkbench', () => {
  beforeEach(() => {
    mockCompleteGrossing.mockReset();
    mockMessageSuccess.mockClear();
    mockMessageWarning.mockClear();
    mockOnSubmitted.mockClear();
  });

  it('submits embedding boxes as confirmed with the grossing payload', async () => {
    mockCompleteGrossing.mockResolvedValue({
      caseId: 'CASE-1',
      caseStatus: 'SAMPLING',
      createdDehydrationTaskCount: 1,
      taskId: 'TASK-1',
    });

    const workbench = useGrossingWorkbench({ onSubmitted: mockOnSubmitted });
    const specimen = workbench.completeForm.specimens[0]!;
    workbench.completeForm.caseId = 'CASE-1';
    workbench.completeForm.taskId = 'TASK-1';
    workbench.operatorForm.remarks = ' 本次取材说明 ';
    workbench.operatorForm.terminalCode = ' TG-01 ';
    specimen.specimenId = 'SPEC-1';
    specimen.blocks[0]!.blockDescription = 'block-a';
    specimen.embeddingBoxes![0]!.boxName = ' 包埋盒 1 ';
    specimen.embeddingBoxes![0]!.embeddingBoxNo = ' A1 ';
    specimen.embeddingBoxes![0]!.embeddingRemarks = ' 皮肤组织 ';

    await workbench.submitGrossing();

    expect(mockCompleteGrossing).toHaveBeenCalledWith({
      caseId: 'CASE-1',
      remarks: '本次取材说明',
      specimens: [
        expect.objectContaining({
          blocks: [
            {
              blockDescription: 'block-a',
              blockSite: null,
              specialRequirement: null,
            },
          ],
          embeddingBoxes: [
            {
              boxName: '包埋盒 1',
              embeddingBoxNo: 'A1',
              embeddingRemarks: '皮肤组织',
              sequenceNo: 1,
              status: 'CONFIRMED',
            },
          ],
          specimenId: 'SPEC-1',
          specimenType: 'ROUTINE',
        }),
      ],
      taskId: 'TASK-1',
      terminalCode: 'TG-01',
    });
    expect(mockMessageSuccess).toHaveBeenCalledWith('取材完成，已生成 1 条脱水任务');
    expect(mockOnSubmitted).toHaveBeenCalledTimes(1);
  });
});
