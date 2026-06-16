import type {
  CreateMedicalWasteReagentBagRequest,
  MedicalWastePrintSpecimenBatchResult,
  MedicalWasteReagentBagView,
  MedicalWasteSpecimenLabelView,
  MedicalWasteSpecimenPreviewRequest,
} from '../types/operation-support';

export const MEDICAL_WASTE_PERIOD_OPTIONS = [
  { label: '上午', value: 'AM' },
  { label: '下午', value: 'PM' },
] as const;

export const MEDICAL_WASTE_REAGENT_TYPE_OPTIONS = [
  { label: '药物性废物', value: 'DRUG' },
  { label: '化学性废物', value: 'CHEMICAL' },
] as const;

function escapeHtml(value: null | string | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatOptionLabel(
  options: readonly { label: string; value: string }[],
  value?: null | string,
) {
  return options.find((item) => item.value === value)?.label ?? value ?? '-';
}

export function formatMedicalWastePeriod(value?: null | string) {
  return formatOptionLabel(MEDICAL_WASTE_PERIOD_OPTIONS, value);
}

export function formatMedicalWasteReagentType(value?: null | string) {
  return formatOptionLabel(MEDICAL_WASTE_REAGENT_TYPE_OPTIONS, value);
}

export function validateMedicalWasteSpecimenPreviewRequest(
  request: MedicalWasteSpecimenPreviewRequest,
) {
  if (!request.bagName?.trim()) {
    return '请填写回收袋名称';
  }
  if (!request.grossingOperatorName?.trim()) {
    return '请选择取材人姓名';
  }
  if (!request.grossingStationName?.trim()) {
    return '请选择取材台';
  }
  if (!request.grossingDate?.trim()) {
    return '请选择业务日期';
  }
  if (!request.grossingPeriod?.trim()) {
    return '请选择取材时间段';
  }
  return '';
}

export function validateMedicalWasteReagentBagRequest(
  request: CreateMedicalWasteReagentBagRequest,
) {
  if (!request.bagName?.trim()) {
    return '请填写名称';
  }
  if (!request.wasteType?.trim()) {
    return '请选择种类';
  }
  return '';
}

function buildSpecimenLabelRows(labels: MedicalWasteSpecimenLabelView[]) {
  if (labels.length === 0) {
    return `
      <tr>
        <td colspan="4" class="empty">暂无标签明细</td>
      </tr>
    `;
  }

  return labels
    .map(
      (label) => `
        <tr>
          <td>${escapeHtml(label.patientId || '-')}</td>
          <td>${escapeHtml(label.patientName || '-')}</td>
          <td>${escapeHtml(label.pathologyNo || '-')}</td>
          <td>${escapeHtml(label.specimenName || '-')}</td>
        </tr>
      `,
    )
    .join('');
}

function createPrintDocument(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        color: #111827;
        font-family: "Microsoft YaHei", sans-serif;
        margin: 0;
        padding: 24px;
      }
      .sheet {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }
      .title {
        font-size: 20px;
        font-weight: 700;
      }
      .subtitle {
        color: #4b5563;
        font-size: 12px;
        margin-top: 4px;
      }
      .meta {
        display: grid;
        gap: 10px 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .meta-item {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 10px 12px;
      }
      .meta-label {
        color: #6b7280;
        font-size: 12px;
      }
      .meta-value {
        font-size: 14px;
        font-weight: 600;
        margin-top: 4px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        border: 1px solid #d1d5db;
        font-size: 12px;
        padding: 8px 10px;
        text-align: left;
      }
      th {
        background: #f3f4f6;
      }
      .empty {
        color: #6b7280;
        text-align: center;
      }
      @media print {
        body {
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    ${bodyHtml}
    <script>
      window.onload = function () {
        window.print();
      };
    </script>
  </body>
</html>`;
}

export function buildMedicalWasteSpecimenPrintHtml(
  result: MedicalWastePrintSpecimenBatchResult,
) {
  const batch = result.batch;
  return createPrintDocument(
    `人体标本标签-${batch.bagName}`,
    `
      <section class="sheet">
        <div class="header">
          <div>
            <div class="title">${escapeHtml(result.printTitle || '人体标本标签')}</div>
            <div class="subtitle">${escapeHtml(result.printSubtitle || '')}</div>
          </div>
          <div class="subtitle">${escapeHtml(batch.printedAt || '')}</div>
        </div>
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">回收袋名称</div>
            <div class="meta-value">${escapeHtml(batch.bagName)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">取材台</div>
            <div class="meta-value">${escapeHtml(batch.grossingStationName)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">取材人姓名</div>
            <div class="meta-value">${escapeHtml(batch.grossingOperatorName)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">标本数量</div>
            <div class="meta-value">${escapeHtml(String(batch.labelCount ?? 0))}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>病人ID</th>
              <th>病人姓名</th>
              <th>病理号</th>
              <th>标本名称</th>
            </tr>
          </thead>
          <tbody>${buildSpecimenLabelRows(result.labels)}</tbody>
        </table>
      </section>
    `,
  );
}

export function buildMedicalWasteReagentPrintHtml(
  bag: MedicalWasteReagentBagView,
) {
  return createPrintDocument(
    `药物试剂标签-${bag.bagName}`,
    `
      <section class="sheet">
        <div class="header">
          <div>
            <div class="title">药物试剂废物标签</div>
            <div class="subtitle">${escapeHtml(bag.createdInfo || '')}</div>
          </div>
          <div class="subtitle">${escapeHtml(bag.printedAt || bag.createdAt || '')}</div>
        </div>
        <div class="meta">
          <div class="meta-item">
            <div class="meta-label">名称</div>
            <div class="meta-value">${escapeHtml(bag.bagName)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">种类</div>
            <div class="meta-value">${escapeHtml(formatMedicalWasteReagentType(bag.wasteType))}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">重量(KG)</div>
            <div class="meta-value">${escapeHtml(String(bag.weightKg ?? '-'))}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">容量(ML)</div>
            <div class="meta-value">${escapeHtml(String(bag.volumeMl ?? '-'))}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">来源</div>
            <div class="meta-value">${escapeHtml(bag.source || '-')}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">备注</div>
            <div class="meta-value">${escapeHtml(bag.remarks || '-')}</div>
          </div>
        </div>
      </section>
    `,
  );
}

export function openMedicalWastePrintWindow(
  title: string,
  documentHtml: string,
) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(documentHtml);
  printWindow.document.close();
  printWindow.document.title = title;
  return true;
}
