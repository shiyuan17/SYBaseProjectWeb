import type {
  ApplicationRegistrationWorkbenchRecord,
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

type BuildSpecimenPrintDocumentOptions = {
  context: WorkbenchSpecimenPrintContext;
  item: WorkbenchSpecimenItem;
};

type BuildSpecimenBatchPrintDocumentOptions = {
  context: WorkbenchSpecimenPrintContext;
  items: WorkbenchSpecimenItem[];
};

const LABEL_WIDTH_MM = 72;
const LABEL_HEIGHT_MM = 42;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatLabelTime(value: string) {
  const matched = value.match(
    /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})[ T](?<hour>\d{2}):(?<minute>\d{2})/,
  );

  if (!matched?.groups) {
    return value || '-';
  }

  const year = matched.groups.year ?? '';
  const month = matched.groups.month ?? '';
  const day = matched.groups.day ?? '';
  const hour = matched.groups.hour ?? '';
  const minute = matched.groups.minute ?? '';

  if (!year || !month || !day || !hour || !minute) {
    return value || '-';
  }

  return `${year.slice(-2)}-${month}-${day} ${hour}:${minute}`;
}

function buildPatientLine(context: WorkbenchSpecimenPrintContext) {
  return `${context.patientName}（${context.gender || '-'}）`;
}

function buildDateRoomLine(context: WorkbenchSpecimenPrintContext) {
  return `${formatLabelTime(context.surgeryTime)}  ${context.roomLabel || '-'}`;
}

function buildQrCodeImageUrl(value: string, size = 180) {
  const encodedValue = encodeURIComponent(value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodedValue}`;
}

function buildSpecimenQrCodeValue(
  context: WorkbenchSpecimenPrintContext,
  item: WorkbenchSpecimenItem,
) {
  if (item.barcode) {
    return item.barcode;
  }

  return JSON.stringify({
    applyDept: context.applyDept,
    idNo: context.idNo,
    patientName: context.patientName,
    roomLabel: context.roomLabel,
    specimenName: item.specimenName,
    specimenNo: item.specimenNo,
    specimenSite: item.specimenSite,
    surgeryTime: context.surgeryTime,
  });
}

function buildSpecimenLabelMarkup(
  context: WorkbenchSpecimenPrintContext,
  item: WorkbenchSpecimenItem,
) {
  const qrCodeImageUrl = buildQrCodeImageUrl(
    buildSpecimenQrCodeValue(context, item),
  );
  return `
    <section class="label">
      <div class="top">
        <div class="id-no">${escapeHtml(item.barcode || context.idNo || item.specimenNo)}</div>
        <img alt="二维码" class="qr" src="${qrCodeImageUrl}" />
      </div>
      <div class="line">${escapeHtml(context.applyDept || '-')}</div>
      <div class="line">${escapeHtml(buildPatientLine(context))}</div>
      <div class="line compact">${escapeHtml(buildDateRoomLine(context))}</div>
      <div class="specimen-name">${escapeHtml(item.specimenName || '-')}</div>
    </section>
  `;
}

function buildPrintShell(title: string, bodyHtml: string, pageStyle: string) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        background: #ffffff;
      }
      body {
        color: #111827;
      }
      ${pageStyle}
    </style>
  </head>
  <body>
    ${bodyHtml}
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
      window.addEventListener('afterprint', () => {
        window.close();
      });
    </script>
  </body>
</html>`;
}

export function buildSpecimenPrintDocument({
  context,
  item,
}: BuildSpecimenPrintDocumentOptions) {
  return buildSpecimenBatchPrintDocument({
    context,
    items: [item],
  });
}

export function buildSpecimenBatchPrintDocument({
  context,
  items,
}: BuildSpecimenBatchPrintDocumentOptions) {
  const normalizedItems = items.length > 0 ? items : [];
  const bodyHtml = normalizedItems
    .map((item, index) => {
      const isLast = index === normalizedItems.length - 1;
      return `
        <article class="sheet${isLast ? '' : ' sheet-break'}">
          ${buildSpecimenLabelMarkup(context, item)}
        </article>
      `;
    })
    .join('');

  return buildPrintShell(
    `标本标签打印 - ${normalizedItems[0]?.specimenNo ?? '批量'}`,
    bodyHtml || '<div class="empty">暂无可打印标本</div>',
    `
      @page {
        margin: 0;
        size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
      }
      .sheet {
        width: ${LABEL_WIDTH_MM}mm;
        height: ${LABEL_HEIGHT_MM}mm;
        overflow: hidden;
      }
      .sheet-break {
        page-break-after: always;
      }
      .label {
        width: 100%;
        height: 100%;
        padding: 2.2mm 2.4mm 2mm;
        display: grid;
        grid-template-rows: auto auto auto auto 1fr;
        row-gap: 1.1mm;
      }
      .top {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 14mm;
        align-items: start;
        column-gap: 2mm;
      }
      .id-no {
        font-size: 6.4mm;
        line-height: 1;
        letter-spacing: 0.15mm;
        word-break: break-all;
        padding-top: 0.4mm;
      }
      .qr {
        width: 14mm;
        height: 14mm;
        display: block;
      }
      .line {
        font-size: 4.6mm;
        line-height: 1.08;
        word-break: break-word;
      }
      .line.compact {
        font-size: 4.1mm;
        line-height: 1.08;
      }
      .specimen-name {
        font-size: 5.6mm;
        line-height: 1.1;
        font-weight: 600;
        word-break: break-word;
        align-self: start;
      }
      .empty {
        padding: 12mm;
        color: #6b7280;
        font-size: 4mm;
      }
    `,
  );
}

export function buildApplicationFormPrintDocument(
  record: ApplicationRegistrationWorkbenchRecord,
) {
  const patient = record.patientInfo;
  const applicationNo = patient.applicationNo || record.applicationId || '-';
  const qrCodeImageUrl = buildQrCodeImageUrl(applicationNo, 220);

  const bodyHtml = `
    <main class="application-ticket">
      <header class="header">
        <div>
          <div class="title">补打申请单</div>
          <div class="subtitle">申请单信息</div>
        </div>
        <div class="no">${escapeHtml(applicationNo)}</div>
      </header>
      <section class="content">
        <div class="fields">
          <div class="field">
            <div class="label">申请单号</div>
            <div class="value strong">${escapeHtml(applicationNo)}</div>
          </div>
          <div class="field">
            <div class="label">名称</div>
            <div class="value">${escapeHtml(patient.patientName || '-')}</div>
          </div>
          <div class="field">
            <div class="label">性别</div>
            <div class="value">${escapeHtml(patient.gender || '-')}</div>
          </div>
          <div class="field">
            <div class="label">年龄</div>
            <div class="value">${escapeHtml(patient.age || '-')}</div>
          </div>
        </div>
        <div class="qr-panel">
          <img alt="申请单二维码" class="qr" src="${qrCodeImageUrl}" />
          <div class="qr-label">二维码</div>
        </div>
      </section>
    </main>
  `;

  return buildPrintShell(
    `补打申请单 - ${applicationNo}`,
    bodyHtml,
    `
      @page {
        margin: 12mm;
        size: A4;
      }
      body {
        font-family: "SimHei", "Microsoft YaHei", "PingFang SC", sans-serif;
        color: #111827;
      }
      .application-ticket {
        display: flex;
        flex-direction: column;
        gap: 9mm;
        max-width: 148mm;
      }
      .header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 8mm;
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 3mm;
      }
      .title {
        font-size: 7mm;
        font-weight: 700;
      }
      .subtitle {
        margin-top: 1mm;
        font-size: 3.2mm;
        color: #6b7280;
      }
      .no {
        font-size: 6mm;
        font-weight: 700;
      }
      .content {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 38mm;
        gap: 8mm;
        align-items: start;
      }
      .fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 3mm 4mm;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 1mm;
        padding: 3mm;
        border: 1px solid #e5e7eb;
        border-radius: 2mm;
        min-height: 18mm;
      }
      .label {
        font-size: 3mm;
        color: #6b7280;
      }
      .value {
        font-size: 5mm;
        line-height: 1.35;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .value.strong {
        font-weight: 700;
      }
      .qr-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2mm;
        border: 1px solid #e5e7eb;
        border-radius: 2mm;
        padding: 3mm;
      }
      .qr {
        width: 32mm;
        height: 32mm;
        display: block;
      }
      .qr-label {
        font-size: 3.2mm;
        color: #6b7280;
      }
    `,
  );
}
