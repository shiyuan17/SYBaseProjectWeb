import {
  supportsAnchorDownload,
  supportsObjectUrl,
  supportsWindowOpen,
} from './browser-capabilities';

interface DownloadOptions<T = string> {
  fileName?: string;
  source: T;
  target?: string;
}

interface TriggerDownloadOptions {
  revokeDelay?: number;
  revokeObjectUrl?: boolean;
  target?: string;
}

const DEFAULT_FILENAME = 'downloaded_file';
const DOWNLOAD_ERROR_MESSAGE = 'Failed to download file.';

export async function downloadFileFromUrl({
  fileName,
  source,
  target = '_blank',
}: DownloadOptions): Promise<void> {
  if (!source || typeof source !== 'string') {
    throw new Error('Invalid URL.');
  }

  triggerDownload(source, resolveFileName(source, fileName), { target });
}

export function downloadFileFromBase64({ fileName, source }: DownloadOptions) {
  if (!source || typeof source !== 'string') {
    throw new Error('Invalid Base64 data.');
  }

  triggerDownload(source, fileName || DEFAULT_FILENAME);
}

export async function downloadFileFromImageUrl({
  fileName,
  source,
}: DownloadOptions) {
  const base64 = await urlToBase64(source);
  downloadFileFromBase64({ fileName, source: base64 });
}

export function downloadFileFromBlob({
  fileName = DEFAULT_FILENAME,
  source,
}: DownloadOptions<Blob>): void {
  if (!(source instanceof Blob)) {
    throw new TypeError('Invalid Blob data.');
  }
  if (!supportsObjectUrl()) {
    throw new Error(DOWNLOAD_ERROR_MESSAGE);
  }

  const url = URL.createObjectURL(source);
  triggerDownload(url, fileName, { revokeObjectUrl: true });
}

export function downloadFileFromBlobPart({
  fileName = DEFAULT_FILENAME,
  source,
}: DownloadOptions<BlobPart>): void {
  if (!supportsObjectUrl()) {
    throw new Error(DOWNLOAD_ERROR_MESSAGE);
  }

  const blob =
    source instanceof Blob
      ? source
      : new Blob([source], { type: 'application/octet-stream' });

  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName, { revokeObjectUrl: true });
}

export function urlToBase64(url: string, mineType?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let canvas = document.createElement('canvas') as HTMLCanvasElement | null;
    const ctx = canvas?.getContext('2d');
    const img = new Image();

    img.crossOrigin = '';
    img.addEventListener('load', () => {
      if (!canvas || !ctx) {
        return reject(new Error('Failed to create canvas.'));
      }

      canvas.height = img.height;
      canvas.width = img.width;
      ctx.drawImage(img, 0, 0);

      const dataURL = canvas.toDataURL(mineType || 'image/png');

      canvas = null;
      resolve(dataURL);
    });
    img.src = url;
  });
}

export function triggerDownload(
  href: string,
  fileName: string | undefined,
  options: TriggerDownloadOptions = {},
): void {
  const {
    revokeDelay = 100,
    revokeObjectUrl = false,
    target = '_blank',
  } = options;
  const finalFileName = sanitizeFileName(fileName || DEFAULT_FILENAME);

  try {
    if (supportsAnchorDownload() && tryAnchorDownload(href, finalFileName)) {
      return;
    }

    if (tryOpenWindow(href, target)) {
      return;
    }

    if (tryNavigate(href)) {
      return;
    }
  } finally {
    if (revokeObjectUrl && href.startsWith('blob:')) {
      setTimeout(() => {
        URL.revokeObjectURL(href);
      }, revokeDelay);
    }
  }

  throw new Error(DOWNLOAD_ERROR_MESSAGE);
}

export function resolveFileName(url: string, fileName?: string): string {
  if (fileName) {
    return sanitizeFileName(fileName);
  }

  const derivedFileName = resolveFileNameFromUrl(url);
  return sanitizeFileName(derivedFileName || DEFAULT_FILENAME);
}

export function sanitizeFileName(fileName: string): string {
  const sanitized = fileName
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .trim();

  return sanitized || DEFAULT_FILENAME;
}

function resolveFileNameFromUrl(url: string): null | string {
  const pathname = parsePathname(url);
  const fileName = pathname.split('/').filter(Boolean).pop();

  if (!fileName) {
    return null;
  }

  return safeDecodeURIComponent(fileName);
}

function parsePathname(url: string): string {
  try {
    return new URL(url, window.location.href).pathname;
  } catch {
    return url.split('#')[0]?.split('?')[0] || '';
  }
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function tryAnchorDownload(href: string, fileName: string): boolean {
  try {
    const link = document.createElement('a');

    link.href = href;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    document.body.append(link);
    link.click();
    link.remove();

    return true;
  } catch {
    return false;
  }
}

function tryNavigate(href: string): boolean {
  try {
    window.location.assign(href);
    return true;
  } catch {
    return false;
  }
}

function tryOpenWindow(href: string, target: string): boolean {
  if (!supportsWindowOpen()) {
    return false;
  }

  try {
    return window.open(href, target, 'noopener=yes,noreferrer=yes') !== null;
  } catch {
    return false;
  }
}
