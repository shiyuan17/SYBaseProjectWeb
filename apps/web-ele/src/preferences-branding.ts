import type { DeepPartial } from '@vben-core/typings';

import type { Preferences } from '@vben/preferences';

import { getPreferences, updatePreferences } from '@vben/preferences';
import { StorageManager } from '@vben/utils';

const STORAGE_KEYS = {
  CUSTOM: 'preferences-custom',
  LOCALE: 'preferences-locale',
  MAIN: 'preferences',
  THEME: 'preferences-theme',
} as const;

const LEGACY_BRAND_LINK_KEYWORDS = ['doc.vben.pro', 'vben.pro'];
const LEGACY_BRAND_NAMES = ['Vben', 'Vben Admin', 'Vben Admin Ele'];
const LEGACY_LOGO_KEYWORDS = [
  '@vbenjs/static-source',
  'logo-v1.webp',
  'logo-syadmin.svg',
  'vben',
];

export const BRAND_LOGO_SOURCE = '/jwbl-logo.svg';
export const BRAND_NAME = '嘉维病理全流程管理系统';
export const LEGACY_PREFERENCES_NAMESPACE = 'vben-web-ele';

type PreferencesPatch = DeepPartial<Preferences>;

function clearLegacyPreferenceCache(cache: StorageManager) {
  Object.values(STORAGE_KEYS).forEach((storageKey) => {
    cache.removeItem(storageKey);
  });
}

function hasLegacyKeyword(
  value: null | string | undefined,
  keywords: string[],
) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();
  return keywords.some((keyword) => normalizedValue.includes(keyword));
}

function isLegacyBrandName(value: null | string | undefined) {
  if (typeof value !== 'string') {
    return false;
  }

  return LEGACY_BRAND_NAMES.includes(value.trim());
}

function isLegacyLogoSource(value: null | string | undefined) {
  return hasLegacyKeyword(value, LEGACY_LOGO_KEYWORDS);
}

export function buildPreferencesNamespace(
  namespacePrefix: string,
  appVersion: string,
  env: string,
) {
  return `${namespacePrefix}-${appVersion}-${env}`;
}

export function buildMigratedPreferences(
  legacyPreferences: Preferences,
): PreferencesPatch {
  const { name: _legacyName, ...appPreferences } = legacyPreferences.app;
  const {
    source: _legacyLogoSource,
    sourceDark: _legacyLogoSourceDark,
    ...logoPreferences
  } = legacyPreferences.logo;
  const {
    companyName: _legacyCompanyName,
    companySiteLink: _legacyCompanySiteLink,
    date,
    enable,
    icp,
    icpLink,
    settingShow,
  } = legacyPreferences.copyright;

  return {
    app: {
      ...appPreferences,
      name: BRAND_NAME,
    },
    breadcrumb: legacyPreferences.breadcrumb,
    copyright: {
      companyName: BRAND_NAME,
      companySiteLink: '',
      date,
      enable,
      icp,
      icpLink,
      settingShow,
    },
    footer: legacyPreferences.footer,
    header: legacyPreferences.header,
    logo: {
      ...logoPreferences,
      source: BRAND_LOGO_SOURCE,
      sourceDark: BRAND_LOGO_SOURCE,
    },
    navigation: legacyPreferences.navigation,
    shortcutKeys: legacyPreferences.shortcutKeys,
    sidebar: legacyPreferences.sidebar,
    tabbar: legacyPreferences.tabbar,
    theme: legacyPreferences.theme,
    transition: legacyPreferences.transition,
    widget: legacyPreferences.widget,
  };
}

export function getRuntimeBrandCorrectionPatch(
  currentPreferences: Preferences,
): null | PreferencesPatch {
  const patch: PreferencesPatch = {};

  if (isLegacyBrandName(currentPreferences.app.name)) {
    patch.app = {
      name: BRAND_NAME,
    };
  }

  if (
    isLegacyLogoSource(currentPreferences.logo.source) ||
    isLegacyLogoSource(currentPreferences.logo.sourceDark)
  ) {
    patch.logo = {
      source: BRAND_LOGO_SOURCE,
      sourceDark: BRAND_LOGO_SOURCE,
    };
  }

  if (
    isLegacyBrandName(currentPreferences.copyright.companyName) ||
    hasLegacyKeyword(
      currentPreferences.copyright.companySiteLink,
      LEGACY_BRAND_LINK_KEYWORDS,
    )
  ) {
    patch.copyright = {
      companyName: BRAND_NAME,
      companySiteLink: '',
    };
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function migrateLegacyPreferencesCache({
  currentNamespace,
  legacyNamespace,
}: {
  currentNamespace: string;
  legacyNamespace: string;
}) {
  if (
    !currentNamespace ||
    !legacyNamespace ||
    currentNamespace === legacyNamespace
  ) {
    return;
  }

  const currentCache = new StorageManager({ prefix: currentNamespace });
  const legacyCache = new StorageManager({ prefix: legacyNamespace });
  const currentPreferences = currentCache.getItem<PreferencesPatch>(
    STORAGE_KEYS.MAIN,
  );
  const legacyPreferences = legacyCache.getItem<Preferences>(STORAGE_KEYS.MAIN);
  const legacyLocale = legacyCache.getItem<Preferences['app']['locale']>(
    STORAGE_KEYS.LOCALE,
  );
  const legacyTheme = legacyCache.getItem<Preferences['theme']['mode']>(
    STORAGE_KEYS.THEME,
  );
  const legacyCustom = legacyCache.getItem<Record<string, unknown>>(
    STORAGE_KEYS.CUSTOM,
  );

  if (!currentPreferences && legacyPreferences) {
    currentCache.setItem(
      STORAGE_KEYS.MAIN,
      buildMigratedPreferences(legacyPreferences),
    );

    if (legacyLocale) {
      currentCache.setItem(STORAGE_KEYS.LOCALE, legacyLocale);
    }

    if (legacyTheme) {
      currentCache.setItem(STORAGE_KEYS.THEME, legacyTheme);
    }

    if (legacyCustom) {
      currentCache.setItem(STORAGE_KEYS.CUSTOM, legacyCustom);
    }
  }

  if (legacyPreferences || legacyLocale || legacyTheme || legacyCustom) {
    clearLegacyPreferenceCache(legacyCache);
  }
}

export function applyRuntimeBrandPreferenceCorrection() {
  const patch = getRuntimeBrandCorrectionPatch(getPreferences());

  if (patch) {
    updatePreferences(patch);
  }
}
