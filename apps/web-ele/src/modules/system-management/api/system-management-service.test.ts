import { describe, expect, it } from 'vitest';

import {
  normalizeArrayResult,
  normalizePagedResult,
} from './system-management-service';

describe('system management service helpers', () => {
  it('normalizes array results to an empty array when payload is invalid', () => {
    expect(normalizeArrayResult([{ id: '1' }])).toEqual([{ id: '1' }]);
    expect(normalizeArrayResult(null)).toEqual([]);
    expect(normalizeArrayResult(undefined)).toEqual([]);
  });

  it('normalizes paged results with stable defaults', () => {
    expect(
      normalizePagedResult(
        {
          items: [{ id: '1' }],
          page: 3,
          size: 20,
          total: 99,
        },
        1,
        10,
      ),
    ).toEqual({
      items: [{ id: '1' }],
      page: 3,
      size: 20,
      total: 99,
    });

    expect(
      normalizePagedResult(
        {
          items: null as never,
          page: undefined as never,
          size: undefined as never,
          total: undefined as never,
        },
        2,
        50,
      ),
    ).toEqual({
      items: [],
      page: 2,
      size: 50,
      total: 0,
    });
  });
});
