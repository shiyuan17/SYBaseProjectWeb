import { supportsResizeObserver } from './browser-capabilities';

type ResizeHandler = () => void;

export function observeElementResize(
  element: Element,
  onResize: ResizeHandler,
): () => void {
  if (supportsResizeObserver()) {
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }

  const handleWindowResize = () => {
    onResize();
  };

  window.addEventListener('resize', handleWindowResize);

  return () => {
    window.removeEventListener('resize', handleWindowResize);
  };
}
