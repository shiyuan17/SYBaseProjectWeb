import { afterEach, describe, expect, it } from 'vitest';

import {
  supportsAnchorDownload,
  supportsResizeObserver,
  supportsWindowOpen,
} from '../browser-capabilities';

const originalResizeObserver = globalThis.ResizeObserver;
const originalWindowOpen = window.open;

describe('browser-capabilities', () => {
  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    window.open = originalWindowOpen;
  });

  it('detects anchor download support in the browser environment', () => {
    expect(supportsAnchorDownload()).toBe(true);
  });

  it('returns false when ResizeObserver is unavailable', () => {
    globalThis.ResizeObserver = undefined as never;

    expect(supportsResizeObserver()).toBe(false);
  });

  it('returns false when window.open is unavailable', () => {
    window.open = undefined as never;

    expect(supportsWindowOpen()).toBe(false);
  });
});
