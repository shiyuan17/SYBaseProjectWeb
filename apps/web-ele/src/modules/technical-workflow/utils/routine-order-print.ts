import type { MedicalOrderSlidePrintLabel } from '../../doctor-workflow/types/doctor-workflow';

function escapePrintText(value: null | number | string | undefined) {
  return String(value ?? '-')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildRoutineOrderPrintDocument(
  labels: MedicalOrderSlidePrintLabel[],
) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>常规医嘱玻片打印</title>
    <style>
      @page { margin: 0; size: 72mm 42mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SimHei", "Microsoft YaHei", sans-serif;
        color: #111827;
      }
      .slide-label {
        width: 72mm;
        height: 42mm;
        padding: 3mm;
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        gap: 1.1mm;
        page-break-after: always;
      }
      .slide-label:last-child {
        page-break-after: auto;
      }
      .primary {
        font-size: 6mm;
        font-weight: 700;
        line-height: 1.1;
        word-break: break-all;
      }
      .line {
        font-size: 4mm;
        line-height: 1.15;
        word-break: break-word;
      }
      .name {
        font-size: 4.8mm;
        font-weight: 700;
        line-height: 1.15;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    ${labels
      .map(
        (label) => `
    <section class="slide-label">
      <div class="primary">${escapePrintText(label.slideNo)}</div>
      <div class="line">病理号：${escapePrintText(label.pathologyNo)}</div>
      <div class="line">蜡块号：${escapePrintText(label.blockNo ?? label.specimenNo)}</div>
      <div class="line">患者：${escapePrintText(label.patientName)} / ${escapePrintText(label.patientIdDisplay ?? label.patientId)}</div>
      <div class="name">${escapePrintText(label.checkItem)}</div>
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

export function openRoutineOrderPrintWindow(
  labels: MedicalOrderSlidePrintLabel[],
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(buildRoutineOrderPrintDocument(labels));
  printWindow.document.close();
  return true;
}
