import type {
  ArchiveCabinetView,
  ArchivePositionView,
} from '../types/operation-support';

export type PositionWorkbenchRow = ArchivePositionView & {
  cabinetCode: string;
  cabinetName: string;
  cabinetStatus: string;
  cabinetType: string;
  selectable: boolean;
  statusReason: string;
};

export function buildPositionCode(
  cabinetCode: string,
  layerNo: number,
  slotNo: number,
) {
  return `${cabinetCode}-L${layerNo}-S${slotNo}`;
}

export function buildArchivePositionRows(
  cabinets: ArchiveCabinetView[],
  availablePositions: ArchivePositionView[],
): PositionWorkbenchRow[] {
  const availablePositionCodeMap = new Map(
    availablePositions.map((position) => [position.positionCode, position]),
  );

  return cabinets.flatMap((cabinet) => {
    const rows: PositionWorkbenchRow[] = [];

    for (let layerNo = 1; layerNo <= cabinet.layerCount; layerNo += 1) {
      for (let slotNo = 1; slotNo <= cabinet.slotCountPerLayer; slotNo += 1) {
        const positionCode = buildPositionCode(
          cabinet.cabinetCode,
          layerNo,
          slotNo,
        );
        const availablePosition = availablePositionCodeMap.get(positionCode);
        let positionStatus = 'OCCUPIED';
        if (cabinet.cabinetStatus === 'DISABLED') {
          positionStatus = 'DISABLED';
        } else if (availablePosition) {
          positionStatus = 'AVAILABLE';
        }

        rows.push({
          cabinetCode: cabinet.cabinetCode,
          cabinetId: cabinet.id,
          cabinetName: cabinet.cabinetName,
          cabinetStatus: cabinet.cabinetStatus,
          cabinetType: cabinet.cabinetType,
          id: availablePosition?.id ?? `${cabinet.id}-${layerNo}-${slotNo}`,
          layerNo,
          positionCode,
          positionStatus,
          selectable: positionStatus === 'AVAILABLE',
          slotNo,
          statusReason: getPositionStatusReason(
            positionStatus,
            cabinet.cabinetName,
          ),
        });
      }
    }

    return rows;
  });
}

export function summarizeArchivePositions(rows: PositionWorkbenchRow[]) {
  const summary = {
    available: 0,
    disabled: 0,
    occupied: 0,
    total: rows.length,
  };

  for (const row of rows) {
    if (row.positionStatus === 'AVAILABLE') {
      summary.available += 1;
      continue;
    }
    if (row.positionStatus === 'DISABLED') {
      summary.disabled += 1;
      continue;
    }
    summary.occupied += 1;
  }

  return summary;
}

export function getCabinetStatusTagType(status?: null | string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'DISABLED') {
    return 'info';
  }
  return 'primary';
}

export function getPositionStatusTagType(status?: null | string) {
  if (status === 'AVAILABLE') {
    return 'success';
  }
  if (status === 'OCCUPIED') {
    return 'warning';
  }
  if (status === 'DISABLED') {
    return 'info';
  }
  return 'primary';
}

export function getArchiveStatusTagType(status?: null | string) {
  if (status === 'IN_STORAGE') {
    return 'success';
  }
  if (status === 'BORROWED') {
    return 'warning';
  }
  return 'info';
}

export function getLoanStatusTagType(status?: null | string) {
  if (status === 'BORROWED') {
    return 'warning';
  }
  if (status === 'RETURNED') {
    return 'success';
  }
  return 'info';
}

export function getPositionStatusReason(status: string, cabinetName: string) {
  if (status === 'AVAILABLE') {
    return '柜位可用于后续归档选择。';
  }
  if (status === 'DISABLED') {
    return `${cabinetName} 已停用，当前柜位不可分配。`;
  }
  return '柜位已被占用，需释放后才能再次使用。';
}

export function getToggleCabinetActionLabel(cabinetStatus: string) {
  return cabinetStatus === 'DISABLED' ? '启用' : '停用';
}
