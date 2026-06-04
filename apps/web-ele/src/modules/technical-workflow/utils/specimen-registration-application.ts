import { APPLICATION_TYPE_OPTIONS } from '#/modules/specimen-workflow/constants';

type PathologyNoDatePattern = 'YY' | 'YYYYMMDD';

interface PathologyNoRule {
  datePattern: PathologyNoDatePattern;
  prefix: string;
  sequenceLength: number;
}

const DEFAULT_APPLICATION_TYPE = 'ROUTINE';
const DEFAULT_REFERENCE_DATE = '2026-01-01';
const DEFAULT_SEQUENCE_VALUE = 1;
export const TECHNICAL_REGISTRATION_CONSULTATION_APPLICATION_TYPES = [
  'CONSULTATION',
  'CYTOLOGY_CONSULTATION',
  'DIFFICULT_CONSULTATION',
] as const;
const DEFAULT_PATHOLOGY_NO_RULE: PathologyNoRule = {
  datePattern: 'YYYYMMDD',
  prefix: 'BL',
  sequenceLength: 4,
};

const pathologyNoRules: Record<string, PathologyNoRule> = {
  CONSULTATION: { datePattern: 'YY', prefix: 'HZ', sequenceLength: 5 },
  CYTOLOGY: { datePattern: 'YY', prefix: 'XB', sequenceLength: 5 },
  CYTOLOGY_CONSULTATION: { datePattern: 'YY', prefix: 'XH', sequenceLength: 5 },
  CYTOLOGY_SMEAR: { datePattern: 'YY', prefix: 'GP', sequenceLength: 5 },
  DIFFICULT_CONSULTATION: {
    datePattern: 'YY',
    prefix: 'YN',
    sequenceLength: 5,
  },
  ELECTRON_MICROSCOPY: { datePattern: 'YY', prefix: 'EM', sequenceLength: 5 },
  FISH: { datePattern: 'YY', prefix: 'FISH', sequenceLength: 5 },
  FROZEN: { datePattern: 'YYYYMMDD', prefix: 'BD', sequenceLength: 4 },
  GENE_TEST: { datePattern: 'YY', prefix: 'JY', sequenceLength: 5 },
  GYNECOLOGY_LBC_CYTOLOGY: {
    datePattern: 'YY',
    prefix: 'FY',
    sequenceLength: 5,
  },
  GYNECOLOGY_LBC_DNA: { datePattern: 'YY', prefix: 'FD', sequenceLength: 5 },
  GYNECOLOGY_LBC_HPV: { datePattern: 'YY', prefix: 'FH', sequenceLength: 5 },
  HPV: { datePattern: 'YY', prefix: 'HPV', sequenceLength: 5 },
  IHC: { datePattern: 'YY', prefix: 'IH', sequenceLength: 5 },
  IMMUNE_FLUORESCENCE: { datePattern: 'YY', prefix: 'IF', sequenceLength: 5 },
  LIVER_BIOPSY: { datePattern: 'YY', prefix: 'GC', sequenceLength: 5 },
  MOLECULAR_PATHOLOGY: { datePattern: 'YY', prefix: 'FZ', sequenceLength: 5 },
  NGS: { datePattern: 'YY', prefix: 'NGS', sequenceLength: 5 },
  NON_GYNECOLOGY_LBC_CYTOLOGY: {
    datePattern: 'YY',
    prefix: 'NF',
    sequenceLength: 5,
  },
  PUNCTURE_BIOPSY: { datePattern: 'YY', prefix: 'CC', sequenceLength: 5 },
  RAPID: { datePattern: 'YY', prefix: 'KS', sequenceLength: 5 },
  RESEARCH: { datePattern: 'YY', prefix: 'KY', sequenceLength: 5 },
  ROUTINE: DEFAULT_PATHOLOGY_NO_RULE,
  SUPPLEMENTAL_REPORT: { datePattern: 'YY', prefix: 'MS', sequenceLength: 5 },
  TECHNICAL_ORDER: { datePattern: 'YY', prefix: 'JS', sequenceLength: 5 },
};

const applicationTypeAliasMap = new Map<string, string>(
  APPLICATION_TYPE_OPTIONS.flatMap((option) => [
    [option.value.toUpperCase(), option.value],
    [option.label.toUpperCase(), option.value],
  ]),
);

function normalizeApplicationType(value?: null | string) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return DEFAULT_APPLICATION_TYPE;
  }

  return (
    applicationTypeAliasMap.get(normalizedValue.toUpperCase()) ??
    normalizedValue
  );
}

function resolveRule(value?: null | string) {
  const normalizedType = normalizeApplicationType(value);
  return pathologyNoRules[normalizedType] ?? DEFAULT_PATHOLOGY_NO_RULE;
}

function escapeRegExp(value: string) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function matchesPathologyNoRule(value: string, rule: PathologyNoRule) {
  const dateLength = rule.datePattern === 'YY' ? 2 : 8;
  const pattern = new RegExp(
    String.raw`^${escapeRegExp(rule.prefix)}\d{${dateLength}}\d{${rule.sequenceLength}}$`,
    'i',
  );
  return pattern.test(value.trim());
}

function parseReferenceDate(value?: null | string) {
  const source = value?.trim() || DEFAULT_REFERENCE_DATE;
  const matched = /^(\d{4})[-/]?(\d{2})[-/]?(\d{2})/.exec(source);
  if (!matched) {
    return DEFAULT_REFERENCE_DATE.replaceAll('-', '');
  }

  return `${matched[1]}${matched[2]}${matched[3]}`;
}

function formatDatePart(
  value: null | string | undefined,
  datePattern: PathologyNoDatePattern,
) {
  const dateText = parseReferenceDate(value);
  return datePattern === 'YY' ? dateText.slice(2, 4) : dateText;
}

function resolveSequence(existingPathologyNo: null | string | undefined) {
  const normalizedPathologyNo = existingPathologyNo?.trim().toUpperCase();
  if (!normalizedPathologyNo) {
    return DEFAULT_SEQUENCE_VALUE;
  }

  const routineMatched = /^[A-Z]+(?:\d{8})(\d{4})$/.exec(normalizedPathologyNo);
  const shortMatched = /^[A-Z]+(?:\d{2})(\d{5})$/.exec(normalizedPathologyNo);
  const fallbackMatched = /(\d{1,5})$/.exec(normalizedPathologyNo);
  const sequenceText =
    routineMatched?.[1] ?? shortMatched?.[1] ?? fallbackMatched?.[1] ?? '';
  const parsedValue = Number.parseInt(sequenceText, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : DEFAULT_SEQUENCE_VALUE;
}

export function resolveTechnicalRegistrationApplicationType(
  value?: null | string,
) {
  return normalizeApplicationType(value);
}

export function isTechnicalRegistrationConsultationApplicationType(
  value?: null | string,
) {
  return TECHNICAL_REGISTRATION_CONSULTATION_APPLICATION_TYPES.includes(
    resolveTechnicalRegistrationApplicationType(
      value,
    ) as (typeof TECHNICAL_REGISTRATION_CONSULTATION_APPLICATION_TYPES)[number],
  );
}

export function resolveTechnicalRegistrationPathologyNo(params: {
  applicationType?: null | string;
  existingPathologyNo?: null | string;
  referenceDate?: null | string;
  sourceApplicationType?: null | string;
}) {
  const normalizedType = normalizeApplicationType(params.applicationType);
  const rule = resolveRule(normalizedType);
  const normalizedPathologyNo = params.existingPathologyNo?.trim();

  if (
    normalizedPathologyNo &&
    matchesPathologyNoRule(normalizedPathologyNo, rule)
  ) {
    return normalizedPathologyNo;
  }

  const datePart = formatDatePart(params.referenceDate, rule.datePattern);
  const sequence = String(resolveSequence(params.existingPathologyNo)).padStart(
    rule.sequenceLength,
    '0',
  );
  return `${rule.prefix}${datePart}${sequence}`;
}

export function isTechnicalRegistrationPathologyNoPreview(params: {
  applicationType?: null | string;
  existingPathologyNo?: null | string;
  sourceApplicationType?: null | string;
}) {
  if (!params.existingPathologyNo?.trim()) {
    return true;
  }

  const rule = resolveRule(params.applicationType);
  return !matchesPathologyNoRule(params.existingPathologyNo, rule);
}
