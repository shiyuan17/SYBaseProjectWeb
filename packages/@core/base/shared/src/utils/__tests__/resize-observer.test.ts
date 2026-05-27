import { afterEach, describe, expect, it, vi } from 'vitest';

import { observeElementResize } from '../resize-observer';

const originalResizeObserver = globalThis.ResizeObserver;

describe('observeElementResize', () => {
  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    vi.restoreAllMocks();
  });

  it('uses ResizeObserver when the browser supports it', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let triggerResize: null | (() => void) = null;

    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        triggerResize = () => callback([], this as ResizeObserver);
      }

      disconnect = disconnect;

      observe = observe;

      unobserve = vi.fn();
    } as never;

    const element = document.createElement('div');
    const onResize = vi.fn();
    const stopObserve = observeElementResize(element, onResize);

    expect(observe).toHaveBeenCalledWith(element);

    triggerResize?.();
    expect(onResize).toHaveBeenCalledTimes(1);

    stopObserve();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('falls back to window resize events when ResizeObserver is unavailable', () => {
    globalThis.ResizeObserver = undefined as never;

    const element = document.createElement('div');
    const onResize = vi.fn();
    const stopObserve = observeElementResize(element, onResize);

    window.dispatchEvent(new Event('resize'));
    expect(onResize).toHaveBeenCalledTimes(1);

    stopObserve();
    onResize.mockClear();

    window.dispatchEvent(new Event('resize'));
    expect(onResize).not.toHaveBeenCalled();
  });
});
