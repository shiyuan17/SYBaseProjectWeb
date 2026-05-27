import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as capabilities from '../browser-capabilities';
import {
  downloadFileFromBlob,
  downloadFileFromUrl,
  resolveFileName,
  sanitizeFileName,
  triggerDownload,
} from '../download';

describe('download utils', () => {
  const originalCreateElement = document.createElement.bind(document);
  const originalWindowOpen = window.open;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.open = originalWindowOpen;
  });

  it('prefers the explicit file name and sanitizes invalid characters', () => {
    expect(resolveFileName('https://example.com/files/report.csv', 'a:b?.csv')).toBe(
      'a_b_.csv',
    );
    expect(sanitizeFileName('  测试 report.xlsx  ')).toBe('测试 report.xlsx');
  });

  it('derives and decodes the file name from the URL path', () => {
    expect(
      resolveFileName(
        'https://example.com/files/%E6%B5%8B%E8%AF%95%20report.xlsx?download=1',
      ),
    ).toBe('测试 report.xlsx');
  });

  it('triggers anchor downloads when the browser supports the download attribute', async () => {
    const anchor = originalCreateElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {});

    vi.spyOn(capabilities, 'supportsAnchorDownload').mockReturnValue(true);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return anchor;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    await downloadFileFromUrl({
      source: 'https://example.com/files/%E6%B5%8B%E8%AF%95%20report.xlsx',
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe('测试 report.xlsx');
  });

  it('falls back to window.open when anchor downloads are unavailable', async () => {
    vi.spyOn(capabilities, 'supportsAnchorDownload').mockReturnValue(false);
    vi.spyOn(capabilities, 'supportsWindowOpen').mockReturnValue(true);
    window.open = vi.fn(() => window);

    await downloadFileFromUrl({
      source: 'https://example.com/files/report.csv',
    });

    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/files/report.csv',
      '_blank',
      'noopener=yes,noreferrer=yes',
    );
  });

  it('only revokes object URLs created for blob downloads', () => {
    vi.spyOn(capabilities, 'supportsAnchorDownload').mockReturnValue(true);
    vi.spyOn(capabilities, 'supportsObjectUrl').mockReturnValue(true);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-download');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(
      () => {},
    );

    downloadFileFromBlob({
      fileName: 'report.xlsx',
      source: new Blob(['content'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    });
    triggerDownload('https://example.com/files/report.xlsx', 'report.xlsx');

    vi.advanceTimersByTime(100);

    expect(revokeSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-download');
  });
});
