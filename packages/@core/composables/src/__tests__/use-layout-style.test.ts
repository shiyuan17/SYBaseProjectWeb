import { createApp, defineComponent, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLayoutContentStyle } from '../use-layout-style';

describe('useLayoutContentStyle', () => {
  const originalResizeObserver = globalThis.ResizeObserver;
  let rect = {
    bottom: 260,
    height: 200,
    left: 40,
    right: 340,
    top: 60,
    width: 300,
  };

  beforeEach(() => {
    rect = {
      bottom: 260,
      height: 200,
      left: 40,
      right: 340,
      top: 60,
      width: 300,
    };
    vi.useFakeTimers();
    vi.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(
      800,
    );
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
      1200,
    );
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
    vi.spyOn(
      HTMLElement.prototype,
      'getBoundingClientRect',
    ).mockImplementation(() => rect as DOMRect);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it('observes element size changes when ResizeObserver is available', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let triggerResize: null | (() => void) = null;
    let layoutState: ReturnType<typeof useLayoutContentStyle> | null = null;

    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        triggerResize = () => callback([], this as ResizeObserver);
      }

      disconnect = disconnect;

      observe = observe;

      unobserve = vi.fn();
    } as never;

    const TestComponent = defineComponent({
      template: '<div ref="contentElement"></div>',
      setup() {
        layoutState = useLayoutContentStyle();
        return layoutState;
      },
    });
    const root = document.createElement('div');
    const app = createApp(TestComponent);

    document.body.appendChild(root);
    app.mount(root);
    await nextTick();

    expect(observe).toHaveBeenCalledTimes(1);
    expect(layoutState?.visibleDomRect.value?.width).toBe(300);

    rect = {
      ...rect,
      bottom: 360,
      height: 280,
      right: 420,
      width: 380,
    };

    triggerResize?.();
    vi.advanceTimersByTime(16);
    await nextTick();

    expect(layoutState?.visibleDomRect.value?.width).toBe(380);

    app.unmount();
    root.remove();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('falls back to window resize events when ResizeObserver is unavailable', async () => {
    let layoutState: ReturnType<typeof useLayoutContentStyle> | null = null;

    globalThis.ResizeObserver = undefined as never;

    const TestComponent = defineComponent({
      template: '<div ref="contentElement"></div>',
      setup() {
        layoutState = useLayoutContentStyle();
        return layoutState;
      },
    });
    const root = document.createElement('div');
    const app = createApp(TestComponent);

    document.body.appendChild(root);
    app.mount(root);
    await nextTick();

    expect(layoutState?.visibleDomRect.value?.width).toBe(300);

    rect = {
      ...rect,
      bottom: 420,
      height: 320,
      right: 500,
      width: 460,
    };

    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(16);
    await nextTick();

    expect(layoutState?.visibleDomRect.value?.width).toBe(460);

    app.unmount();
    root.remove();
  });
});
