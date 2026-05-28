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

function buildSpecimenLabelMarkup(
  context: WorkbenchSpecimenPrintContext,
  item: WorkbenchSpecimenItem,
) {
  const qrCodeImageUrl = buildQrCodeImageUrl(context, item);
  return `
    <section class="label">
      <div class="top">
        <div class="id-no">${escapeHtml(context.idNo || item.specimenNo)}</div>
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

function buildApplicationFormSection(title: string, rows: Array<[string, string]>) {
  const items = rows
    .map(
      ([label, value]) => `
        <div class="field">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(value || '-')}</div>
        </div>
      `,
    )
    .join('');

  return `
    <section class="section">
      <div class="section-title">${escapeHtml(title)}</div>
      <div class="grid">${items}</div>
    </section>
  `;
}

function formatBooleanText(value: boolean) {
  return value ? '是' : '否';
}

export function buildApplicationFormPrintDocument(
  record: ApplicationRegistrationWorkbenchRecord,
) {
  const patient = record.patientInfo;
  const surgery = record.surgeryInfo;
  const gynecology = record.gynecologyInfo;
  const specimenRows = record.specimenItems.length
    ? record.specimenItems
    : [{ id: '', quantity: 0, specimenName: '-', specimenNo: '-', specimenSite: '-', status: '-' }];

  const bodyHtml = `
    <main class="form">
      <header class="header">
        <div>
          <div class="title">申请单补打</div>
          <div class="subtitle">核心申请单内容</div>
        </div>
        <div class="no">${escapeHtml(patient.applicationNo || '-')}</div>
      </header>
      ${buildApplicationFormSection('患者信息', [
        ['患者', patient.patientName],
        ['性别/年龄', `${patient.gender || '-'} / ${patient.age || '-'}`],
        ['住院号', patient.inpatientNo || '-'],
        ['床号', patient.bedNo || '-'],
        ['病区', patient.wardName || '-'],
        ['申请科室', patient.applyDept || '-'],
        ['申请医生', patient.applyDoctor || '-'],
        ['联系电话', patient.phone || '-'],
        ['申请日期', patient.applicationDate || '-'],
      ])}
      ${buildApplicationFormSection('临床信息', [
        ['检查项目', patient.checkItem || '-'],
        ['临床病史', patient.clinicalHistory || '-'],
        ['影像结果', patient.imagingResult || '-'],
        ['临床诊断', patient.clinicalDiagnosis || '-'],
        ['内镜诊断', patient.endoscopyDiagnosis || '-'],
        ['备注', patient.remark || '-'],
      ])}
      ${buildApplicationFormSection('手术信息', [
        ['手术名称', surgery.surgeryName || '-'],
        ['手术楼/手术室', `${surgery.buildingId || '-'} / ${surgery.roomId || '-'}`],
        ['术中所见', surgery.clinicalFindings || '-'],
        ['标本固定时间', surgery.fixationTime || '-'],
        ['固定人员', surgery.fixationPerson || '-'],
        ['固定液类型', surgery.fixativeType || '-'],
      ])}
      ${buildApplicationFormSection('妇科信息', [
        ['是否绝经', formatBooleanText(gynecology.menopause)],
        ['末次月经', gynecology.lastMenstrualPeriod || '-'],
        ['HPV', gynecology.hpvResult || '-'],
        ['既往宫颈脱落细胞', gynecology.previousCytology || '-'],
        ['既往宫颈治疗史', gynecology.previousTreatment || '-'],
        ['补充说明', gynecology.additionalNotes || gynecology.specialConditions.other || '-'],
      ])}
      <section class="section">
        <div class="section-title">标本核心信息</div>
        <table class="table">
          <thead>
            <tr>
              <th>标本号</th>
              <th>名称</th>
              <th>部位</th>
              <th>数量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${specimenRows
              .map(
                (item) => `
                  <tr>
                    <td>${escapeHtml(item.specimenNo || '-')}</td>
                    <td>${escapeHtml(item.specimenName || '-')}</td>
                    <td>${escapeHtml(item.specimenSite || '-')}</td>
                    <td>${escapeHtml(String(item.quantity || 0))}</td>
                    <td>${escapeHtml(item.status || '-')}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </section>
    </main>
  `;

  return buildPrintShell(
    `申请单补打 - ${patient.applicationNo || '申请单'}`,
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
      .form {
        display: flex;
        flex-direction: column;
        gap: 8mm;
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
      .section {
        display: flex;
        flex-direction: column;
        gap: 3mm;
      }
      .section-title {
        font-size: 4.6mm;
        font-weight: 700;
        color: #111827;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2.4mm 4mm;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 1mm;
        padding: 2.4mm 3mm;
        border: 1px solid #e5e7eb;
        border-radius: 2mm;
        min-height: 15mm;
      }
      .label {
        font-size: 3mm;
        color: #6b7280;
      }
      .value {
        font-size: 3.8mm;
        line-height: 1.35;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
      }
      .table th,
      .table td {
        border: 1px solid #e5e7eb;
        padding: 2.5mm 2.8mm;
        font-size: 3.4mm;
        vertical-align: top;
        text-align: left;
      }
      .table th {
        background: #f9fafb;
        font-weight: 700;
      }
    `,
  );
}
