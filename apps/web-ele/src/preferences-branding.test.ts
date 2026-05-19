import type { Preferences } from '@vben/preferences';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPreferences } from '../../../packages/@core/preferences/src/config';
import { StorageManager } from '../../../packages/@core/base/shared/src/cache/storage-manager';

function clonePreferences() {
  return structuredClone(defaultPreferences) as Preferences;
}

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    clear: vi.fn(() => {
      store.clear();
    }),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => [...store.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    get length() {
      return store.size;
    },
  };
}

describe('preferences-branding', () => {
  let brandingModule: typeof import('./preferences-branding');

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', createStorageMock());
    vi.stubGlobal('sessionStorage', createStorageMock());
    brandingModule = await import('./preferences-branding');
  });

  it('builds migrated preferences while preserving non-brand settings', () => {
    const legacyPreferences = clonePreferences();

    legacyPreferences.app.layout = 'header-nav';
    legacyPreferences.app.locale = 'en-US';
    legacyPreferences.app.name = 'Vben Admin Ele';
    legacyPreferences.logo.fit = 'cover';
    legacyPreferences.logo.source =
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp';
    legacyPreferences.logo.sourceDark =
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp';
    legacyPreferences.copyright.companyName = 'Vben';
    legacyPreferences.copyright.companySiteLink = 'https://doc.vben.pro';
    legacyPreferences.copyright.icp = '沪ICP备12345678号';
    legacyPreferences.theme.mode = 'light';

    const migratedPreferences =
      brandingModule.buildMigratedPreferences(legacyPreferences);

    expect(migratedPreferences.app?.name).toBe(brandingModule.BRAND_NAME);
    expect(migratedPreferences.app?.layout).toBe('header-nav');
    expect(migratedPreferences.app?.locale).toBe('en-US');
    expect(migratedPreferences.logo?.fit).toBe('cover');
    expect(migratedPreferences.logo?.source).toBe(
      brandingModule.BRAND_LOGO_SOURCE,
    );
    expect(migratedPreferences.logo?.sourceDark).toBe(
      brandingModule.BRAND_LOGO_SOURCE,
    );
    expect(migratedPreferences.copyright?.companyName).toBe(
      brandingModule.BRAND_NAME,
    );
    expect(migratedPreferences.copyright?.companySiteLink).toBe('');
    expect(migratedPreferences.copyright?.icp).toBe('沪ICP备12345678号');
    expect(migratedPreferences.theme?.mode).toBe('light');
  });

  it('creates a brand correction patch for stale brand values', () => {
    const legacyPreferences = clonePreferences();

    legacyPreferences.app.name = 'Vben Admin';
    legacyPreferences.logo.source = '/assets/vben-logo-v1.webp';
    legacyPreferences.logo.sourceDark = '/assets/vben-logo-v1.webp';
    legacyPreferences.copyright.companyName = 'Vben';
    legacyPreferences.copyright.companySiteLink = 'https://vben.pro';

    expect(
      brandingModule.getRuntimeBrandCorrectionPatch(legacyPreferences),
    ).toEqual({
      app: {
        name: brandingModule.BRAND_NAME,
      },
      copyright: {
        companyName: brandingModule.BRAND_NAME,
        companySiteLink: '',
      },
      logo: {
        source: brandingModule.BRAND_LOGO_SOURCE,
        sourceDark: brandingModule.BRAND_LOGO_SOURCE,
      },
    });
  });

  it('migrates legacy namespace cache and clears old keys', () => {
    const legacyNamespace = 'vben-web-ele-5.7.0-dev';
    const currentNamespace = '嘉维病理全流程管理系统-web-ele-5.7.0-dev';
    const legacyCache = new StorageManager({ prefix: legacyNamespace });
    const currentCache = new StorageManager({ prefix: currentNamespace });
    const legacyPreferences = clonePreferences();

    legacyPreferences.app.name = 'Vben Admin Ele';
    legacyPreferences.app.locale = 'en-US';
    legacyPreferences.app.layout = 'mixed-nav';
    legacyPreferences.logo.source =
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp';
    legacyPreferences.logo.sourceDark =
      'https://unpkg.com/@vbenjs/static-source@0.1.7/source/logo-v1.webp';
    legacyPreferences.copyright.companyName = 'Vben';
    legacyPreferences.theme.mode = 'light';

    legacyCache.setItem('preferences', legacyPreferences);
    legacyCache.setItem('preferences-locale', 'en-US');
    legacyCache.setItem('preferences-theme', 'light');
    legacyCache.setItem('preferences-custom', { density: 'compact' });

    brandingModule.migrateLegacyPreferencesCache({
      currentNamespace,
      legacyNamespace,
    });

    const migratedPreferences = currentCache.getItem<Preferences>('preferences');

    expect(migratedPreferences?.app.name).toBe(brandingModule.BRAND_NAME);
    expect(migratedPreferences?.app.locale).toBe('en-US');
    expect(migratedPreferences?.app.layout).toBe('mixed-nav');
    expect(migratedPreferences?.logo.source).toBe(
      brandingModule.BRAND_LOGO_SOURCE,
    );
    expect(migratedPreferences?.copyright.companyName).toBe(
      brandingModule.BRAND_NAME,
    );
    expect(currentCache.getItem('preferences-theme')).toBe('light');
    expect(currentCache.getItem('preferences-locale')).toBe('en-US');
    expect(currentCache.getItem('preferences-custom')).toEqual({
      density: 'compact',
    });
    expect(legacyCache.getItem('preferences')).toBeNull();
    expect(legacyCache.getItem('preferences-theme')).toBeNull();
    expect(legacyCache.getItem('preferences-locale')).toBeNull();
    expect(legacyCache.getItem('preferences-custom')).toBeNull();
  });
});
