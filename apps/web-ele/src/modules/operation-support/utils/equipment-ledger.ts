import type {
  CreateEquipmentMaintenanceLogRequest,
  CreateEquipmentRecordRequest,
  EquipmentRecordView,
  UpdateEquipmentRecordRequest,
} from '../types/operation-support';

export type EquipmentFormState = {
  commonlyUsed: boolean;
  commonShutdownTime: string;
  commonStartupTime: string;
  commonUsageContent: string;
  currentTemperature: null | number;
  depreciationMethod: string;
  enabledAt: string;
  equipmentCategory: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentStatus: string;
  factoryNo: string;
  ipAddress: string;
  locationDescription: string;
  managementCode: string;
  managementUnit: string;
  manufacturer: string;
  modelNo: string;
  nextMaintenanceAt: string;
  operatorName: string;
  portNo: string;
  price: null | number;
  principalCode: string;
  principalName: string;
  productionDate: string;
  purchaseDate: string;
  purchaserCode: string;
  purchaserName: string;
  quantity: null | number;
  remarks: string;
  rfid: string;
  serviceLifeYears: null | number;
  setTemperature: null | number;
  userName: string;
  useUnit: string;
  warrantyEndDate: string;
};

export type MaintenanceLogFormState = {
  description: string;
  maintenanceStatus: string;
  maintenanceType: string;
  nextMaintenanceAt: string;
  operatorName: string;
  performedAt: string;
  remarks: string;
};

export type EquipmentTableColumn = {
  key: string;
  label: string;
};

export const EQUIPMENT_EXPORT_COLUMNS: EquipmentTableColumn[] = [
  { key: 'index', label: '序' },
  { key: 'equipmentCode', label: '资产编号' },
  { key: 'equipmentName', label: '设备名称' },
  { key: 'managementCode', label: '归口编号' },
  { key: 'modelNo', label: '机型' },
  { key: 'quantity', label: '设备数量' },
  { key: 'equipmentStatus', label: '状态' },
  { key: 'equipmentCategory', label: '仪器类型' },
  { key: 'factoryNo', label: '出厂编号' },
  { key: 'serviceLifeYears', label: '使用年限' },
  { key: 'depreciationMethod', label: '折旧方法' },
  { key: 'enabledAt', label: '启用日期' },
  { key: 'productionDate', label: '出厂日期' },
  { key: 'commonlyUsed', label: '是否常用' },
  { key: 'managementUnit', label: '归口单位' },
  { key: 'userName', label: '使用人姓名' },
  { key: 'purchaseDate', label: '购置日期' },
  { key: 'price', label: '金额' },
  { key: 'locationDescription', label: '存放地点' },
  { key: 'purchaserName', label: '购置人姓名' },
  { key: 'purchaserCode', label: '购置人编号' },
  { key: 'principalCode', label: '负责人编号' },
  { key: 'principalName', label: '负责人姓名' },
  { key: 'useUnit', label: '使用单位' },
  { key: 'warrantyEndDate', label: '保修结束日期' },
  { key: 'manufacturer', label: '厂家' },
  { key: 'portNo', label: '端口号' },
  { key: 'ipAddress', label: 'IP地址' },
  { key: 'commonStartupTime', label: '常用开机时间' },
  { key: 'commonShutdownTime', label: '常用关机时间' },
  { key: 'commonUsageContent', label: '常用使用内容' },
  { key: 'setTemperature', label: '设置温度(℃)' },
  { key: 'currentTemperature', label: '当前温度(℃)' },
  { key: 'rfid', label: 'RFID' },
  { key: 'remarks', label: '备注' },
];

function optionalNumber(value: null | number) {
  return value === null || Number.isNaN(value) ? undefined : value;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatValue(
  row: EquipmentRecordView,
  key: string,
  index: number,
  formatters: {
    category: (value?: null | string) => string;
    nullable: (value?: null | number | string) => string;
    status: (value?: null | string) => string;
  },
) {
  switch (key) {
    case 'commonlyUsed': {
      return row.commonlyUsed ? '是' : '否';
    }
    case 'equipmentCategory': {
      return formatters.category(row.equipmentCategory);
    }
    case 'equipmentStatus': {
      return formatters.status(row.equipmentStatus);
    }
    case 'index': {
      return String(index + 1);
    }
    default: {
      return formatters.nullable(
        row[key as keyof EquipmentRecordView] as null | number | string,
      );
    }
  }
}

export function createEquipmentFormDefaults(
  operatorName: string,
): EquipmentFormState {
  return {
    commonShutdownTime: '18:00:00',
    commonStartupTime: '08:00:00',
    commonUsageContent: '',
    commonlyUsed: false,
    currentTemperature: 0,
    depreciationMethod: '',
    enabledAt: '',
    equipmentCategory: '',
    equipmentCode: '',
    equipmentName: '',
    equipmentStatus: 'ACTIVE',
    factoryNo: '',
    ipAddress: '',
    locationDescription: '',
    managementCode: '',
    managementUnit: '',
    manufacturer: '',
    modelNo: '',
    nextMaintenanceAt: '',
    operatorName,
    portNo: '',
    price: null,
    principalCode: '',
    principalName: '',
    productionDate: '',
    purchaseDate: '',
    purchaserCode: '',
    purchaserName: '',
    quantity: 1,
    remarks: '',
    rfid: '',
    serviceLifeYears: 0,
    setTemperature: 0,
    useUnit: '',
    userName: '',
    warrantyEndDate: '',
  };
}

export function createEquipmentFormStateFromRow(
  row: EquipmentRecordView,
  operatorName: string,
): EquipmentFormState {
  const currentTemperature =
    typeof row.currentTemperature === 'number'
      ? row.currentTemperature
      : Number(row.currentTemperature || 0);
  const setTemperature =
    typeof row.setTemperature === 'number'
      ? row.setTemperature
      : Number(row.setTemperature || 0);
  let price = null;
  if (typeof row.price === 'number') {
    price = row.price;
  } else if (row.price) {
    price = Number(row.price);
  }

  return {
    commonShutdownTime: row.commonShutdownTime ?? '18:00:00',
    commonStartupTime: row.commonStartupTime ?? '08:00:00',
    commonUsageContent: row.commonUsageContent ?? '',
    commonlyUsed: row.commonlyUsed ?? false,
    currentTemperature,
    depreciationMethod: row.depreciationMethod ?? '',
    enabledAt: row.enabledAt ?? '',
    equipmentCategory: row.equipmentCategory ?? '',
    equipmentCode: row.equipmentCode,
    equipmentName: row.equipmentName,
    equipmentStatus: row.equipmentStatus,
    factoryNo: row.factoryNo ?? '',
    ipAddress: row.ipAddress ?? '',
    locationDescription: row.locationDescription ?? '',
    managementCode: row.managementCode ?? '',
    managementUnit: row.managementUnit ?? '',
    manufacturer: row.manufacturer ?? '',
    modelNo: row.modelNo ?? '',
    nextMaintenanceAt: row.nextMaintenanceAt ?? '',
    operatorName,
    portNo: row.portNo ?? '',
    price,
    principalCode: row.principalCode ?? '',
    principalName: row.principalName ?? '',
    productionDate: row.productionDate ?? '',
    purchaseDate: row.purchaseDate ?? '',
    purchaserCode: row.purchaserCode ?? '',
    purchaserName: row.purchaserName ?? '',
    quantity: row.quantity ?? 1,
    remarks: row.remarks ?? '',
    rfid: row.rfid ?? '',
    serviceLifeYears: row.serviceLifeYears ?? 0,
    setTemperature,
    useUnit: row.useUnit ?? '',
    userName: row.userName ?? '',
    warrantyEndDate: row.warrantyEndDate ?? '',
  };
}

export function createMaintenanceLogFormDefaults(
  operatorName: string,
): MaintenanceLogFormState {
  return {
    description: '',
    maintenanceStatus: 'COMPLETED',
    maintenanceType: 'MAINTENANCE',
    nextMaintenanceAt: '',
    operatorName,
    performedAt: '',
    remarks: '',
  };
}

export function createDraftEquipmentRecordView(): EquipmentRecordView {
  return {
    commonShutdownTime: null,
    commonStartupTime: null,
    commonUsageContent: null,
    commonlyUsed: false,
    currentTemperature: null,
    depreciationMethod: null,
    enabledAt: null,
    equipmentCategory: null,
    equipmentCode: '',
    equipmentName: '',
    equipmentStatus: 'ACTIVE',
    factoryNo: null,
    id: '',
    ipAddress: null,
    locationDescription: null,
    managementCode: null,
    managementUnit: null,
    manufacturer: null,
    modelNo: null,
    nextMaintenanceAt: null,
    portNo: null,
    price: null,
    principalCode: null,
    principalName: null,
    productionDate: null,
    purchaseDate: null,
    purchaserCode: null,
    purchaserName: null,
    quantity: null,
    remarks: null,
    rfid: null,
    serviceLifeYears: null,
    setTemperature: null,
    useUnit: null,
    userName: null,
    warrantyEndDate: null,
  };
}

export function getEquipmentStatusTagType(status?: null | string) {
  if (status === 'ACTIVE') {
    return 'success';
  }
  if (status === 'SCRAPPED' || status === 'SCRAPPED_DAMAGED') {
    return 'danger';
  }
  return 'info';
}

export function getEquipmentWarningTagType(type?: null | string) {
  if (type === 'OVERDUE') {
    return 'danger';
  }
  if (type === 'DUE_SOON') {
    return 'warning';
  }
  return 'info';
}

export function validateEquipmentForm(
  form: EquipmentFormState,
  isCreate: boolean,
) {
  if (!form.equipmentName || !form.equipmentStatus) {
    return '请填写设备名称和设备状态';
  }
  if (isCreate && !form.equipmentCode) {
    return '新增设备需要填写资产编号';
  }
  if (!form.equipmentCategory) {
    return '请选择仪器类型';
  }
  return '';
}

export function validateMaintenanceLogForm(options: {
  form: MaintenanceLogFormState;
  hasSelectedEquipment: boolean;
}) {
  if (!options.hasSelectedEquipment) {
    return '请先选择设备';
  }

  const form = options.form;
  if (!form.maintenanceType || !form.maintenanceStatus || !form.performedAt) {
    return '请填写维护类型、状态和执行时间';
  }
  return '';
}

export function buildCreateEquipmentRecordRequest(
  form: EquipmentFormState,
): CreateEquipmentRecordRequest {
  return {
    commonlyUsed: form.commonlyUsed,
    commonShutdownTime: optionalText(form.commonShutdownTime),
    commonStartupTime: optionalText(form.commonStartupTime),
    commonUsageContent: optionalText(form.commonUsageContent),
    currentTemperature: optionalNumber(form.currentTemperature),
    depreciationMethod: optionalText(form.depreciationMethod),
    enabledAt: optionalText(form.enabledAt),
    equipmentCategory: optionalText(form.equipmentCategory),
    equipmentCode: form.equipmentCode,
    equipmentName: form.equipmentName,
    equipmentStatus: form.equipmentStatus,
    factoryNo: optionalText(form.factoryNo),
    ipAddress: optionalText(form.ipAddress),
    locationDescription: optionalText(form.locationDescription),
    managementCode: optionalText(form.managementCode),
    managementUnit: optionalText(form.managementUnit),
    manufacturer: optionalText(form.manufacturer),
    modelNo: optionalText(form.modelNo),
    nextMaintenanceAt: optionalText(form.nextMaintenanceAt),
    portNo: optionalText(form.portNo),
    price: optionalNumber(form.price),
    principalCode: optionalText(form.principalCode),
    principalName: optionalText(form.principalName),
    productionDate: optionalText(form.productionDate),
    purchaseDate: optionalText(form.purchaseDate),
    purchaserCode: optionalText(form.purchaserCode),
    purchaserName: optionalText(form.purchaserName),
    quantity: optionalNumber(form.quantity),
    remarks: optionalText(form.remarks),
    rfid: optionalText(form.rfid),
    serviceLifeYears: optionalNumber(form.serviceLifeYears),
    setTemperature: optionalNumber(form.setTemperature),
    useUnit: optionalText(form.useUnit),
    userName: optionalText(form.userName),
    warrantyEndDate: optionalText(form.warrantyEndDate),
  };
}

export function buildUpdateEquipmentRecordRequest(
  form: EquipmentFormState,
): UpdateEquipmentRecordRequest {
  return {
    ...buildCreateEquipmentRecordRequest(form),
  };
}

export function buildCreateMaintenanceLogRequest(
  form: MaintenanceLogFormState,
): CreateEquipmentMaintenanceLogRequest {
  return {
    description: optionalText(form.description),
    maintenanceStatus: form.maintenanceStatus,
    maintenanceType: form.maintenanceType,
    nextMaintenanceAt: optionalText(form.nextMaintenanceAt),
    performedAt: form.performedAt,
    remarks: optionalText(form.remarks),
  };
}

export function buildEquipmentExportDocument(options: {
  categoryFormatter: (value?: null | string) => string;
  nullableFormatter: (value?: null | number | string) => string;
  rows: EquipmentRecordView[];
  statusFormatter: (value?: null | string) => string;
}) {
  const tableRows = [
    EQUIPMENT_EXPORT_COLUMNS.map((column) => column.label),
    ...options.rows.map((row, index) =>
      EQUIPMENT_EXPORT_COLUMNS.map((column) =>
        formatValue(row, column.key, index, {
          category: options.categoryFormatter,
          nullable: options.nullableFormatter,
          status: options.statusFormatter,
        }),
      ),
    ),
  ];

  return `
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <table>
          ${tableRows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${String(cell ?? '')}</td>`).join('')}</tr>`,
            )
            .join('')}
        </table>
      </body>
    </html>
  `;
}

export function buildEquipmentPrintDocument(options: {
  categoryFormatter: (value?: null | string) => string;
  nullableFormatter: (value?: null | number | string) => string;
  rows: EquipmentRecordView[];
  statusFormatter: (value?: null | string) => string;
}) {
  const tableHead = EQUIPMENT_EXPORT_COLUMNS.map(
    (column) => `<th>${escapeHtml(column.label)}</th>`,
  ).join('');
  const tableBody = options.rows
    .map((row, index) => {
      const cells = EQUIPMENT_EXPORT_COLUMNS.map((column) =>
        escapeHtml(
          formatValue(row, column.key, index, {
            category: options.categoryFormatter,
            nullable: options.nullableFormatter,
            status: options.statusFormatter,
          }),
        ),
      );
      return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
    })
    .join('');

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>设备档案打印</title>
    <style>
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
      body {
        margin: 0;
        color: #111827;
        font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 18px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 11px;
      }
      th,
      td {
        border: 1px solid #cbd5e1;
        padding: 4px 6px;
        text-align: left;
        word-break: break-all;
      }
      th {
        background: #f8fafc;
      }
    </style>
  </head>
  <body>
    <h1>设备档案列表</h1>
    <table>
      <thead>
        <tr>${tableHead}</tr>
      </thead>
      <tbody>${tableBody}</tbody>
    </table>
    <script>
      window.addEventListener('load', () => {
        window.focus();
        window.print();
      });
    </script>
  </body>
</html>`;
}
