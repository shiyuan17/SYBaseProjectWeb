function canUseDocument() {
  return typeof document !== 'undefined';
}

function canUseWindow() {
  return typeof window !== 'undefined';
}

export function supportsAnchorDownload(): boolean {
  if (!canUseDocument()) {
    return false;
  }

  return 'download' in document.createElement('a');
}

export function supportsCanvasToBlob(): boolean {
  if (!canUseDocument()) {
    return false;
  }

  return typeof document.createElement('canvas').toBlob === 'function';
}

export function supportsObjectUrl(): boolean {
  return (
    typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' &&
    typeof URL.revokeObjectURL === 'function'
  );
}

export function supportsResizeObserver(): boolean {
  return typeof ResizeObserver !== 'undefined';
}

export function supportsWindowOpen(): boolean {
  return canUseWindow() && typeof window.open === 'function';
}
