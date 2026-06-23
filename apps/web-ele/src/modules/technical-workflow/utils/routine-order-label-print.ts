type RoutineOrderApplicationLabel = {
  applicationNo?: null | string;
  checkItem?: null | string;
  doctorTime?: null | string;
  doctorUser?: null | string;
  pathologyNo?: null | string;
  patientName?: null | string;
};

function escapePrintText(value: null | number | string | undefined) {
  return String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeLabelText(value?: null | string) {
  const trimmed = value?.trim();
  return trimmed || '-';
}

function renderLabelRow(label: string, value?: null | string) {
  return `<div class="label-row"><span class="label-key">${label}</span><span class="label-value">${escapePrintText(normalizeLabelText(value))}</span></div>`;
}

export function buildRoutineOrderApplicationLabelPrintDocument(
  rows: RoutineOrderApplicationLabel[],
) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>常规医嘱申请单标签打印</title>
    <style>
      @page { margin: 0; size: 96mm 54mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SimHei", "Microsoft YaHei", sans-serif;
        color: #111827;
        background: #ffffff;
      }
      .routine-order-label {
        width: 96mm;
        min-height: 54mm;
        padding: 4mm 4.5mm;
        display: flex;
        flex-direction: column;
        gap: 2.2mm;
        page-break-after: always;
      }
      .routine-order-label:last-child {
        page-break-after: auto;
      }
      .label-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 1.6mm;
        border-bottom: 0.3mm solid #111827;
      }
      .label-title {
        font-size: 5mm;
        font-weight: 700;
        letter-spacing: 0.2mm;
      }
      .label-tag {
        font-size: 3.2mm;
        color: #374151;
      }
      .label-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.4mm;
      }
      .label-row {
        display: grid;
        grid-template-columns: 20mm 1fr;
        align-items: start;
        gap: 1.6mm;
        font-size: 3.5mm;
        line-height: 1.35;
      }
      .label-key {
        color: #4b5563;
        white-space: nowrap;
      }
      .label-value {
        color: #111827;
        font-weight: 600;
        word-break: break-word;
      }
      .label-item {
        margin-top: 0.8mm;
        padding: 2mm 2.2mm;
        border: 0.3mm solid #d1d5db;
        border-radius: 1.2mm;
        background: #f9fafb;
      }
      .label-item .label-key {
        color: #111827;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    ${rows
      .map(
        (row) => `
    <section class="routine-order-label">
      <header class="label-header">
        <div class="label-title">申请单标签</div>
        <div class="label-tag">常规医嘱</div>
      </header>
      <div class="label-grid">
        ${renderLabelRow('申请单号：', row.applicationNo)}
        ${renderLabelRow('病理号：', row.pathologyNo)}
        ${renderLabelRow('患者姓名：', row.patientName)}
        ${renderLabelRow('开单时间：', row.doctorTime)}
        ${renderLabelRow('开单医生：', row.doctorUser)}
      </div>
      <div class="label-item">
        ${renderLabelRow('检查项目：', row.checkItem)}
      </div>
    </section>`,
      )
      .join('')}
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
    </scr${'ipt'}>
  </body>
</html>`;
}

export function openRoutineOrderApplicationLabelPrintWindow(
  rows: RoutineOrderApplicationLabel[],
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(
    buildRoutineOrderApplicationLabelPrintDocument(rows),
  );
  printWindow.document.close();
  return true;
}

export type { RoutineOrderApplicationLabel };
