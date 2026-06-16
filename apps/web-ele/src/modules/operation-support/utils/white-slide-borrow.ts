import type {
  CreateWhiteSlideLoanRequest,
  ReturnWhiteSlideLoanRequest,
  WhiteSlideLoanView,
  WhiteSlideStockView,
} from '../types/operation-support';

export type WhiteSlideBorrowFormState = {
  amount: null | number;
  borrowerIdentityNo: string;
  borrowerName: string;
  borrowerPhone: string;
  borrowerUnit: string;
  caseId: string;
  embeddingBoxNo: string;
  pathologyNo: string;
  patientName: string;
  quantity: number;
  remarks: string;
  saveDirectPrint: boolean;
  slicePurpose: string;
  sliceThickness: string;
  stockId: string;
  stockNo: string;
  terminalCode: string;
  unitPrice: null | number;
  waxBlockUsage: string;
};

export type WhiteSlideReturnFormState = {
  remarks: string;
  terminalCode: string;
};

function optionalNumber(value: null | number) {
  return value === null || Number.isNaN(value) ? undefined : value;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function escapeHtml(value?: null | number | string) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createWhiteSlideBorrowFormDefaults(): WhiteSlideBorrowFormState {
  return {
    amount: null,
    borrowerIdentityNo: '',
    borrowerName: '',
    borrowerPhone: '',
    borrowerUnit: '',
    caseId: '',
    embeddingBoxNo: '',
    pathologyNo: '',
    patientName: '',
    quantity: 1,
    remarks: '',
    saveDirectPrint: false,
    slicePurpose: '',
    sliceThickness: '',
    stockId: '',
    stockNo: '',
    terminalCode: '',
    unitPrice: null,
    waxBlockUsage: '',
  };
}

export function createWhiteSlideReturnFormDefaults(): WhiteSlideReturnFormState {
  return {
    remarks: '',
    terminalCode: '',
  };
}

export function calculateWhiteSlideAmount(
  form: Pick<WhiteSlideBorrowFormState, 'quantity' | 'unitPrice'>,
) {
  if (form.unitPrice === null || Number.isNaN(form.unitPrice)) {
    return null;
  }
  return Number((form.unitPrice * form.quantity).toFixed(2));
}

export function applyWhiteSlideStockDefaults(
  form: WhiteSlideBorrowFormState,
  stock: null | WhiteSlideStockView,
) {
  form.stockId = stock?.id ?? '';
  form.stockNo = stock?.stockNo ?? '';
}

export function validateWhiteSlideBorrowForm(form: WhiteSlideBorrowFormState) {
  if (!form.stockId) {
    return '请选择白片库存';
  }
  if (!form.patientName.trim()) {
    return '请填写患者姓名';
  }
  if (!form.slicePurpose.trim()) {
    return '请填写切白片原因(用途)';
  }
  if (!form.sliceThickness.trim()) {
    return '请填写切白片厚度';
  }
  if (!form.borrowerName.trim()) {
    return '请填写借白片人姓名';
  }
  if (form.quantity <= 0) {
    return '切白片数量必须大于 0';
  }
  return '';
}

export function buildCreateWhiteSlideLoanRequest(
  form: WhiteSlideBorrowFormState,
): CreateWhiteSlideLoanRequest {
  return {
    amount: optionalNumber(form.amount),
    borrowerIdentityNo: optionalText(form.borrowerIdentityNo),
    borrowerName: form.borrowerName.trim(),
    borrowerPhone: optionalText(form.borrowerPhone),
    borrowerUnit: optionalText(form.borrowerUnit),
    caseId: optionalText(form.caseId),
    embeddingBoxNo: optionalText(form.embeddingBoxNo),
    pathologyNo: optionalText(form.pathologyNo),
    patientName: form.patientName.trim(),
    quantity: form.quantity,
    remarks: optionalText(form.remarks),
    saveDirectPrint: form.saveDirectPrint,
    slicePurpose: form.slicePurpose.trim(),
    sliceThickness: form.sliceThickness.trim(),
    stockId: form.stockId,
    terminalCode: optionalText(form.terminalCode),
    unitPrice: optionalNumber(form.unitPrice),
    waxBlockUsage: optionalText(form.waxBlockUsage),
  };
}

export function buildReturnWhiteSlideLoanRequest(
  form: WhiteSlideReturnFormState,
): ReturnWhiteSlideLoanRequest {
  return {
    remarks: optionalText(form.remarks),
    terminalCode: optionalText(form.terminalCode),
  };
}

export function buildWhiteSlideBorrowPrintHtml(loan: WhiteSlideLoanView) {
  const amount = loan.amount ?? '-';
  const unitPrice = loan.unitPrice ?? '-';

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(`白片借阅单-${loan.loanNo}`)}</title>
    <style>
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      body {
        margin: 0;
        color: #111827;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      .sheet {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .title {
        font-size: 20px;
        font-weight: 700;
        text-align: center;
      }
      .meta {
        display: grid;
        gap: 8px 12px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .meta-item {
        border: 1px solid #d1d5db;
        padding: 8px 10px;
      }
      .meta-label {
        color: #6b7280;
        font-size: 12px;
      }
      .meta-value {
        font-size: 14px;
        font-weight: 600;
        margin-top: 4px;
        word-break: break-all;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      th,
      td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        font-size: 12px;
        text-align: left;
        word-break: break-all;
      }
      th {
        background: #f8fafc;
      }
    </style>
  </head>
  <body>
    <section class="sheet">
      <div class="title">白片借阅单</div>
      <div class="meta">
        <div class="meta-item"><div class="meta-label">借阅单号</div><div class="meta-value">${escapeHtml(loan.loanNo)}</div></div>
        <div class="meta-item"><div class="meta-label">借阅日期</div><div class="meta-value">${escapeHtml(loan.loanedAt)}</div></div>
        <div class="meta-item"><div class="meta-label">检查号</div><div class="meta-value">${escapeHtml(loan.pathologyNo || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">患者姓名</div><div class="meta-value">${escapeHtml(loan.patientName || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">蜡块号</div><div class="meta-value">${escapeHtml(loan.embeddingBoxNo || '-')}</div></div>
        <div class="meta-item"><div class="meta-label">操作人</div><div class="meta-value">${escapeHtml(loan.operatorName || '-')}</div></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>数量</th>
            <th>厚度</th>
            <th>用途</th>
            <th>借片人姓名</th>
            <th>借片人单位</th>
            <th>借片人电话</th>
            <th>借片人身份证</th>
            <th>单价</th>
            <th>金额</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(loan.quantity)}</td>
            <td>${escapeHtml(loan.sliceThickness || '-')}</td>
            <td>${escapeHtml(loan.slicePurpose || '-')}</td>
            <td>${escapeHtml(loan.borrowerName)}</td>
            <td>${escapeHtml(loan.borrowerUnit || '-')}</td>
            <td>${escapeHtml(loan.borrowerPhone || '-')}</td>
            <td>${escapeHtml(loan.borrowerIdentityNo || '-')}</td>
            <td>${escapeHtml(unitPrice)}</td>
            <td>${escapeHtml(amount)}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;
}

export function buildDraftWhiteSlideLoanView(
  form: WhiteSlideBorrowFormState,
): WhiteSlideLoanView {
  return {
    amount: form.amount,
    borrowerIdentityNo: form.borrowerIdentityNo || null,
    borrowerName: form.borrowerName,
    borrowerPhone: form.borrowerPhone || null,
    borrowerUnit: form.borrowerUnit || null,
    caseId: form.caseId || null,
    embeddingBoxNo: form.embeddingBoxNo || null,
    id: 'DRAFT',
    loanNo: '预览',
    loanStatus: 'BORROWED',
    loanedAt: new Date().toISOString(),
    operatorName: '',
    pathologyNo: form.pathologyNo || null,
    patientName: form.patientName || null,
    quantity: form.quantity,
    remarks: form.remarks || null,
    returnedAt: null,
    returnedByName: null,
    saveDirectPrint: form.saveDirectPrint,
    slicePurpose: form.slicePurpose || null,
    sliceThickness: form.sliceThickness || null,
    stockCode: '',
    stockId: form.stockId,
    stockNo: form.stockNo,
    unitPrice: form.unitPrice,
    waxBlockUsage: form.waxBlockUsage || null,
  };
}

export function openWhiteSlideBorrowPrintWindow(loan: WhiteSlideLoanView) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(buildWhiteSlideBorrowPrintHtml(loan));
  printWindow.document.close();
  printWindow.document.title = `白片借阅单-${loan.loanNo}`;
  return true;
}
