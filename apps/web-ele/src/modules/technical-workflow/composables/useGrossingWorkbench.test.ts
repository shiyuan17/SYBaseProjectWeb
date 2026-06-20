import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCompleteGrossing,
  mockGetGrossingWorkbenchContext,
  mockMessageSuccess,
  mockMessageWarning,
  mockOnSubmitted,
  mockUploadGrossingMediaAsset,
} = vi.hoisted(() => ({
  mockCompleteGrossing: vi.fn(),
  mockGetGrossingWorkbenchContext: vi.fn(),
  mockMessageSuccess: vi.fn(),
  mockMessageWarning: vi.fn(),
  mockOnSubmitted: vi.fn(),
  mockUploadGrossingMediaAsset: vi.fn(),
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
  getGrossingWorkbenchContext: mockGetGrossingWorkbenchContext,
  uploadGrossingMediaAsset: mockUploadGrossingMediaAsset,
}));

import { useGrossingWorkbench } from './useGrossingWorkbench';

describe('useGrossingWorkbench', () => {
  beforeEach(() => {
    mockCompleteGrossing.mockReset();
    mockGetGrossingWorkbenchContext.mockReset();
    mockMessageSuccess.mockClear();
    mockMessageWarning.mockClear();
    mockOnSubmitted.mockClear();
    mockUploadGrossingMediaAsset.mockReset();
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
    expect(mockMessageSuccess).toHaveBeenCalledWith(
      '取材完成，已生成 1 条脱水任务',
    );
    expect(mockOnSubmitted).toHaveBeenCalledTimes(1);
  });

  it('submits when embedding boxes are complete and block fields are empty', async () => {
    mockCompleteGrossing.mockResolvedValue({
      caseId: 'CASE-BOX',
      caseStatus: 'SAMPLING',
      createdDehydrationTaskCount: 3,
      taskId: 'TASK-BOX',
    });

    const workbench = useGrossingWorkbench();
    workbench.resetWorkbenchState();
    const specimen = workbench.completeForm.specimens[0]!;
    workbench.completeForm.caseId = 'CASE-BOX';
    workbench.completeForm.taskId = 'TASK-BOX';
    specimen.specimenId = 'SPEC-BOX';
    workbench.addEmbeddingBoxes(2, 'A');

    await workbench.submitGrossing();

    expect(mockMessageWarning).not.toHaveBeenCalledWith(
      '每个标本至少需要一条有效的蜡块明细',
    );
    expect(mockCompleteGrossing).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'CASE-BOX',
        specimens: [
          expect.objectContaining({
            blocks: [
              {
                blockDescription: null,
                blockSite: null,
                specialRequirement: null,
              },
              {
                blockDescription: null,
                blockSite: null,
                specialRequirement: null,
              },
              {
                blockDescription: null,
                blockSite: null,
                specialRequirement: null,
              },
            ],
            embeddingBoxes: [
              expect.objectContaining({ embeddingBoxNo: 'A1' }),
              expect.objectContaining({ embeddingBoxNo: 'A2' }),
              expect.objectContaining({ embeddingBoxNo: 'A3' }),
            ],
            specimenId: 'SPEC-BOX',
          }),
        ],
        taskId: 'TASK-BOX',
      }),
    );
  });

  it('fills missing embedding box numbers before continuing the sequence', () => {
    const workbench = useGrossingWorkbench();
    workbench.resetWorkbenchState();
    const specimen = workbench.completeForm.specimens[0]!;

    workbench.addEmbeddingBoxes(3, 'A');
    expect(specimen.embeddingBoxes?.map((box) => box.embeddingBoxNo)).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
    ]);

    workbench.removeEmbeddingBox(1);
    workbench.removeEmbeddingBox(1);
    expect(specimen.embeddingBoxes?.map((box) => box.embeddingBoxNo)).toEqual([
      'A1',
      'A4',
    ]);

    workbench.addEmbeddingBoxes(3, 'A');

    expect(specimen.embeddingBoxes?.map((box) => box.embeddingBoxNo)).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A5',
    ]);
    expect(specimen.blocks).toHaveLength(5);
  });

  it('uses the selected specimen name to associate new embedding boxes', async () => {
    mockGetGrossingWorkbenchContext.mockResolvedValue({
      tracking: {
        blocks: [],
        specimens: [
          {
            specimenId: 'SPEC-1',
            specimenName: '胃组织',
            specimenNo: 'SP-1',
          },
          {
            specimenId: 'SPEC-2',
            specimenName: '肠组织',
            specimenNo: 'SP-2',
          },
        ],
      },
    });

    const workbench = useGrossingWorkbench();
    workbench.completeForm.taskId = 'TASK-1';

    await workbench.loadWorkbenchContext();

    expect(workbench.activeSpecimenName.value).toBe('胃组织');
    expect(workbench.specimenNameOptions.value).toEqual([
      { label: '胃组织', value: workbench.specimenTabMetas.value[0]!.key },
      { label: '肠组织', value: workbench.specimenTabMetas.value[1]!.key },
    ]);
    expect(
      workbench.completeForm.specimens[0]?.embeddingBoxes?.[0]?.embeddingBoxNo,
    ).toBe('A1');
    workbench.addEmbeddingBoxes(1);
    expect(
      workbench.completeForm.specimens[0]?.embeddingBoxes?.map(
        (box) => box.embeddingBoxNo,
      ),
    ).toEqual(['A1', 'A2']);

    workbench.selectedEmbeddingBoxSpecimenKey.value =
      workbench.specimenTabMetas.value[1]!.key;

    expect(workbench.activeSpecimenName.value).toBe('胃组织');
    expect(workbench.activeSpecimenKey.value).toBe(
      workbench.specimenTabMetas.value[0]!.key,
    );
    expect(
      workbench.completeForm.specimens[1]?.embeddingBoxes?.[0]?.embeddingBoxNo,
    ).toBe('B1');
    workbench.addEmbeddingBoxes(1);
    expect(
      workbench.completeForm.specimens[1]?.embeddingBoxes?.map(
        (box) => box.embeddingBoxNo,
      ),
    ).toEqual(['B1', 'B2']);
    expect(
      workbench.embeddingBoxRows.value.map((row) => ({
        boxNo: row.box.embeddingBoxNo,
        specimenName: row.specimenName,
      })),
    ).toEqual([
      { boxNo: 'A1', specimenName: '胃组织' },
      { boxNo: 'A2', specimenName: '胃组织' },
      { boxNo: 'B1', specimenName: '肠组织' },
      { boxNo: 'B2', specimenName: '肠组织' },
    ]);
  });

  it('falls back to alphabetical specimen names when tracking names are empty', async () => {
    mockGetGrossingWorkbenchContext.mockResolvedValue({
      tracking: {
        blocks: [],
        specimens: [
          {
            specimenId: 'SPEC-1',
            specimenName: null,
            specimenNo: null,
          },
          {
            specimenId: 'SPEC-2',
            specimenName: '',
            specimenNo: null,
          },
        ],
      },
    });

    const workbench = useGrossingWorkbench();
    workbench.completeForm.taskId = 'TASK-1';

    await workbench.loadWorkbenchContext();

    expect(workbench.activeSpecimenName.value).toBe('A');
    expect(workbench.specimenNameOptions.value).toEqual([
      { label: 'A', value: workbench.specimenTabMetas.value[0]!.key },
      { label: 'B', value: workbench.specimenTabMetas.value[1]!.key },
    ]);
  });

  it('keeps embedding box prefixes independent when assigning numbers', () => {
    const workbench = useGrossingWorkbench();
    workbench.resetWorkbenchState();
    const specimen = workbench.completeForm.specimens[0]!;

    workbench.addEmbeddingBoxes(1, 'B');
    workbench.addEmbeddingBoxes(1, 'C');
    workbench.addEmbeddingBoxes(1, 'A');

    expect(specimen.embeddingBoxes?.map((box) => box.embeddingBoxNo)).toEqual([
      'A1',
      'A2',
      'B1',
      'C1',
    ]);
    expect(specimen.blocks).toHaveLength(4);
  });

  it('does not rewrite remaining embedding box numbers after removal', () => {
    const workbench = useGrossingWorkbench();
    workbench.resetWorkbenchState();
    const specimen = workbench.completeForm.specimens[0]!;

    workbench.addEmbeddingBoxes(3, 'A');
    workbench.removeEmbeddingBox(1);

    expect(specimen.embeddingBoxes?.map((box) => box.embeddingBoxNo)).toEqual([
      'A1',
      'A3',
      'A4',
    ]);
    expect(specimen.embeddingBoxes?.map((box) => box.sequenceNo)).toEqual([
      1, 2, 3,
    ]);
  });

  it('ignores tracked embedding box numbers when seeding a new grossing submission', async () => {
    mockGetGrossingWorkbenchContext.mockResolvedValue({
      tracking: {
        blocks: [
          {
            blockCode: 'BLK-1',
            blockId: 'BLOCK-1',
            description: '旧蜡块',
            embeddingBoxNo: 'A1',
            grossDescription: null,
            specimenId: 'SPEC-1',
            specimenName: '胃组织',
          },
        ],
        specimens: [
          {
            specimenId: 'SPEC-1',
            specimenName: '胃组织',
            specimenNo: 'SP-1',
          },
        ],
      },
    });

    const workbench = useGrossingWorkbench();
    workbench.completeForm.taskId = 'TASK-1';

    await workbench.loadWorkbenchContext();

    expect(
      workbench.completeForm.specimens[0]?.embeddingBoxes?.[0]?.embeddingBoxNo,
    ).toBe('A2');
  });

  it('seeds historical grossing data from tracking for completed tasks', async () => {
    mockGetGrossingWorkbenchContext.mockResolvedValue({
      tracking: {
        blocks: [
          {
            blockCode: 'BLK-READ-1',
            blockId: 'BLOCK-READ-1',
            description: '历史蜡块描述',
            embeddingBoxNo: 'A1',
            embeddingRemarks: '皮肤组织',
            grossDescription: '已完成大体描写',
            specimenId: 'SPEC-READ-1',
            specimenName: '标本 A',
          },
        ],
        specimens: [
          {
            specimenId: 'SPEC-READ-1',
            specimenName: '标本 A',
            specimenNo: 'SP-READ-1',
          },
        ],
      },
    });

    const workbench = useGrossingWorkbench();
    await workbench.initializeWorkbench({
      applicationId: 'APP-1',
      applicationNo: 'APP-1',
      caseId: 'CASE-1',
      id: 'TASK-READ-1',
      objectId: 'CASE-1',
      objectType: 'CASE',
      pathologyNo: 'BD202606060001',
      taskStatus: 'COMPLETED',
      taskType: 'GROSSING',
    } as never);

    expect(workbench.isReadOnly.value).toBe(true);
    expect(workbench.completeForm.specimens[0]?.grossDescription).toBe(
      '已完成大体描写',
    );
    expect(
      workbench.completeForm.specimens[0]?.embeddingBoxes?.[0]?.embeddingBoxNo,
    ).toBe('A1');
    expect(
      workbench.completeForm.specimens[0]?.embeddingBoxes?.[0]?.status,
    ).toBe('CONFIRMED');
    expect(
      workbench.completeForm.specimens[0]?.blocks[0]?.blockDescription,
    ).toBe('历史蜡块描述');
    expect(
      workbench.completeForm.specimens[0]?.embeddingBoxes?.[0]
        ?.embeddingRemarks,
    ).toBe('皮肤组织');
  });

  it('uploads grossing images directly to the selected specimen', async () => {
    mockUploadGrossingMediaAsset.mockResolvedValue({
      contentType: 'image/jpeg',
      fileName: 'grossing-camera.jpg',
      fileUrl: 'https://example.com/grossing-camera.jpg',
      size: 1024,
    });

    const workbench = useGrossingWorkbench();
    workbench.resetWorkbenchState();
    const specimen = workbench.completeForm.specimens[0]!;
    specimen.specimenId = 'SPEC-1';
    const file = new File(['image-bytes'], 'grossing-camera.jpg', {
      type: 'image/jpeg',
    });

    await expect(workbench.uploadGrossingImageFile(0, file)).resolves.toBe(
      true,
    );

    expect(mockUploadGrossingMediaAsset).toHaveBeenCalledWith(file);
    expect(specimen.mediaAssets).toEqual([
      {
        fileName: 'grossing-camera.jpg',
        fileUrl: 'https://example.com/grossing-camera.jpg',
      },
    ]);
    expect(mockMessageSuccess).toHaveBeenCalledWith('标本摄影像上传成功');
  });

  it('rejects unsupported grossing image formats before upload', async () => {
    const workbench = useGrossingWorkbench();
    const file = new File(['image-bytes'], 'grossing-camera.gif', {
      type: 'image/gif',
    });

    await expect(workbench.uploadGrossingImageFile(0, file)).resolves.toBe(
      false,
    );

    expect(mockUploadGrossingMediaAsset).not.toHaveBeenCalled();
    expect(mockMessageWarning).toHaveBeenCalledWith(
      '仅支持 JPG、PNG、WEBP、BMP 格式的标本摄影像',
    );
  });
});
