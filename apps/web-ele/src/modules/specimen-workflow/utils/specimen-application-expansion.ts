import type {
  SpecimenManagementListItem,
  SpecimenManagementListPage,
  SpecimenManagementListQuery,
} from '../types/specimen-workflow';

export type ExpandedSpecimenQueryMode = 'default' | 'expanded';

export type ExpandedSpecimenQueryResult = {
  applicationNo: null | string;
  initialItems: SpecimenManagementListItem[];
  items: SpecimenManagementListItem[];
  matchedSpecimen: null | SpecimenManagementListItem;
  mode: ExpandedSpecimenQueryMode;
};

type ListSpecimensLoader = (
  params: SpecimenManagementListQuery,
) => Promise<SpecimenManagementListPage>;

function normalizeText(value?: null | string) {
  return value?.trim() ?? '';
}

export function resolveExactSpecimenMatches(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const normalizedKeyword = normalizeText(keyword).toLowerCase();
  if (!normalizedKeyword) {
    return [];
  }

  return items.filter((item) =>
    [item.specimenId, item.specimenNo, item.barcode].some(
      (value) => normalizeText(value).toLowerCase() === normalizedKeyword,
    ),
  );
}

export function resolveSingleExactSpecimenMatch(
  items: SpecimenManagementListItem[],
  keyword: string,
) {
  const exactMatches = resolveExactSpecimenMatches(items, keyword);
  return exactMatches.length === 1 ? (exactMatches[0] ?? null) : null;
}

export async function loadSpecimensWithApplicationExpansion(options: {
  keyword?: null | string;
  listSpecimens: ListSpecimensLoader;
  maxQuerySize: number;
}) {
  const normalizedKeyword = normalizeText(options.keyword);
  const initialResult = await options.listSpecimens({
    keyword: normalizedKeyword || undefined,
    page: 1,
    size: options.maxQuerySize,
  });
  const matchedSpecimen = normalizedKeyword
    ? resolveSingleExactSpecimenMatch(initialResult.items, normalizedKeyword)
    : null;
  const applicationNo = normalizeText(matchedSpecimen?.applicationNo);

  if (!matchedSpecimen || !applicationNo) {
    return {
      applicationNo: null,
      initialItems: initialResult.items,
      items: initialResult.items,
      matchedSpecimen,
      mode: 'default',
    } satisfies ExpandedSpecimenQueryResult;
  }

  const expandedResult = await options.listSpecimens({
    applicationNo,
    page: 1,
    size: options.maxQuerySize,
  });

  return {
    applicationNo,
    initialItems: initialResult.items,
    items: expandedResult.items,
    matchedSpecimen,
    mode: 'expanded',
  } satisfies ExpandedSpecimenQueryResult;
}
