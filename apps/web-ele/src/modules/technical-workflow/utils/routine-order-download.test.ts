import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadRoutineOrderBlobFile } from './routine-order-download';

describe('routine-order-download', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads the provided blob with the expected file name', () => {
    const blob = new Blob(['csv-content'], { type: 'text/csv;charset=utf-8' });
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock');
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    const anchor = document.createElement('a');
    const anchorClick = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const anchorRemove = vi
      .spyOn(anchor, 'remove')
      .mockImplementation(() => {});
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor);

    downloadRoutineOrderBlobFile(blob, 'routine-medical-orders-2026-06-23.csv');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(createElement).toHaveBeenCalledWith('a');
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(anchorRemove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});
