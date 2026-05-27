import type {
  WorkbenchSpecimenItem,
  WorkbenchSpecimenPrintContext,
} from '../types/application-registration-workbench';

type BuildSpecimenPrintDocumentOptions = {
  context: WorkbenchSpecimenPrintContext;
  item: WorkbenchSpecimenItem;
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

function buildQrCodeValue(
  context: WorkbenchSpecimenPrintContext,
  item: WorkbenchSpecimenItem,
) {
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

function buildQrCodeImageUrl(
  context: WorkbenchSpecimenPrintContext,
  item: WorkbenchSpecimenItem,
) {
  const encodedValue = encodeURIComponent(buildQrCodeValue(context, item));
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodedValue}`;
}

export async function buildSpecimenPrintDocument({
  context,
  item,
}: BuildSpecimenPrintDocumentOptions) {
  const qrCodeImageUrl = buildQrCodeImageUrl(context, item);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>标本标签预览 - ${escapeHtml(item.specimenNo)}</title>
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
        width: ${LABEL_WIDTH_MM}mm;
        height: ${LABEL_HEIGHT_MM}mm;
        overflow: hidden;
        background: #ffffff;
      }
      body {
        color: #111827;
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
      .preview-hint {
        font-size: 3.4mm;
        line-height: 1.1;
        color: #4b5563;
      }
      @page {
        margin: 0;
        size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
      }
    </style>
  </head>
  <body>
    <section class="label">
      <div class="top">
        <div class="id-no">${escapeHtml(context.idNo || item.specimenNo)}</div>
        <img alt="二维码" class="qr" src="${qrCodeImageUrl}" />
      </div>
      <div class="line">${escapeHtml(context.applyDept || '-')}</div>
      <div class="line">${escapeHtml(buildPatientLine(context))}</div>
      <div class="line compact">${escapeHtml(buildDateRoomLine(context))}</div>
      <div class="specimen-name">${escapeHtml(item.specimenName || '-')}</div>
      <div class="preview-hint">仅供预览，正式打印请先保存/确认登记。</div>
    </section>
  </body>
</html>`;
}
