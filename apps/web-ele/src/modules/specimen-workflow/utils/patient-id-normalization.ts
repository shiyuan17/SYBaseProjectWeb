const LEGACY_GENERATED_PATIENT_ID_NO_PATTERN = /^ID(\d{5})$/;

export function normalizeLegacyGeneratedPatientIdNo<
  T extends null | string | undefined,
>(value: T): T {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();
  const match = LEGACY_GENERATED_PATIENT_ID_NO_PATTERN.exec(normalizedValue);

  return (match ? match[1] : value) as T;
}
